/**
 * Client-side progress store, backed by localStorage.
 *
 * Tracks XP, earned badges, completed lessons, the most recently visited
 * lesson, and the user's per-cell editor contents so a learner doesn't lose
 * their work or progress between sessions.
 *
 * Everything is SSR-safe (guards on `typeof window`) so this can be imported
 * from Astro frontmatter when needed, even though all real work happens in
 * the browser.
 */

import { chapter1, chapter2, findLesson, lessonUrl, type Lesson } from "~/lib/lessons";

const STORAGE_KEY = "astrobench:progress:v1";
const EVENT = "astrobench:progress-change";

export type ProgressState = {
    v: 1;
    xp: number;
    badges: string[];
    completed: string[];
    lastLessonSlug: string | null;
    cells: Record<string, string>;
};

const emptyState = (): ProgressState => ({
    v: 1,
    xp: 0,
    badges: [],
    completed: [],
    lastLessonSlug: null,
    cells: {},
});

function read(): ProgressState {
    if (typeof window === "undefined") return emptyState();
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return emptyState();
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.v !== 1) return emptyState();
        return {
            v: 1,
            xp: Number(parsed.xp) || 0,
            badges: Array.isArray(parsed.badges) ? parsed.badges : [],
            completed: Array.isArray(parsed.completed) ? parsed.completed : [],
            lastLessonSlug: typeof parsed.lastLessonSlug === "string" ? parsed.lastLessonSlug : null,
            cells:
                parsed.cells && typeof parsed.cells === "object"
                    ? (parsed.cells as Record<string, string>)
                    : {},
        };
    } catch {
        return emptyState();
    }
}

function write(state: ProgressState) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        window.dispatchEvent(new CustomEvent(EVENT, { detail: state }));
    } catch {
        // ignore quota / private-mode errors
    }
}

export function getProgress(): ProgressState {
    return read();
}

export function onProgressChange(cb: (state: ProgressState) => void): () => void {
    if (typeof window === "undefined") return () => undefined;
    const handler = (e: Event) => cb((e as CustomEvent<ProgressState>).detail);
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
}

export function markLessonVisited(slug: string) {
    const state = read();
    if (state.lastLessonSlug === slug) return;
    state.lastLessonSlug = slug;
    write(state);
}

/**
 * Record completion of a lesson. Awards XP and (if defined) the badge on
 * first completion only; re-completing is a no-op so XP can't be farmed.
 */
export function markLessonComplete(slug: string): ProgressState {
    const state = read();
    const lesson = findLesson(slug);
    if (!lesson) return state;
    if (state.completed.includes(slug)) return state;

    state.completed = [...state.completed, slug];
    state.xp += lesson.xp;
    if (lesson.badge && !state.badges.includes(lesson.badge)) {
        state.badges = [...state.badges, lesson.badge];
    }
    write(state);
    return state;
}

export function saveCellContent(cellId: string, contents: string) {
    const state = read();
    if (state.cells[cellId] === contents) return;
    state.cells = { ...state.cells, [cellId]: contents };
    write(state);
}

export function getCellContent(cellId: string): string | undefined {
    return read().cells[cellId];
}

export function clearCellContent(cellId: string) {
    const state = read();
    if (!(cellId in state.cells)) return;
    const next = { ...state.cells };
    delete next[cellId];
    state.cells = next;
    write(state);
}

export function resetProgress() {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent(EVENT, { detail: emptyState() }));
    } catch {
        // ignore
    }
}

/* ---------------------------------------------- summarized lookups -- */

export function isLessonComplete(slug: string, state = read()): boolean {
    return state.completed.includes(slug);
}

export function hasBadge(name: string, state = read()): boolean {
    return state.badges.includes(name);
}

export function totalLessons(): number {
    return chapter1.lessons.length + chapter2.lessons.length;
}

export function chapterCompletion(chapterId: string, state = read()): {
    done: number;
    total: number;
    pct: number;
} {
    const chapter = chapterId === "astro-101" ? chapter1 : chapter2;
    const done = chapter.lessons.filter((l) => state.completed.includes(l.slug)).length;
    const total = chapter.lessons.length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function nextIncompleteLesson(state = read()): Lesson | null {
    for (const c of [chapter1, chapter2]) {
        for (const l of c.lessons) {
            if (!state.completed.includes(l.slug)) return l;
        }
    }
    return null;
}

export function resumeUrl(state = read()): string | null {
    if (state.lastLessonSlug) {
        const l = findLesson(state.lastLessonSlug);
        if (l) return lessonUrl(l);
    }
    const next = nextIncompleteLesson(state);
    return next ? lessonUrl(next) : null;
}
