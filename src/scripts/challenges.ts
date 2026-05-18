import { renderAstro } from "~/runtime/render";
import { evaluateCheck, type Check } from "~/runtime/checks";
import { getCellValue } from "~/scripts/live-cells";
import { getCellConfig, toRenderOptions } from "~/runtime/registry";
import { isLessonComplete, markLessonComplete } from "~/scripts/progress";
import { burstConfetti } from "~/scripts/confetti";

type ChallengeRoot = HTMLElement & { __wired?: boolean };

function readCheck(item: HTMLElement): Check | null {
    const raw = item.getAttribute("data-check");
    if (!raw) return null;
    try {
        return JSON.parse(raw) as Check;
    } catch {
        return null;
    }
}

function wireChallenge(root: ChallengeRoot) {
    if (root.__wired) return;
    root.__wired = true;

    const cellId = root.getAttribute("data-challenge-cell");
    if (!cellId) return;
    const lessonSlug = root.getAttribute("data-lesson-slug") || null;

    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-challenge-item]"));
    const checks = items.map((node) => ({ node, check: readCheck(node) }));

    const counter = root.querySelector<HTMLElement>("[data-challenge-count]");
    const aggregate = root.querySelector<HTMLElement>("[data-challenge-aggregate]");
    const aggregateText = root.querySelector<HTMLElement>("[data-challenge-aggregate-text]");
    const aggregateDone = root.querySelector<HTMLElement>("[data-challenge-aggregate-done]");

    let lastComplete = false;

    const runChecks = async (source: string) => {
        const result = await renderAstro(source, toRenderOptions(getCellConfig(cellId)));
        const output = result.ok ? result.html : "";

        let passed = 0;
        for (const { node, check } of checks) {
            const ok = check ? evaluateCheck(check, source, output) : false;
            node.setAttribute("data-passed", ok ? "true" : "false");
            if (ok) passed++;
        }

        if (counter) counter.textContent = String(passed);

        const complete = passed === checks.length && checks.length > 0;
        if (aggregate) {
            aggregate.setAttribute("data-challenge-complete", complete ? "true" : "false");
        }
        root.setAttribute("data-challenge-complete", complete ? "true" : "false");

        if (aggregateText && aggregateDone) {
            if (complete) {
                aggregateText.classList.add("hidden");
                aggregateDone.classList.remove("hidden");
            } else {
                aggregateText.classList.remove("hidden");
                aggregateDone.classList.add("hidden");

                if (passed === 0) {
                    aggregateText.textContent = "keep going…";
                } else if (passed === checks.length - 1) {
                    aggregateText.textContent = "one more!";
                } else {
                    aggregateText.textContent = `${passed} down, ${checks.length - passed} to go…`;
                }
            }
        }

        if (complete && !lastComplete) {
            celebrate(root);
            // Only fire the big celebration on FIRST completion ever — re-runs
            // (e.g. user keeps tweaking after completing) shouldn't keep showering.
            if (lessonSlug && !isLessonComplete(lessonSlug)) {
                const updated = markLessonComplete(lessonSlug);
                burstConfetti(root);
                showCompletionToast(lessonSlug, updated.xp);
            }
        }
        lastComplete = complete;
    };

    document.addEventListener("live-cell:change", (e) => {
        const ev = e as CustomEvent<{ cellId: string; value: string }>;
        if (ev.detail?.cellId !== cellId) return;
        runChecks(ev.detail.value);
    });

    const initial = getCellValue(cellId);
    if (initial != null) runChecks(initial);
}

function celebrate(root: HTMLElement) {
    root.animate(
        [
            { transform: root.style.transform || "rotate(-1.5deg)" },
            { transform: "rotate(-3deg) scale(1.03)" },
            { transform: "rotate(0.5deg) scale(1.01)" },
            { transform: root.style.transform || "rotate(-1.5deg)" },
        ],
        { duration: 600, easing: "ease-out" },
    );
}

/** Small "lesson X complete · +N XP" toast that floats up and fades. */
function showCompletionToast(slug: string, totalXp: number) {
    const toast = document.createElement("div");
    toast.className =
        "fixed left-1/2 bottom-10 -translate-x-1/2 z-[100] bg-paper-yellow border-2 border-pen-red shadow-paper px-5 py-3 rounded-md font-sketch text-ink-dark text-lg pointer-events-none";
    toast.style.transform = "translate(-50%, 30px) rotate(-1.5deg)";
    toast.style.opacity = "0";
    toast.innerHTML = `<span class="text-pen-red">★</span> lesson complete · <span class="text-pen-red">${totalXp} XP total</span>`;
    document.body.appendChild(toast);

    toast.animate(
        [
            { transform: "translate(-50%, 30px) rotate(-1.5deg)", opacity: 0 },
            { transform: "translate(-50%, 0) rotate(-1.5deg)", opacity: 1 },
            { transform: "translate(-50%, 0) rotate(-1.5deg)", opacity: 1, offset: 0.7 },
            { transform: "translate(-50%, -20px) rotate(-1.5deg)", opacity: 0 },
        ],
        { duration: 3500, easing: "ease-out", fill: "forwards" },
    );

    setTimeout(() => toast.remove(), 3700);
}

function wireAll() {
    document.querySelectorAll<ChallengeRoot>("[data-challenge]").forEach((el) => wireChallenge(el));
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireAll);
} else {
    wireAll();
}

document.addEventListener("astro:page-load", wireAll);
