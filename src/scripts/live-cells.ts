import { renderAstro } from "~/runtime/render";
import { createEditor, type EditorHandle } from "~/scripts/editor";
import { getCellConfig, onCellRegistered, toRenderOptions } from "~/runtime/registry";
import { clearCellContent, getCellContent, saveCellContent } from "~/scripts/progress";

type LiveCellElement = HTMLElement & { __wired?: boolean; __editor?: EditorHandle };

const editors = new Map<string, EditorHandle>();
const cellElements = new Map<string, LiveCellElement>();

/**
 * Per-cell render generation counter. Because renderAstro is async (it can
 * await fetch), a slow first render can finish AFTER a fast second one and
 * overwrite its result. Each call bumps the generation and the result is
 * only applied if the generation hasn't moved on.
 */
const renderGen = new Map<string, number>();

export function getCellValue(cellId: string): string | null {
    return editors.get(cellId)?.getValue() ?? null;
}

function findPeer(id: string, selector: string): HTMLElement | null {
    return document.querySelector(`[data-live-preview="${CSS.escape(id)}"] ${selector}`);
}

const STYLE_TAG_ID = "__astrobench_user_styles";

type SandboxedDocument = Document & { __astrobenchClickGuarded?: boolean };

/**
 * Stop the iframe from navigating away when users click rendered links.
 * The preview is a sandbox: the template is just visual, so an `<a href="/">
 * ← back</a>` should look clickable but do nothing (otherwise the iframe ends
 * up loading the dev server's homepage inside the polaroid). Installed once
 * per iframe document; survives subsequent body.innerHTML rewrites because
 * the listener lives on the document itself.
 */
function installLinkGuard(doc: SandboxedDocument) {
    if (doc.__astrobenchClickGuarded) return;
    doc.__astrobenchClickGuarded = true;
    doc.addEventListener(
        "click",
        (e) => {
            const target = e.target as Element | null;
            const anchor = target?.closest?.("a");
            if (!anchor) return;
            e.preventDefault();
            e.stopPropagation();
            // Tiny acknowledgement so the click doesn't feel dead.
            (anchor as HTMLElement).animate(
                [{ opacity: 1 }, { opacity: 0.4 }, { opacity: 1 }],
                { duration: 240, easing: "ease-out" },
            );
        },
        true,
    );
}

function writeFrame(frame: HTMLIFrameElement, html: string, styles: string[], baseStyles: string | undefined) {
    const doc = frame.contentDocument as SandboxedDocument | null;
    if (!doc) return;

    installLinkGuard(doc);

    if (doc.head) {
        let userStyles = doc.head.querySelector<HTMLStyleElement>(`style#${STYLE_TAG_ID}`);
        if (!userStyles) {
            userStyles = doc.createElement("style");
            userStyles.id = STYLE_TAG_ID;
            doc.head.appendChild(userStyles);
        }
        const combined = [baseStyles, ...styles].filter(Boolean).join("\n");
        userStyles.textContent = combined;
    }

    if (doc.body) doc.body.innerHTML = html;
}

async function updatePreview(cell: LiveCellElement, value: string) {
    const cellId = cell.getAttribute("data-live-cell");
    if (!cellId) return;

    const gen = (renderGen.get(cellId) ?? 0) + 1;
    renderGen.set(cellId, gen);

    const frame = findPeer(cellId, "iframe[data-live-preview-frame]") as HTMLIFrameElement | null;
    const errBox = findPeer(cellId, "[data-live-preview-error]");
    const statusText = cell.querySelector("[data-live-status-text]") as HTMLElement | null;
    const statusDot = cell.querySelector("[data-live-status] > span:first-child") as HTMLElement | null;

    const config = getCellConfig(cellId);
    const result = await renderAstro(value, toRenderOptions(config));

    // If a newer render started while we were awaiting, drop our result.
    if (renderGen.get(cellId) !== gen) return;

    if (frame) {
        if (result.ok) {
            writeFrame(frame, result.html, result.styles, config.baseStyles);
        } else {
            writeFrame(frame, "", [], config.baseStyles);
        }
    }

    if (errBox) {
        if (result.ok) {
            errBox.classList.add("hidden");
            errBox.textContent = "";
        } else {
            errBox.classList.remove("hidden");
            errBox.textContent = `⚠ ${result.error}`;
        }
    }

    if (statusText) statusText.textContent = result.ok ? "live" : "syntax error";
    if (statusDot) {
        statusDot.classList.remove("bg-pen-green", "bg-pen-red");
        statusDot.classList.add(result.ok ? "bg-pen-green" : "bg-pen-red");
    }

    cell.dispatchEvent(
        new CustomEvent("live-cell:change", {
            detail: { cellId, value, result },
            bubbles: true,
        }),
    );
}

function wireCell(cell: LiveCellElement) {
    if (cell.__wired) return;
    cell.__wired = true;

    const cellId = cell.getAttribute("data-live-cell");
    if (!cellId) return;

    const mount = cell.querySelector<HTMLElement>("[data-live-cell-mount]");
    if (!mount) return;

    const initial = cell.getAttribute("data-live-initial") ?? "";
    const saved = getCellContent(cellId);
    const startValue = saved ?? initial;

    mount.innerHTML = "";

    const editor = createEditor(mount, startValue, (value) => {
        saveCellContent(cellId, value);
        updatePreview(cell, value);
    });
    cell.__editor = editor;
    editors.set(cellId, editor);
    cellElements.set(cellId, cell);

    const resetBtn = cell.querySelector<HTMLButtonElement>("[data-live-reset]");
    resetBtn?.addEventListener("click", () => {
        clearCellContent(cellId);
        editor.setValue(initial);
        editor.view.focus();
    });

    const tryInitial = () => {
        const frame = findPeer(cellId, "iframe[data-live-preview-frame]") as HTMLIFrameElement | null;
        if (!frame || !frame.contentDocument || frame.contentDocument.readyState !== "complete") {
            setTimeout(tryInitial, 16);
            return;
        }
        updatePreview(cell, editor.getValue());
    };
    tryInitial();
}

export function wireAll() {
    document.querySelectorAll<LiveCellElement>("[data-live-cell]").forEach((el) => wireCell(el));
}

// Re-render when a lesson registers / updates its component config after wiring.
onCellRegistered((cellId) => {
    const cell = cellElements.get(cellId);
    const editor = editors.get(cellId);
    if (cell && editor) updatePreview(cell, editor.getValue());
});

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireAll);
} else {
    wireAll();
}

document.addEventListener("astro:page-load", wireAll);
