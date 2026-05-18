/**
 * Astrobench live runtime — Phase 2.
 *
 * Takes Astro-flavored source and returns sandboxed HTML + extracted styles
 * to inject into the preview iframe. Designed for the curriculum, not for
 * being a faithful Astro compiler — see README sections in each helper for
 * what's supported and what isn't.
 *
 * Pipeline:
 *   1. splitFrontmatter — peel the --- block off the top
 *   2. extractStyles    — pull <style> tags out of the body
 *   3. evalFrontmatter  — run the frontmatter as JS, capture declared vars
 *   4. renderTemplate   — walk the body, processing components and {expr}
 *   5. sanitize         — strip scripts, on* handlers, javascript: urls
 */

export type ComponentRenderer = (
    props: Record<string, unknown>,
    children: string,
) => string;

export type RenderOptions = {
    components?: Record<string, ComponentRenderer>;
    /** Initial Astro.props value (used when rendering a component file standalone). */
    props?: Record<string, unknown>;
    /** Initial Astro.params value (used for dynamic-route templates). */
    params?: Record<string, unknown>;
    /** Extra scope bindings (e.g. mocked data fetches). */
    scope?: Record<string, unknown>;
};

export type RenderResult =
    | { ok: true; html: string; styles: string[]; warnings: string[] }
    | { ok: false; error: string; html: string; styles: string[] };

/** Pull anything between the first pair of --- markers off the top. */
export function splitFrontmatter(source: string): { frontmatter: string; body: string } {
    const trimmed = source.replace(/^\s+/, "");
    if (!trimmed.startsWith("---")) {
        return { frontmatter: "", body: source };
    }
    const rest = trimmed.slice(3);
    const end = rest.indexOf("\n---");
    if (end === -1) {
        return { frontmatter: "", body: source };
    }
    const frontmatter = rest.slice(0, end);
    const body = rest.slice(end + 4).replace(/^\n/, "");
    return { frontmatter, body };
}

/** Pull every <style>...</style> out of the body. */
export function extractStyles(body: string): { body: string; styles: string[] } {
    const styles: string[] = [];
    const cleaned = body.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, css) => {
        styles.push(String(css).trim());
        return "";
    });
    return { body: cleaned, styles };
}

/** Strip script tags, on* handlers, javascript: urls. */
export function sanitize(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<script[^>]*\/>/gi, "")
        .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
        .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
        .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
        .replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, '$1="#"')
        .replace(/(href|src)\s*=\s*'javascript:[^']*'/gi, "$1='#'");
}

/* ---------------------------------------------------------- frontmatter -- */

/**
 * Strip `import X from "..."` lines. Imports can't run in a Function body
 * and the components are supplied via options anyway.
 */
function stripImports(src: string): string {
    return src.replace(/^\s*import\s[^\n;]*;?\s*$/gm, "");
}

/** Collect identifiers declared with const/let/var, including destructuring. */
function collectDeclaredIdentifiers(src: string): string[] {
    const ids = new Set<string>();
    // Simple: const foo = ...
    for (const m of src.matchAll(/\b(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=/g)) {
        ids.add(m[1]);
    }
    // Destructuring: const { a, b: c, d = 1 } = ...
    for (const m of src.matchAll(/\b(?:const|let|var)\s+\{([^}]+)\}\s*=/g)) {
        for (const piece of m[1].split(",")) {
            const cleaned = piece.trim().split(":")[1]?.trim() ?? piece.trim();
            const name = cleaned.split("=")[0].trim();
            if (/^[a-zA-Z_$][\w$]*$/.test(name)) ids.add(name);
        }
    }
    // Array destructuring: const [a, b] = ...
    for (const m of src.matchAll(/\b(?:const|let|var)\s+\[([^\]]+)\]\s*=/g)) {
        for (const piece of m[1].split(",")) {
            const name = piece.trim().split("=")[0].trim();
            if (/^[a-zA-Z_$][\w$]*$/.test(name)) ids.add(name);
        }
    }
    // Function declarations
    for (const m of src.matchAll(/\bfunction\s+([a-zA-Z_$][\w$]*)/g)) {
        ids.add(m[1]);
    }
    return [...ids];
}

// AsyncFunction so frontmatter can use `await` (lesson 10: await fetch).
// Works fine for sync code too, just yields one microtask.
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
    ...args: string[]
) => (...args: unknown[]) => Promise<unknown>;

/** Strip `export` keyword so `export async function getStaticPaths` is valid in a function body. */
function stripExportKeyword(src: string): string {
    return src.replace(/^\s*export\s+/gm, "");
}

/**
 * Evaluate frontmatter JS in a sandboxed AsyncFunction and return a scope
 * object containing all top-level declared identifiers.
 */
async function evalFrontmatter(src: string, options: RenderOptions): Promise<Record<string, unknown>> {
    const stripped = stripExportKeyword(stripImports(src));
    const ids = collectDeclaredIdentifiers(stripped);
    const Astro = {
        props: options.props ?? {},
        params: options.params ?? {},
    };

    const scopeProps = ids
        .map((id) => `${id}: typeof ${id} !== "undefined" ? ${id} : undefined`)
        .join(", ");

    const body = `${stripped}\n;return { ${scopeProps} };`;
    const argNames: string[] = ["Astro"];
    const argValues: unknown[] = [Astro];

    for (const [k, v] of Object.entries(options.scope ?? {})) {
        argNames.push(k);
        argValues.push(v);
    }

    const fn = new AsyncFunction(...argNames, body);
    const out = (await fn(...argValues)) as Record<string, unknown>;
    out.Astro = Astro;
    return out;
}

/* ------------------------------------------------------------ template -- */

const VOID_TAGS = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
]);

type Scope = Record<string, unknown>;
type Components = Record<string, ComponentRenderer>;

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function escapeAttr(s: unknown): string {
    return String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;");
}

/** Marker used to opt a string out of HTML-escaping when rendered. */
class SafeHtml {
    constructor(public readonly html: string) {}
}

/** Turn an evaluated expression into output HTML. */
function renderValue(val: unknown): string {
    if (val == null || val === false) return "";
    if (val === true) return "";
    if (val instanceof SafeHtml) return val.html;
    if (Array.isArray(val)) return val.map(renderValue).join("");
    if (typeof val === "object") return "";
    return escapeHtml(String(val));
}

/** Find matching `}` for the `{` at position `from - 1`. */
function findMatching(src: string, from: number, open: string, close: string): number {
    let depth = 1;
    let i = from;
    let inStr: string | null = null;
    while (i < src.length) {
        const ch = src[i];
        if (inStr) {
            if (ch === "\\") {
                i += 2;
                continue;
            }
            if (ch === inStr) inStr = null;
            i++;
            continue;
        }
        if (ch === '"' || ch === "'" || ch === "`") {
            inStr = ch;
        } else if (ch === open) depth++;
        else if (ch === close) {
            depth--;
            if (depth === 0) return i;
        }
        i++;
    }
    return -1;
}

/**
 * Convert self-closing JSX-style component invocations inside a JS expression
 * to `__c('Tag', { ...props })` calls. Used inside `{ ... }` blocks.
 *
 * Handles: <Cap />, <Cap k="v" />, <Cap k={expr} />, <Cap {...obj} />.
 */
function compileJsx(src: string): string {
    let out = "";
    let i = 0;
    while (i < src.length) {
        // Look for <Capital
        if (src[i] === "<" && /[A-Z]/.test(src[i + 1] ?? "")) {
            const tagStart = i + 1;
            let j = tagStart;
            while (j < src.length && /[a-zA-Z0-9]/.test(src[j])) j++;
            const tagName = src.slice(tagStart, j);
            // Parse attributes until /> or end of input we don't have time for
            const attrs: string[] = [];
            while (j < src.length) {
                while (j < src.length && /\s/.test(src[j])) j++;
                if (src[j] === "/" && src[j + 1] === ">") {
                    j += 2;
                    break;
                }
                if (src[j] === ">") {
                    // Paired tag inside expression — not supported, bail
                    j++;
                    break;
                }
                // Spread: {...x}
                if (src[j] === "{" && src.slice(j, j + 4) === "{...") {
                    const end = findMatching(src, j + 1, "{", "}");
                    if (end === -1) break;
                    attrs.push("..." + src.slice(j + 4, end));
                    j = end + 1;
                    continue;
                }
                // name
                const nameStart = j;
                while (j < src.length && /[a-zA-Z0-9_\-]/.test(src[j])) j++;
                const name = src.slice(nameStart, j);
                if (!name) {
                    j++;
                    continue;
                }
                if (src[j] !== "=") {
                    attrs.push(`${JSON.stringify(name)}: true`);
                    continue;
                }
                j++;
                if (src[j] === "{") {
                    const end = findMatching(src, j + 1, "{", "}");
                    if (end === -1) break;
                    attrs.push(`${JSON.stringify(name)}: (${src.slice(j + 1, end)})`);
                    j = end + 1;
                } else if (src[j] === '"' || src[j] === "'") {
                    const q = src[j];
                    const valStart = ++j;
                    while (j < src.length && src[j] !== q) j++;
                    attrs.push(`${JSON.stringify(name)}: ${JSON.stringify(src.slice(valStart, j))}`);
                    j++;
                }
            }
            out += `__c(${JSON.stringify(tagName)}, { ${attrs.join(", ")} })`;
            i = j;
            continue;
        }
        out += src[i];
        i++;
    }
    return out;
}

/** Evaluate a JS expression string inside the frontmatter scope. */
function evalExpression(expr: string, scope: Scope, components: Components): unknown {
    const compiled = compileJsx(expr);
    const argNames = Object.keys(scope);
    const argValues = argNames.map((k) => scope[k]);
    argNames.push("__c");
    argValues.push((tag: string, props: Record<string, unknown>) => {
        const renderer = components[tag];
        if (!renderer) return new SafeHtml(`<!-- unknown component: ${escapeHtml(tag)} -->`);
        return new SafeHtml(renderer(props, ""));
    });
    const fn = new Function(...argNames, `return (${compiled});`);
    return fn(...argValues);
}

/**
 * Walk the body, processing `<Capitalized>` components and `{expr}` blocks
 * interleaved with literal HTML.
 */
function renderTemplate(body: string, scope: Scope, components: Components, depth: number): string {
    if (depth > 8) throw new Error("template too deeply nested");

    let out = "";
    let i = 0;
    while (i < body.length) {
        const ch = body[i];

        if (ch === "<" && /[A-Z]/.test(body[i + 1] ?? "")) {
            const result = parseComponent(body, i, scope, components, depth);
            out += result.html;
            i = result.end;
            continue;
        }

        if (ch === "<" && body[i + 1] === "!" && body.slice(i, i + 4) === "<!--") {
            const close = body.indexOf("-->", i + 4);
            if (close === -1) break;
            out += body.slice(i, close + 3);
            i = close + 3;
            continue;
        }

        if (ch === "{") {
            const close = findMatching(body, i + 1, "{", "}");
            if (close === -1) {
                out += ch;
                i++;
                continue;
            }
            const expr = body.slice(i + 1, close);
            try {
                const val = evalExpression(expr, scope, components);
                out += renderValue(val);
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                out += `<span style="color:#c84545;font-family:monospace;">{?? ${escapeHtml(msg)}}</span>`;
            }
            i = close + 1;
            continue;
        }

        out += ch;
        i++;
    }
    return out;
}

function parseComponent(
    body: string,
    start: number,
    scope: Scope,
    components: Components,
    depth: number,
): { html: string; end: number } {
    let j = start + 1;
    const tagStart = j;
    while (j < body.length && /[a-zA-Z0-9]/.test(body[j])) j++;
    const tagName = body.slice(tagStart, j);

    const attrs: Record<string, unknown> = {};
    let selfClosing = false;

    while (j < body.length) {
        while (j < body.length && /\s/.test(body[j])) j++;
        if (body[j] === "/" && body[j + 1] === ">") {
            selfClosing = true;
            j += 2;
            break;
        }
        if (body[j] === ">") {
            j++;
            break;
        }

        // Spread: {...obj}
        if (body[j] === "{" && body.slice(j, j + 4) === "{...") {
            const end = findMatching(body, j + 1, "{", "}");
            if (end === -1) break;
            try {
                const spread = evalExpression(body.slice(j + 4, end), scope, components);
                if (spread && typeof spread === "object") Object.assign(attrs, spread);
            } catch {
                // ignore broken spread
            }
            j = end + 1;
            continue;
        }

        const nameStart = j;
        while (j < body.length && /[a-zA-Z0-9_\-]/.test(body[j])) j++;
        const name = body.slice(nameStart, j);
        if (!name) {
            j++;
            continue;
        }

        if (body[j] !== "=") {
            attrs[name] = true;
            continue;
        }
        j++;
        if (body[j] === "{") {
            const end = findMatching(body, j + 1, "{", "}");
            if (end === -1) break;
            try {
                attrs[name] = evalExpression(body.slice(j + 1, end), scope, components);
            } catch {
                attrs[name] = undefined;
            }
            j = end + 1;
        } else if (body[j] === '"' || body[j] === "'") {
            const q = body[j];
            const valStart = ++j;
            while (j < body.length && body[j] !== q) j++;
            attrs[name] = body.slice(valStart, j);
            j++;
        }
    }

    let children = "";
    if (!selfClosing) {
        const closeTag = `</${tagName}>`;
        const closeIdx = body.indexOf(closeTag, j);
        if (closeIdx === -1) {
            return { html: "", end: body.length };
        }
        const rawChildren = body.slice(j, closeIdx);
        children = renderTemplate(rawChildren, scope, components, depth + 1);
        j = closeIdx + closeTag.length;
    }

    const renderer = components[tagName];
    if (!renderer) {
        return {
            html: `<!-- unknown component: ${escapeHtml(tagName)} -->`,
            end: j,
        };
    }
    return { html: renderer(attrs, children), end: j };
}

/* ----------------------------------------------------------- public API -- */

export async function renderAstro(source: string, options: RenderOptions = {}): Promise<RenderResult> {
    try {
        const { frontmatter, body: rawBody } = splitFrontmatter(source);
        const { body: bodyNoStyles, styles } = extractStyles(rawBody);

        let scope: Record<string, unknown> = frontmatter
            ? await evalFrontmatter(frontmatter, options)
            : { Astro: { props: options.props ?? {}, params: options.params ?? {} } };

        /*
         * If the user declared a `getStaticPaths` function, call it and grab the
         * first entry's { params, props }. The sandbox renders one route at a
         * time, so we pick the first generated path and re-evaluate the
         * frontmatter with those values bound to Astro.params / Astro.props.
         * This is what makes the lesson 9 demo actually respond when the user
         * edits the array of routes.
         */
        if (frontmatter && typeof scope.getStaticPaths === "function") {
            try {
                const paths = await (scope.getStaticPaths as () => unknown)();
                if (Array.isArray(paths) && paths.length > 0) {
                    const first = paths[0] as { params?: unknown; props?: unknown };
                    const nextProps =
                        first && typeof first.props === "object" && first.props !== null
                            ? (first.props as Record<string, unknown>)
                            : options.props;
                    const nextParams =
                        first && typeof first.params === "object" && first.params !== null
                            ? (first.params as Record<string, unknown>)
                            : options.params;
                    scope = await evalFrontmatter(frontmatter, {
                        ...options,
                        props: nextProps,
                        params: nextParams,
                    });
                    (scope as Record<string, unknown>).__route = first;
                }
            } catch {
                /* Bad getStaticPaths — fall through with the original scope. */
            }
        }

        // Merge in scope bindings supplied via options so template expressions can see them.
        for (const [k, v] of Object.entries(options.scope ?? {})) {
            if (!(k in scope)) scope[k] = v;
        }

        const components = options.components ?? {};
        const rendered = renderTemplate(bodyNoStyles, scope, components, 0);

        return { ok: true, html: sanitize(rendered).trim(), styles, warnings: [] };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { ok: false, error: msg, html: "", styles: [] };
    }
}

export { escapeAttr };
