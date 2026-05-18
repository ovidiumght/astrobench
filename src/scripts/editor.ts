import { EditorState, RangeSetBuilder, type Extension } from "@codemirror/state";
import {
    Decoration,
    EditorView,
    ViewPlugin,
    keymap,
    lineNumbers,
    highlightActiveLine,
    highlightActiveLineGutter,
    type DecorationSet,
    type ViewUpdate,
} from "@codemirror/view";
import { defaultKeymap, indentWithTab, history, historyKeymap } from "@codemirror/commands";
import { html, htmlLanguage } from "@codemirror/lang-html";
import { javascriptLanguage } from "@codemirror/lang-javascript";
import {
    HighlightStyle,
    LRLanguage,
    LanguageSupport,
    syntaxHighlighting,
    bracketMatching,
    indentOnInput,
    foldGutter,
} from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { parseMixed } from "@lezer/common";

/**
 * Paper-themed CodeMirror theme.
 * Mirrors the hand-authored highlighting in src/lib/hl.ts so the live
 * editor and the static <CodeCell> blocks look like the same notebook.
 */
const paperTheme = EditorView.theme(
    {
        "&": {
            backgroundColor: "transparent",
            color: "var(--color-ink-navy)",
            fontFamily: "var(--font-type)",
            fontSize: "14.5px",
            lineHeight: "1.85",
        },
        "&.cm-focused": {
            outline: "none",
        },
        ".cm-scroller": {
            fontFamily: "inherit",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(200, 69, 69, 0.35) transparent",
        },
        ".cm-scroller::-webkit-scrollbar": {
            width: "10px",
            height: "10px",
        },
        ".cm-scroller::-webkit-scrollbar-track": {
            background: "transparent",
            borderLeft: "1px dashed rgba(42, 51, 70, 0.1)",
            borderTop: "1px dashed rgba(42, 51, 70, 0.1)",
        },
        ".cm-scroller::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(200, 69, 69, 0.35)",
            border: "2px solid transparent",
            borderRadius: "999px",
            backgroundClip: "padding-box",
        },
        ".cm-scroller::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "rgba(200, 69, 69, 0.65)",
        },
        ".cm-scroller::-webkit-scrollbar-thumb:active": {
            backgroundColor: "var(--color-pen-red)",
        },
        ".cm-scroller::-webkit-scrollbar-corner": {
            background: "transparent",
        },
        ".cm-content": {
            caretColor: "var(--color-pen-red)",
            padding: "12px 16px",
        },
        ".cm-line": {
            padding: "0",
        },
        ".cm-cursor, .cm-dropCursor": {
            borderLeft: "2px solid var(--color-pen-red)",
        },
        ".cm-activeLine": {
            backgroundColor: "rgba(254, 250, 224, 0.4)",
        },
        ".cm-gutters": {
            backgroundColor: "transparent",
            border: "none",
            borderRight: "1px dashed rgba(42, 51, 70, 0.12)",
            color: "rgba(74, 88, 120, 0.5)",
            fontFamily: "var(--font-type)",
            fontSize: "14.5px",
        },
        ".cm-lineNumbers .cm-gutterElement": {
            padding: "0 12px 0 12px",
            minWidth: "2ch",
            textAlign: "right",
        },
        ".cm-activeLineGutter": {
            backgroundColor: "transparent",
            color: "var(--color-pen-red)",
            fontWeight: "bold",
        },
        ".cm-selectionMatch": {
            backgroundColor: "rgba(255, 230, 102, 0.35)",
        },
        ".cm-matchingBracket, .cm-nonmatchingBracket": {
            outline: "1px solid rgba(200, 69, 69, 0.3)",
        },
        ".cm-foldGutter .cm-gutterElement": {
            color: "rgba(74, 88, 120, 0.4)",
            padding: "0 4px",
            cursor: "pointer",
        },
        ".cm-tooltip": {
            backgroundColor: "var(--color-paper-yellow)",
            border: "1px solid var(--color-paper-edge)",
            fontFamily: "var(--font-type)",
        },
        ".cm-fm-fence": {
            color: "var(--color-pen-red)",
            fontWeight: "bold",
            letterSpacing: "0.05em",
        },
    },
    { dark: false },
);

/**
 * Locate the Astro frontmatter region (between two `---` lines at the top
 * of the document). Returns null when there is no closing fence yet.
 */
function findFrontmatter(text: string): { from: number; to: number } | null {
    const start = text.match(/^---\r?\n/);
    if (!start) return null;
    const startOffset = start[0].length;
    const rest = text.slice(startOffset);
    // Closing fence must be on its own line (newline-prefixed) or at end of doc.
    const end = rest.match(/(?:^|\r?\n)---(?:\r?\n|$)/);
    if (!end || end.index === undefined) return null;
    // Skip the leading newline (if any) so `to` points right before the fence.
    const offsetIntoRest = end.index + (rest[end.index] === "\n" || rest[end.index] === "\r" ? (rest[end.index] === "\r" ? 2 : 1) : 0);
    const endOffset = startOffset + offsetIntoRest;
    if (endOffset <= startOffset) return null;
    return { from: startOffset, to: endOffset };
}

/**
 * Astro language support: HTML with the frontmatter region overlay-parsed
 * as JavaScript. Top-level keywords/strings/numbers/etc. inside the
 * `---` fences pick up the same paper-themed highlight as the HTML body.
 */
const astroParser = htmlLanguage.parser.configure({
    wrap: parseMixed((node, input) => {
        if (!node.type.isTop) return null;
        const max = Math.min(input.length, 16384);
        const text = input.read(0, max);
        const range = findFrontmatter(text);
        if (!range) return null;
        return {
            parser: javascriptLanguage.parser,
            overlay: [range],
        };
    }),
});

const astroLanguage = LRLanguage.define({
    name: "astro",
    parser: astroParser,
});

/**
 * Re-use everything `html()` adds (auto-close tags, completion, language data)
 * but swap in the mixed-parser language above.
 */
function astro(): LanguageSupport {
    const base = html({ matchClosingTags: true, autoCloseTags: true });
    return new LanguageSupport(astroLanguage, base.support);
}

/**
 * Decoration overlay that paints the `---` fence lines in pen-red so the
 * frontmatter boundaries pop out visually.
 */
const frontmatterFence = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;
        constructor(view: EditorView) {
            this.decorations = this.build(view);
        }
        update(u: ViewUpdate) {
            if (u.docChanged || u.viewportChanged) this.decorations = this.build(u.view);
        }
        build(view: EditorView): DecorationSet {
            const builder = new RangeSetBuilder<Decoration>();
            const text = view.state.doc.toString();
            const fenceDec = Decoration.mark({ class: "cm-fm-fence" });
            const openMatch = text.match(/^---/);
            if (openMatch) builder.add(0, 3, fenceDec);
            const closeMatch = text.match(/(?:^|\n)---(?:\n|$)/);
            if (closeMatch && closeMatch.index !== undefined && closeMatch.index > 0) {
                const fenceStart = closeMatch.index + (text[closeMatch.index] === "\n" ? 1 : 0);
                builder.add(fenceStart, fenceStart + 3, fenceDec);
            }
            return builder.finish();
        }
    },
    { decorations: (v) => v.decorations },
);

const paperHighlight = HighlightStyle.define([
    { tag: t.keyword, color: "var(--color-pen-red)" },
    { tag: t.controlKeyword, color: "var(--color-pen-red)" },
    { tag: t.moduleKeyword, color: "var(--color-pen-red)" },
    { tag: [t.string, t.special(t.string)], color: "var(--color-pen-green)" },
    { tag: [t.tagName, t.angleBracket], color: "var(--color-pen-blue)" },
    { tag: t.attributeName, color: "var(--color-pen-purple)" },
    { tag: t.attributeValue, color: "var(--color-pen-green)" },
    { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--color-ink-soft)", fontStyle: "italic" },
    { tag: t.number, color: "var(--color-pen-green)" },
    { tag: t.bool, color: "var(--color-pen-red)" },
    { tag: t.null, color: "var(--color-pen-red)" },
    { tag: t.operator, color: "var(--color-ink-soft)" },
    { tag: t.punctuation, color: "var(--color-ink-soft)" },
    { tag: t.bracket, color: "var(--color-ink-soft)" },
    { tag: t.brace, color: "var(--color-ink-soft)" },
    { tag: t.variableName, color: "var(--color-ink-navy)" },
    { tag: t.propertyName, color: "var(--color-ink-navy)" },
    { tag: t.function(t.variableName), color: "var(--color-pen-blue)" },
    { tag: t.heading, color: "var(--color-pen-red)", fontWeight: "bold" },
]);

const baseExtensions: Extension[] = [
    lineNumbers(),
    history(),
    foldGutter({
        markerDOM: (open) => {
            const span = document.createElement("span");
            span.textContent = open ? "▾" : "▸";
            span.style.cursor = "pointer";
            return span;
        },
    }),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    bracketMatching(),
    indentOnInput(),
    astro(),
    syntaxHighlighting(paperHighlight),
    frontmatterFence,
    paperTheme,
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
];

export type EditorHandle = {
    view: EditorView;
    getValue: () => string;
    setValue: (value: string) => void;
};

/**
 * Mount a CodeMirror editor into `parent`.
 * Calls `onChange` whenever the document changes.
 */
export function createEditor(
    parent: HTMLElement,
    initialValue: string,
    onChange: (value: string) => void,
): EditorHandle {
    const state = EditorState.create({
        doc: initialValue,
        extensions: [
            ...baseExtensions,
            EditorView.updateListener.of((update) => {
                if (update.docChanged) onChange(update.state.doc.toString());
            }),
        ],
    });
    const view = new EditorView({ state, parent });
    return {
        view,
        getValue: () => view.state.doc.toString(),
        setValue: (value: string) => {
            view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: value },
            });
        },
    };
}
