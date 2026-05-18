/**
 * Tiny DOM-only confetti burst — no canvas, no dependencies.
 *
 * Spawns a handful of absolutely-positioned colored squares around the origin
 * element, gives each a random ballistic-ish trajectory via the Web Animations
 * API, and removes them when done.
 */

const COLORS = ["#e85b4e", "#f6c453", "#8ec38a", "#7fb8d6", "#d97a9f", "#1a1a2e"];

export function burstConfetti(origin: HTMLElement, opts: { count?: number; radius?: number } = {}) {
    const count = opts.count ?? 24;
    const radius = opts.radius ?? 160;
    const rect = origin.getBoundingClientRect();
    const cx = rect.left + rect.width / 2 + window.scrollX;
    const cy = rect.top + rect.height / 2 + window.scrollY;

    const layer = ensureLayer();

    for (let i = 0; i < count; i++) {
        const piece = document.createElement("span");
        const size = 6 + Math.random() * 6;
        const color = COLORS[(Math.random() * COLORS.length) | 0];
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
        const distance = radius * (0.6 + Math.random() * 0.6);
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance - radius * 0.5; // bias upward
        const rotation = (Math.random() - 0.5) * 720;
        const duration = 900 + Math.random() * 700;

        Object.assign(piece.style, {
            position: "absolute",
            left: `${cx}px`,
            top: `${cy}px`,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            transform: "translate(-50%, -50%) rotate(0deg)",
            borderRadius: Math.random() > 0.6 ? "50%" : "2px",
            pointerEvents: "none",
            opacity: "1",
        } as CSSStyleDeclaration);

        layer.appendChild(piece);

        piece.animate(
            [
                {
                    transform: "translate(-50%, -50%) rotate(0deg)",
                    opacity: 1,
                },
                {
                    transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rotation}deg)`,
                    opacity: 1,
                    offset: 0.7,
                },
                {
                    transform: `translate(calc(-50% + ${tx * 1.1}px), calc(-50% + ${ty + radius}px)) rotate(${rotation * 1.2}deg)`,
                    opacity: 0,
                },
            ],
            { duration, easing: "cubic-bezier(0.2, 0.7, 0.4, 1)", fill: "forwards" },
        );

        setTimeout(() => piece.remove(), duration + 50);
    }
}

let layerEl: HTMLElement | null = null;
function ensureLayer(): HTMLElement {
    if (layerEl && document.body.contains(layerEl)) return layerEl;
    const div = document.createElement("div");
    Object.assign(div.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: "99",
        overflow: "visible",
    } as CSSStyleDeclaration);
    div.setAttribute("data-confetti-layer", "");
    document.body.appendChild(div);
    layerEl = div;
    return div;
}
