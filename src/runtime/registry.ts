/**
 * Per-cell config registry.
 *
 * The render runtime is generic (Phase 2) — each lesson page needs to tell
 * it about lesson-specific components ("here's what `<Card />` looks like"),
 * initial Astro.props, and mocked scope values.
 *
 * Each lesson imports a tiny client-side module that calls registerCell()
 * with the right config. The live-cells script looks the config up by
 * cellId when rendering.
 */

import type { ComponentRenderer, RenderOptions } from "~/runtime/render";

export type CellConfig = {
    components?: Record<string, ComponentRenderer>;
    props?: Record<string, unknown>;
    params?: Record<string, unknown>;
    scope?: Record<string, unknown>;
    /** Optional CSS injected before the user's own <style> blocks. */
    baseStyles?: string;
};

const registry = new Map<string, CellConfig>();
const listeners = new Set<(cellId: string) => void>();

export function registerCell(cellId: string, config: CellConfig): void {
    registry.set(cellId, config);
    for (const fn of listeners) fn(cellId);
}

export function getCellConfig(cellId: string): CellConfig {
    return registry.get(cellId) ?? {};
}

export function onCellRegistered(fn: (cellId: string) => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

/** Convenience: convert a CellConfig to RenderOptions. */
export function toRenderOptions(config: CellConfig): RenderOptions {
    return {
        components: config.components,
        props: config.props,
        params: config.params,
        scope: config.scope,
    };
}
