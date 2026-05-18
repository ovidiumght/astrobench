/*
 * The /explore page is a reference / cheat-sheet binder, sibling to the
 * linear curriculum. Each concept has a one-line blurb, the smallest possible
 * example, and a deep-link back to the lesson that introduces it in depth.
 *
 * To add a concept: append an entry below. `lessonSlug` is optional but most
 * concepts should point back to a lesson — the lookup uses findLesson().
 */

export type ConceptCategory =
    | "basics"
    | "components"
    | "routing"
    | "data"
    | "content"
    | "islands"
    | "deploy";

/**
 * Playground configuration for a concept that can be opened in the live
 * editor modal. Concepts WITHOUT a `play` field stay static (e.g. abstract
 * ones like "islands architecture" or things our runtime can't render).
 *
 * `code` is the seed text. `props` / `params` are passed to Astro.props /
 * Astro.params in the sandbox so component-style examples can render
 * standalone. `scope` exposes extra identifiers — most commonly a mock
 * fetch() for data-fetching examples.
 */
export type ConceptPlay = {
    code: string;
    props?: Record<string, unknown>;
    params?: Record<string, unknown>;
    scope?: Record<string, unknown>;
};

export type Concept = {
    /** URL-fragment id for deep-linking, e.g. /explore#get-static-paths. */
    id: string;
    title: string;
    blurb: string;
    category: ConceptCategory;
    tags: string[];
    /** Smallest possible example. Plain text, monospace, ~5-8 lines. */
    code: string;
    /** Lesson slug to link to. Falls back to category page if missing. */
    lessonSlug?: string;
    /** If present, a ▶ play button opens this concept in the modal. */
    play?: ConceptPlay;
};

export const categoryMeta: Record<
    ConceptCategory,
    { label: string; dot: string; pillBg: string; pillBorder: string }
> = {
    basics: {
        label: "basics",
        dot: "bg-yellow-400",
        pillBg: "bg-yellow-50",
        pillBorder: "border-yellow-300",
    },
    components: {
        label: "components",
        dot: "bg-sky-400",
        pillBg: "bg-sky-50",
        pillBorder: "border-sky-300",
    },
    routing: {
        label: "routing",
        dot: "bg-emerald-400",
        pillBg: "bg-emerald-50",
        pillBorder: "border-emerald-300",
    },
    data: {
        label: "data",
        dot: "bg-orange-400",
        pillBg: "bg-orange-50",
        pillBorder: "border-orange-300",
    },
    content: {
        label: "content",
        dot: "bg-pink-400",
        pillBg: "bg-pink-50",
        pillBorder: "border-pink-300",
    },
    islands: {
        label: "islands",
        dot: "bg-violet-400",
        pillBg: "bg-violet-50",
        pillBorder: "border-violet-300",
    },
    deploy: {
        label: "deploy",
        dot: "bg-rose-500",
        pillBg: "bg-rose-50",
        pillBorder: "border-rose-300",
    },
};

export const concepts: Concept[] = [
    /* --------------------------------------------------------------- basics */
    {
        id: "page",
        title: "Astro page",
        blurb: "Every file in src/pages/ becomes a route. No router config.",
        category: "basics",
        tags: ["routing", "file-based"],
        code: `src/pages/about.astro

<h1>About</h1>
<p>I'm building in space.</p>`,
        lessonSlug: "01-hello-page",
        play: {
            code: `<h1>About</h1>
<p>I'm building in space.</p>`,
        },
    },
    {
        id: "frontmatter",
        title: "Frontmatter",
        blurb: "JavaScript at the top of an .astro file. Runs on the server.",
        category: "basics",
        tags: ["server", "javascript"],
        code: `---
const name = "Mae";
const missions = ["Endeavour", "Apollo 42"];
---

<h1>{name}</h1>`,
        lessonSlug: "03-extract-a-component",
        play: {
            code: `---
const name = "Mae";
const missions = ["Endeavour", "Apollo 42"];
---

<h1>{name}</h1>
<p>missions flown: {missions.length}</p>`,
        },
    },
    {
        id: "expressions",
        title: "{ expressions }",
        blurb: "Embed any JavaScript expression in the template with curly braces.",
        category: "basics",
        tags: ["template", "javascript"],
        code: `<p>2 + 2 = {2 + 2}</p>
<p>upper: {name.toUpperCase()}</p>
<p>length: {crew.length}</p>`,
        lessonSlug: "03-extract-a-component",
        play: {
            code: `---
const name = "Mae";
const crew = ["Mae", "Ovidiu", "Sergei"];
---

<p>2 + 2 = {2 + 2}</p>
<p>upper: {name.toUpperCase()}</p>
<p>crew size: {crew.length}</p>`,
        },
    },
    {
        id: "scoped-styles",
        title: "Scoped <style>",
        blurb: "Styles in an .astro file are auto-scoped to that component. No leaks.",
        category: "basics",
        tags: ["css", "scoping"],
        code: `<h1>Hello</h1>

<style>
    h1 { color: crimson; }
</style>`,
        lessonSlug: "02-style-it-up",
        play: {
            code: `<h1>Hello, space</h1>
<p>scoped styling demo</p>

<style>
    h1 { color: crimson; font-family: Georgia, serif; }
    p  { color: #555; font-style: italic; }
</style>`,
        },
    },
    {
        id: "component",
        title: "Component",
        blurb: "Any .astro file outside src/pages/ is a reusable component.",
        category: "basics",
        tags: ["reuse"],
        code: `<!-- src/components/Card.astro -->
<article class="card">
    <slot />
</article>`,
        lessonSlug: "03-extract-a-component",
    },

    /* ----------------------------------------------------------- components */
    {
        id: "props",
        title: "Astro.props",
        blurb: "Pass values to a component, destructure them in its frontmatter.",
        category: "components",
        tags: ["data", "reuse"],
        code: `---
const { name, mission } = Astro.props;
---

<h1>{name}</h1>
<p>{mission}</p>`,
        lessonSlug: "04-pass-them-around",
    },
    {
        id: "slot",
        title: "<slot />",
        blurb: "A hole for children. Layouts and wrappers fill it from outside.",
        category: "components",
        tags: ["layouts", "children"],
        code: `<!-- Layout.astro -->
<html>
    <body>
        <main>
            <slot />
        </main>
    </body>
</html>`,
        lessonSlug: "01-a-shared-shell",
    },
    {
        id: "spread-props",
        title: "Spread props",
        blurb: "Forward an object as props with the JSX spread operator.",
        category: "components",
        tags: ["reuse", "shorthand"],
        code: `{ crew.map(a => <Card {...a} />) }`,
        lessonSlug: "05-the-whole-crew",
    },
    {
        id: "fragment",
        title: "<Fragment>",
        blurb: "Group elements without adding a wrapper tag. Required for named slots.",
        category: "components",
        tags: ["template", "slots"],
        code: `<Layout>
    <Fragment slot="pinboard">
        <Sticky />
        <Polaroid />
    </Fragment>
</Layout>`,
    },

    /* -------------------------------------------------------------- routing */
    {
        id: "file-routes",
        title: "File-based routing",
        blurb: "The file's path is the URL. No router config, no boilerplate.",
        category: "routing",
        tags: ["pages"],
        code: `src/pages/
├── index.astro       → /
├── about.astro       → /about
└── crew/
    └── index.astro   → /crew`,
        lessonSlug: "07-a-second-page",
    },
    {
        id: "dynamic-routes",
        title: "[name].astro",
        blurb: "Square brackets in a filename create a URL placeholder.",
        category: "routing",
        tags: ["dynamic", "params"],
        code: `src/pages/crew/[name].astro

→ /crew/mae
→ /crew/ovidiu
→ /crew/sergei`,
        lessonSlug: "08-profile-pages",
    },
    {
        id: "get-static-paths",
        title: "getStaticPaths",
        blurb: "Tell Astro which dynamic-route pages to generate at build time.",
        category: "routing",
        tags: ["dynamic", "build-time", "ssg"],
        code: `---
export function getStaticPaths() {
    return [
        { params: { name: "mae" },    props: { mission: "Endeavour" } },
        { params: { name: "ovidiu" }, props: { mission: "Apollo 42" } },
    ];
}
---`,
        lessonSlug: "09-static-paths",
        play: {
            code: `---
export function getStaticPaths() {
    return [
        { params: { name: "mae" },    props: { mission: "Endeavour" } },
        { params: { name: "ovidiu" }, props: { mission: "Apollo 42" } },
    ];
}

const { name } = Astro.params;
const { mission } = Astro.props;
---

<h1>{name}</h1>
<p>flying on {mission}</p>
<p class="meta">preview shows route #1</p>

<style>
    h1 { text-transform: capitalize; }
    .meta { color: #888; font-family: monospace; font-size: 13px; }
</style>`,
        },
    },
    {
        id: "astro-params",
        title: "Astro.params",
        blurb: "Read the value that filled the [bracket] in the URL.",
        category: "routing",
        tags: ["dynamic", "url"],
        code: `---
const { name } = Astro.params;
---

<h1>{name}</h1>`,
        lessonSlug: "09-static-paths",
        play: {
            code: `---
const { name } = Astro.params;
---

<h1>{name}</h1>
<p>visit /crew/{name}</p>`,
            params: { name: "mae" },
        },
    },

    /* ----------------------------------------------------------------- data */
    {
        id: "fetch-frontmatter",
        title: "fetch() in frontmatter",
        blurb: "await fetch at build time. Data lands baked into the HTML.",
        category: "data",
        tags: ["api", "build-time", "ssr"],
        code: `---
const res = await fetch("/api/crew");
const crew = await res.json();
---

<h1>{crew.length} astronauts on shift</h1>`,
        lessonSlug: "10-live-from-the-api",
        play: {
            code: `---
const res = await fetch("/api/crew");
const crew = await res.json();
---

<h1>{crew.length} astronauts on shift</h1>
<ul>
    { crew.map(a => <li>{a.name} — {a.mission}</li>) }
</ul>`,
            scope: {
                fetch: async () => ({
                    json: async () => [
                        { name: "Mae", mission: "Endeavour" },
                        { name: "Ovidiu", mission: "Apollo 42" },
                        { name: "Sergei", mission: "Soyuz 11" },
                    ],
                }),
            },
        },
    },
    {
        id: "lists",
        title: ".map() over a list",
        blurb: "Loop over an array and return components or markup. No v-for, no key spreading.",
        category: "data",
        tags: ["template", "arrays"],
        code: `<ul>
    { crew.map(a => <li>{a.name}</li>) }
</ul>`,
        lessonSlug: "05-the-whole-crew",
        play: {
            code: `---
const crew = [
    { name: "Mae",    mission: "Endeavour" },
    { name: "Ovidiu", mission: "Apollo 42" },
    { name: "Sergei", mission: "Soyuz 11" },
];
---

<h1>The crew</h1>
<ul>
    { crew.map(a => <li><b>{a.name}</b> — {a.mission}</li>) }
</ul>`,
        },
    },
    {
        id: "conditionals",
        title: "Conditional rendering",
        blurb: "Use && and ternaries to show or hide pieces of the template.",
        category: "data",
        tags: ["template", "logic"],
        code: `<p>{ status === "orbit" ? "🚀 flying" : "🌍 grounded" }</p>

{ admin && <button>delete</button> }`,
        lessonSlug: "06-status-check",
        play: {
            code: `---
const status = "orbit";
const admin = true;
---

<p>{ status === "orbit" ? "🚀 flying" : "🌍 grounded" }</p>

{ admin && <p style="color:#c84545;">admin panel: <a href="#">delete crew</a></p> }`,
        },
    },
    {
        id: "api-endpoint",
        title: "API endpoint",
        blurb: "Export GET / POST from src/pages/api/* to return JSON instead of HTML.",
        category: "data",
        tags: ["api", "json", "server"],
        code: `// src/pages/api/crew.json.ts
export async function GET() {
    return Response.json([
        { name: "Mae", mission: "Endeavour" },
    ]);
}`,
        lessonSlug: "07-an-api-endpoint",
    },

    /* -------------------------------------------------------------- content */
    {
        id: "markdown",
        title: "Markdown imports",
        blurb: "Import .md files like modules. Get rendered HTML plus typed frontmatter.",
        category: "content",
        tags: ["markdown", "mdx"],
        code: `---
import { Content, frontmatter } from "../logs/day-one.md";
---

<h1>{frontmatter.title}</h1>
<Content />`,
        lessonSlug: "02-add-some-markdown",
    },
    {
        id: "content-collections",
        title: "Content collections",
        blurb: "A typed folder of markdown. Schema, queries, autocomplete — built in.",
        category: "content",
        tags: ["markdown", "schema", "zod"],
        code: `// content.config.ts
import { defineCollection, z } from "astro:content";

export const collections = {
    logs: defineCollection({
        schema: z.object({
            title: z.string(),
            date: z.date(),
        }),
    }),
};`,
        lessonSlug: "03-make-a-collection",
    },
    {
        id: "image",
        title: "<Image>",
        blurb: "Drop-in tag that resizes, optimizes to webp, and lazy-loads.",
        category: "content",
        tags: ["images", "performance"],
        code: `---
import { Image } from "astro:assets";
import launch from "../assets/launch.jpg";
---

<Image src={launch} alt="liftoff" width={600} />`,
        lessonSlug: "04-pictures-perfected",
    },

    /* -------------------------------------------------------------- islands */
    {
        id: "client-load",
        title: "client:load",
        blurb: "Hydrate this island as soon as the page loads. Eager. Use sparingly.",
        category: "islands",
        tags: ["hydration", "interactivity"],
        code: `<Hype initial={42} client:load />`,
        lessonSlug: "05-first-island",
    },
    {
        id: "client-directives",
        title: "client:visible · idle · only",
        blurb: "Defer hydration: when in viewport, when browser is idle, or skip SSR entirely.",
        category: "islands",
        tags: ["hydration", "performance"],
        code: `<Search client:visible />      <!-- when scrolled to -->
<Chat   client:idle />         <!-- after first paint -->
<Map    client:only="react" /> <!-- never on server -->`,
        lessonSlug: "06-when-to-hydrate",
    },
    {
        id: "islands",
        title: "Islands architecture",
        blurb: "Page ships as static HTML. Each client:* directive is a small interactive island.",
        category: "islands",
        tags: ["philosophy", "performance"],
        code: `<article>
    <h1>Launch day</h1>
    <p>Static prose, zero JavaScript.</p>

    <Hype client:load />   <!-- this bit ships JS -->
</article>`,
        lessonSlug: "05-first-island",
    },
    {
        id: "view-transitions",
        title: "View transitions",
        blurb: "Smooth cross-page animations. One component, browser does the rest.",
        category: "islands",
        tags: ["transitions", "ux"],
        code: `---
import { ClientRouter } from "astro:transitions";
---

<head>
    <ClientRouter />
</head>`,
        lessonSlug: "09-smooth-as-silk",
    },

    /* --------------------------------------------------------------- deploy */
    {
        id: "adapter",
        title: "Deploy adapter",
        blurb: "An adapter tells Astro where it's going to run. One per host.",
        category: "deploy",
        tags: ["build", "ssr", "ssg"],
        code: `// astro.config.mjs
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

export default defineConfig({
    adapter: vercel(),
});`,
        lessonSlug: "10-ship-it-for-real",
    },
    {
        id: "output-modes",
        title: "static vs server",
        blurb: "Pick how each page renders: HTML at build time, or fresh on every request.",
        category: "deploy",
        tags: ["ssr", "ssg", "config"],
        code: `// astro.config.mjs
export default defineConfig({
    output: "static",   // default — pre-render everything
    // output: "server", // SSR every route
    // output: "hybrid", // static by default, opt-in SSR per page
});`,
        lessonSlug: "10-ship-it-for-real",
    },
    {
        id: "site-and-sitemap",
        title: "site + sitemap",
        blurb: "Set your canonical URL, then the official integration generates sitemap.xml for free.",
        category: "deploy",
        tags: ["seo", "integrations"],
        code: `// astro.config.mjs
import sitemap from "@astrojs/sitemap";

export default defineConfig({
    site: "https://mission-control.vercel.app",
    integrations: [sitemap()],
});`,
        lessonSlug: "10-ship-it-for-real",
    },
];

export const categoryOrder: ConceptCategory[] = [
    "basics",
    "components",
    "routing",
    "data",
    "content",
    "islands",
    "deploy",
];

export function countByCategory(): Record<ConceptCategory, number> {
    const out = {} as Record<ConceptCategory, number>;
    for (const c of categoryOrder) out[c] = 0;
    for (const c of concepts) out[c.category] += 1;
    return out;
}

/** All concepts that point back to the given lesson, in declaration order. */
export function conceptsForLesson(lessonSlug: string): Concept[] {
    return concepts.filter((c) => c.lessonSlug === lessonSlug);
}

/** Index a concept id to its full record. */
export function findConcept(id: string): Concept | undefined {
    return concepts.find((c) => c.id === id);
}

/** Every distinct tag across the binder, sorted. Used by the command palette. */
export function allTags(): string[] {
    const set = new Set<string>();
    for (const c of concepts) for (const t of c.tags) set.add(t);
    return [...set].sort();
}
