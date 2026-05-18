const span = (cls: string) => (s: string) => `<span class="${cls}">${s}</span>`;

export const tag = span("text-pen-blue");
export const attr = span("text-pen-purple");
export const str = span("text-pen-green");
export const kw = span("text-pen-red");
export const punct = span("text-ink-soft");
export const exp = span("text-pen-red");
export const num = span("text-pen-green");
export const comment = span("text-ink-soft italic");
export const ident = span("text-ink-navy");
export const mark = span("bg-marker-yellow/70 px-1 text-ink-navy");

export const open = (name: string, attrs = "") =>
    `${punct("&lt;")}${tag(name)}${attrs}${punct("&gt;")}`;

export const close = (name: string) =>
    `${punct("&lt;/")}${tag(name)}${punct("&gt;")}`;

export const selfClose = (name: string, attrs = "") =>
    `${punct("&lt;")}${tag(name)}${attrs} ${punct("/&gt;")}`;

export const a = (name: string, value?: string) =>
    value === undefined || value === ""
        ? ` ${attr(name)}`
        : ` ${attr(name)}${punct("=")}${str(`"${value}"`)}`;

export const expr = (s: string) => `${exp("{")}${s}${exp("}")}`;

export const string = (s: string) => str(`"${s}"`);

export const cssProp = (prop: string, value: string) =>
    `${tag(prop)}${punct(":")} ${str(value)}${punct(";")}`;

export const cssSelector = (sel: string) => attr(sel);
