export type Lesson = {
    slug: string;
    chapterId: string;
    step: number;
    title: string;
    subtitle: string;
    concept: string;
    storyBeat: string;
    xp: number;
    minutes: number;
    badge?: string;
};

export type Chapter = {
    id: string;
    number: number;
    name: string;
    shortName: string;
    tagline: string;
    lessons: Lesson[];
};

type LessonInput = Omit<Lesson, "chapterId">;
type ChapterInput = Omit<Chapter, "lessons"> & { lessons: LessonInput[] };

function makeChapter(input: ChapterInput): Chapter {
    return {
        ...input,
        lessons: input.lessons.map((l) => ({ ...l, chapterId: input.id })),
    };
}

export const chapter1 = makeChapter({
    id: "astro-101",
    number: 1,
    name: "Astro 101: Mission Control",
    shortName: "Astro 101",
    tagline: "Build and publish a multi-page astronaut dashboard, one lesson at a time.",
    lessons: [
        {
            slug: "01-hello-page",
            step: 1,
            title: "Hello, page",
            subtitle: "Your first Astro page",
            concept: "What lives in src/pages/",
            storyBeat: "Mission Control here. Say hi to the world — and meet your project.",
            xp: 30,
            minutes: 2,
        },
        {
            slug: "02-style-it-up",
            step: 2,
            title: "Style it up",
            subtitle: "Scoped <style> blocks",
            concept: "Styles that don't leak",
            storyBeat: "Looking plain. Give it some atmosphere.",
            xp: 50,
            minutes: 3,
            badge: "Stylist",
        },
        {
            slug: "03-extract-a-component",
            step: 3,
            title: "Extract a component",
            subtitle: "Components, frontmatter, {expressions}",
            concept: "Move the card into its own file",
            storyBeat: "You'll want many cards. Time to make one you can reuse.",
            xp: 70,
            minutes: 4,
            badge: "First Component",
        },
        {
            slug: "04-pass-them-around",
            step: 4,
            title: "Pass them around",
            subtitle: "Props with Astro.props",
            concept: "One component, many astronauts",
            storyBeat: "Mission Control sends many astronauts. Make the card take a name.",
            xp: 75,
            minutes: 4,
            badge: "Props Pilot",
        },
        {
            slug: "05-the-whole-crew",
            step: 5,
            title: "The whole crew",
            subtitle: "Arrays + .map()",
            concept: "Render one card per item",
            storyBeat: "We have six astronauts. Show them all.",
            xp: 75,
            minutes: 4,
            badge: "Crew Caller",
        },
        {
            slug: "06-status-check",
            step: 6,
            title: "Status check",
            subtitle: "Conditional rendering",
            concept: "Different output for different data",
            storyBeat: "Some are in orbit, some are Earth-side. Show the right one.",
            xp: 60,
            minutes: 3,
        },
        {
            slug: "07-a-second-page",
            step: 7,
            title: "A second page",
            subtitle: "File-based routing",
            concept: "Every file in pages/ is a route",
            storyBeat: "Press wants a page about Mission Control. It's just a new file.",
            xp: 60,
            minutes: 3,
        },
        {
            slug: "08-profile-pages",
            step: 8,
            title: "Profile pages",
            subtitle: "Dynamic routes with [brackets]",
            concept: "One file, many URLs",
            storyBeat: "Every astronaut wants their own page. Astro can do that with one file.",
            xp: 80,
            minutes: 4,
        },
        {
            slug: "09-static-paths",
            step: 9,
            title: "Static paths, properly",
            subtitle: "getStaticPaths up close",
            concept: "Tell Astro which pages to build",
            storyBeat: "Pull back the curtain on the function that generates those pages.",
            xp: 100,
            minutes: 5,
            badge: "Path Maker",
        },
        {
            slug: "10-live-from-the-api",
            step: 10,
            title: "Live from the API",
            subtitle: "fetch() in the frontmatter",
            concept: "Astro renders on the server",
            storyBeat: "Stop hardcoding. Use real data.",
            xp: 90,
            minutes: 4,
        },
        {
            slug: "11-take-it-live",
            step: 11,
            title: "Take it live",
            subtitle: "Publish to a real URL",
            concept: "Your tutorial becomes a real site",
            storyBeat: "Send Mission Control to the world.",
            xp: 130,
            minutes: 2,
            badge: "Mission Commander",
        },
    ],
});

export const chapter2 = makeChapter({
    id: "mission-log",
    number: 2,
    name: "Mission Log: Make it real",
    shortName: "Mission Log",
    tagline: "Layouts, content, islands, and a real launch — turn your dashboard into a product.",
    lessons: [
        {
            slug: "01-a-shared-shell",
            step: 1,
            title: "A shared shell",
            subtitle: "Layouts with <slot />",
            concept: "Stop repeating <head> on every page",
            storyBeat: "Three pages, three duplicate <head>s. Time to share.",
            xp: 70,
            minutes: 3,
            badge: "Architect",
        },
        {
            slug: "02-add-some-markdown",
            step: 2,
            title: "Add some Markdown",
            subtitle: "Import .md files directly",
            concept: "Astro understands Markdown out of the box",
            storyBeat: "Mission Control needs a way to publish updates. Write prose.",
            xp: 70,
            minutes: 3,
        },
        {
            slug: "03-make-a-collection",
            step: 3,
            title: "Make a collection",
            subtitle: "Content collections with a schema",
            concept: "One folder. One schema. Typed entries.",
            storyBeat: "Logs need structure. Type them up properly.",
            xp: 90,
            minutes: 4,
            badge: "Curator",
        },
        {
            slug: "04-pictures-perfected",
            step: 4,
            title: "Pictures, perfected",
            subtitle: "The <Image> component",
            concept: "Astro optimizes your images automatically",
            storyBeat: "Photos from the launch pad. Don't ship them at 4MB.",
            xp: 60,
            minutes: 3,
        },
        {
            slug: "05-first-island",
            step: 5,
            title: "First island",
            subtitle: "client:load for real interactivity",
            concept: "Opt into JavaScript exactly where you need it",
            storyBeat: "Readers want to react. Give them a hype button.",
            xp: 100,
            minutes: 5,
            badge: "Island Hopper",
        },
        {
            slug: "06-when-to-hydrate",
            step: 6,
            title: "When to hydrate",
            subtitle: "client:visible · client:idle · client:only",
            concept: "Defer JS so your page stays fast",
            storyBeat: "Below the fold? Don't load it yet.",
            xp: 80,
            minutes: 4,
        },
        {
            slug: "07-an-api-endpoint",
            step: 7,
            title: "An API endpoint",
            subtitle: "Server routes in src/pages/api/",
            concept: "Astro pages can return JSON too",
            storyBeat: "Sometimes you want data, not HTML. Astro can do both.",
            xp: 80,
            minutes: 4,
            badge: "Endpoint Engineer",
        },
        {
            slug: "08-search-the-logs",
            step: 8,
            title: "Search the logs",
            subtitle: "Island + API endpoint together",
            concept: "Real client-side data fetching",
            storyBeat: "Type. Find. Pop. The whole loop.",
            xp: 110,
            minutes: 5,
            badge: "Hyperdrive",
        },
        {
            slug: "09-smooth-as-silk",
            step: 9,
            title: "Smooth as silk",
            subtitle: "View transitions",
            concept: "Pages slide instead of flicker",
            storyBeat: "Make it feel like an app, not a stack of HTML.",
            xp: 70,
            minutes: 3,
        },
        {
            slug: "10-ship-it-for-real",
            step: 10,
            title: "Ship it for real",
            subtitle: "Deploy to a real provider",
            concept: "Build, push, publish",
            storyBeat: "Custom domain. Real users. Real launch.",
            xp: 130,
            minutes: 3,
            badge: "Captain",
        },
    ],
});

export const chapters: Chapter[] = [chapter1, chapter2];

export function findLesson(slug: string): Lesson | undefined {
    for (const chapter of chapters) {
        const lesson = chapter.lessons.find((l) => l.slug === slug);
        if (lesson) return lesson;
    }
    return undefined;
}

export function findChapter(id: string): Chapter | undefined {
    return chapters.find((c) => c.id === id);
}

export function getChapter(lesson: Lesson): Chapter {
    const c = findChapter(lesson.chapterId);
    if (!c) throw new Error(`unknown chapter ${lesson.chapterId} on lesson ${lesson.slug}`);
    return c;
}

/**
 * Adjacent lessons for navigation.
 *
 * `prev`/`next` cross chapter boundaries so a learner reaches the next
 * chapter naturally from the last lesson of the current one.
 * `nextStartsChapter` flags those cross-chapter jumps so the UI can label
 * the button "Start Ch. 2 →" rather than the lesson's own title.
 */
export function adjacent(slug: string): {
    prev: Lesson | null;
    next: Lesson | null;
    nextStartsChapter: Chapter | null;
    prevEndsChapter: Chapter | null;
} {
    const lesson = findLesson(slug);
    if (!lesson) return { prev: null, next: null, nextStartsChapter: null, prevEndsChapter: null };

    const chapter = getChapter(lesson);
    const i = chapter.lessons.findIndex((l) => l.slug === slug);
    const chapterIdx = chapters.findIndex((c) => c.id === chapter.id);

    let prev: Lesson | null = null;
    let prevEndsChapter: Chapter | null = null;
    if (i > 0) {
        prev = chapter.lessons[i - 1];
    } else if (chapterIdx > 0) {
        const earlier = chapters[chapterIdx - 1];
        prev = earlier.lessons[earlier.lessons.length - 1];
        prevEndsChapter = earlier;
    }

    let next: Lesson | null = null;
    let nextStartsChapter: Chapter | null = null;
    if (i < chapter.lessons.length - 1) {
        next = chapter.lessons[i + 1];
    } else if (chapterIdx < chapters.length - 1) {
        const later = chapters[chapterIdx + 1];
        next = later.lessons[0];
        nextStartsChapter = later;
    }

    return { prev, next, nextStartsChapter, prevEndsChapter };
}

export function nextChapter(currentChapterId: string): Chapter | null {
    const i = chapters.findIndex((c) => c.id === currentChapterId);
    return i >= 0 && i < chapters.length - 1 ? chapters[i + 1] : null;
}

export function prevChapter(currentChapterId: string): Chapter | null {
    const i = chapters.findIndex((c) => c.id === currentChapterId);
    return i > 0 ? chapters[i - 1] : null;
}

export function lessonUrl(lesson: Lesson): string {
    return `/${lesson.chapterId}/${lesson.slug}`;
}

export function chapterUrl(chapter: Chapter): string {
    return chapter.id === "astro-101" ? "/" : `/${chapter.id}/`;
}

export function totalXp(chapterId?: string): number {
    const list = chapterId
        ? (findChapter(chapterId)?.lessons ?? [])
        : chapters.flatMap((c) => c.lessons);
    return list.reduce((sum, l) => sum + l.xp, 0);
}
