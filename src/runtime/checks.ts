/**
 * Challenge check evaluator.
 *
 * A Check is a small declarative predicate over the user's edited source
 * and the rendered HTML output. Used by per-lesson challenges to detect
 * when a goal is met.
 *
 * Everything is data so we can serialize via data-* attributes from the
 * server-rendered Astro component down to the browser.
 */

export type Check =
    | { kind: "sourceMatches"; pattern: string; flags?: string }
    | { kind: "sourceNotMatches"; pattern: string; flags?: string }
    | { kind: "outputMatches"; pattern: string; flags?: string }
    | { kind: "outputNotMatches"; pattern: string; flags?: string }
    | { kind: "outputDifferentFrom"; html: string }
    | { kind: "all"; checks: Check[] }
    | { kind: "any"; checks: Check[] };

function makeRegex(pattern: string, flags: string | undefined): RegExp {
    return new RegExp(pattern, flags ?? "i");
}

function normalize(s: string): string {
    return s.replace(/\s+/g, " ").trim();
}

export function evaluateCheck(check: Check, source: string, output: string): boolean {
    switch (check.kind) {
        case "sourceMatches":
            return makeRegex(check.pattern, check.flags).test(source);
        case "sourceNotMatches":
            return !makeRegex(check.pattern, check.flags).test(source);
        case "outputMatches":
            return makeRegex(check.pattern, check.flags).test(output);
        case "outputNotMatches":
            return !makeRegex(check.pattern, check.flags).test(output);
        case "outputDifferentFrom":
            return normalize(output) !== normalize(check.html);
        case "all":
            return check.checks.every((c) => evaluateCheck(c, source, output));
        case "any":
            return check.checks.some((c) => evaluateCheck(c, source, output));
    }
}
