import type { MindMapNode, LayoutNode } from "../types";
import { NODE_CONFIGS, SAFE_PADDING } from "../constants";

// ─── Single source of truth for text geometry ───────────────────────────────
// Every measurement (width, height, wrap point) and every render coordinate
// (text center, icon position) MUST go through these helpers. Before this,
// measurement used one width formula and rendering used another, so wrapped
// text was wider than predicted and overlapped the +/- collapse icon.

// Fixed letter-spacing applied to every card's text (see NodeCard). Kept tight
// (1px) so characters stay naturally close — never the loose, spread-out look
// that justified text produced on short labels.
export const FIXED_LETTER_SPACING = 1;

// Effective width of one character, INCLUDING the fixed letter-spacing. SVG
// adds letterSpacing after every glyph, so a char "costs" its glyph width
// plus the spacing.
export function charWidthFor(depth: number): number {
    const config = NODE_CONFIGS[depth as keyof typeof NODE_CONFIGS] || NODE_CONFIGS[2];
    return config.fontSize * 0.55 + FIXED_LETTER_SPACING;
}

// Total horizontal room consumed by the non-text decorations on a card:
//   depth 0 (root): none
//   depth 1 (branch): left accent bar (4) + right collapse-icon room (24)
//   depth 2 (leaf): left bullet dot room (20) + right collapse-icon room (22)
// `hasChildren` only matters for layout fit; the right room is reserved
// unconditionally so a node that gains children later doesn't shift text.
export function sideRoomFor(depth: number): number {
    if (depth === 1) return 4 + 24;
    if (depth === 2) return 20 + 22;
    return 0;
}

// X offset from the card's left edge where the text area starts.
export function textStartOffset(depth: number): number {
    if (depth === 1) return 4; // past the accent bar
    if (depth === 2) return 20; // past the bullet dot
    return 0;
}

// ─── Text wrapping ──────────────────────────────────────────────────────────

export function wrapText(text: string, maxCharsPerLine: number): string[] {
    if (text.length <= maxCharsPerLine) return [text];
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
        if ((current.length + (current ? 1 : 0) + word.length) > maxCharsPerLine && current) {
            lines.push(current);
            current = word;
        } else {
            current = current ? current + " " + word : word;
        }
    }
    if (current) lines.push(current);
    return lines;
}

function lineHeightFor(config: (typeof NODE_CONFIGS)[keyof typeof NODE_CONFIGS]): number {
    return config.fontSize + 4;
}

// Number of characters that fit on one line inside a card of `allocatedWidth`.
// Uses the EFFECTIVE char width (incl. letter-spacing) and subtracts the real
// side room, so the wrap point matches what the renderer can actually show.
export function charsPerLine(depth: number, allocatedWidth: number): number {
    return Math.max(
        8,
        Math.floor((allocatedWidth - sideRoomFor(depth)) / charWidthFor(depth)),
    );
}

function countLines(label: string, depth: number, allocatedWidth: number): number {
    return wrapText(label, charsPerLine(depth, allocatedWidth)).length;
}

// ─── Measure ────────────────────────────────────────────────────────────────

// Natural single-line width of a label — used to derive the per-depth max so
// all cards at the same depth share one width (visual consistency).
export function measureNode(label: string, depth: number): { width: number; height: number } {
    const width = Math.max(
        NODE_CONFIGS[depth as keyof typeof NODE_CONFIGS]?.minWidth ?? NODE_CONFIGS[2].minWidth,
        label.length * charWidthFor(depth) + sideRoomFor(depth),
    );
    const height = measureNodeHeight(label, depth, width);
    return { width, height };
}

// Real height for a label at a given (already-final) width. Wraps at the
// actual rendered column so the card hugs its text vertically.
export function measureNodeHeight(label: string, depth: number, allocatedWidth: number): number {
    const config = NODE_CONFIGS[depth as keyof typeof NODE_CONFIGS] || NODE_CONFIGS[2];
    const lineHeight = lineHeightFor(config);
    const lines = Math.max(1, countLines(label, depth, allocatedWidth));
    return Math.max(config.height, lines * lineHeight + config.paddingV);
}

// ─── Max width per depth (equal-width cards) ────────────────────────────────

// All cards at the same depth share one width = the widest label at that depth,
// capped at maxWidth so a single long label can't stretch every sibling. Cards
// stay equal-width (uniform look); short labels are centered (see NodeCard) so
// the remaining space reads as balanced padding, not a lopsided gap.
export function measureMaxWidthsPerDepth(tree: MindMapNode): Map<number, number> {
    const maxWidths = new Map<number, number>();

    function walk(node: MindMapNode, depth: number) {
        const { width } = measureNode(node.label, depth);
        const config = NODE_CONFIGS[depth as keyof typeof NODE_CONFIGS] || NODE_CONFIGS[2];
        const clamped = Math.min(width, config.maxWidth);
        const current = maxWidths.get(depth) ?? 0;
        if (clamped > current) maxWidths.set(depth, clamped);
        for (const child of node.children) {
            walk(child, depth + 1);
        }
    }

    walk(tree, 0);
    return maxWidths;
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export function layoutTree(
    node: MindMapNode,
    depth: number,
    startY: number,
    parentId: string | null,
    collapsedSet: Set<string>,
    maxWidthsPerDepth?: Map<number, number>,
): { nodes: LayoutNode[]; totalHeight: number } {
    const ownMeasure = measureNode(node.label, depth);
    // Equal width across a depth: every card uses the per-depth max (capped).
    const width = maxWidthsPerDepth?.get(depth) ?? ownMeasure.width;
    // Recompute height at the final shared width so the card hugs its text.
    const height = measureNodeHeight(node.label, depth, width);
    const visibleChildren = collapsedSet.has(node.id) ? [] : node.children;

    if (visibleChildren.length === 0) {
        return {
            nodes: [{
                id: node.id, label: node.label, x: 0, y: startY,
                width, height, color: node.color, borderColor: node.borderColor,
                accentColor: node.accentColor, depth, parentId,
                collapsed: collapsedSet.has(node.id),
                childIds: node.children.map((c) => c.id),
            }],
            totalHeight: height,
        };
    }

    const vGap = 12;
    let childY = startY;
    const allNodes: LayoutNode[] = [];

    for (const child of visibleChildren) {
        const result = layoutTree(child, depth + 1, childY, node.id, collapsedSet, maxWidthsPerDepth);
        allNodes.push(...result.nodes);
        childY += result.totalHeight + vGap;
    }

    const totalChildHeight = childY - startY - vGap;
    const myY = startY + totalChildHeight / 2 - height / 2;

    allNodes.push({
        id: node.id, label: node.label, x: 0, y: myY,
        width, height, color: node.color, borderColor: node.borderColor,
        accentColor: node.accentColor, depth, parentId,
        collapsed: collapsedSet.has(node.id),
        childIds: node.children.map((c) => c.id),
    });

    return { nodes: allNodes, totalHeight: Math.max(totalChildHeight, height) };
}

export function applyHorizontalPositions(nodes: LayoutNode[]): LayoutNode[] {
    const depthX: Record<number, number> = { 0: 0 };
    const hGap = 70;
    const sorted = [...nodes].sort((a, b) => a.depth - b.depth);

    for (const node of sorted) {
        if (node.depth > 0 && depthX[node.depth] === undefined) {
            const parent = sorted.find((n) => n.id === node.parentId);
            if (parent) {
                depthX[node.depth] = (depthX[parent.depth] ?? 0) + parent.width + hGap;
            }
        }
    }

    return nodes.map((n) => ({ ...n, x: depthX[n.depth] ?? 0 }));
}

export function normalizeCoordinates(nodes: LayoutNode[]): LayoutNode[] {
    if (nodes.length === 0) return nodes;
    let minX = Infinity, minY = Infinity;
    for (const n of nodes) {
        if (n.x < minX) minX = n.x;
        if (n.y < minY) minY = n.y;
    }
    return nodes.map((n) => ({
        ...n,
        x: n.x - minX + SAFE_PADDING,
        y: n.y - minY + SAFE_PADDING,
    }));
}

export function computeBounds(nodes: LayoutNode[]): { width: number; height: number } {
    if (nodes.length === 0) return { width: 400, height: 300 };
    let maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
        if (n.x + n.width + 32 > maxX) maxX = n.x + n.width + 32;
        if (n.y + n.height + 4 > maxY) maxY = n.y + n.height + 4;
    }
    return { width: maxX + SAFE_PADDING, height: maxY + SAFE_PADDING };
}

// ─── Bezier ─────────────────────────────────────────────────────────────────

export function buildBezierPath(fromX: number, fromY: number, toX: number, toY: number): string {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const off = dy * 0.08;
    return `M ${fromX} ${fromY} C ${fromX + dx * 0.4} ${fromY + off}, ${fromX + dx * 0.6} ${toY - off}, ${toX} ${toY}`;
}

// ─── Animation interpolation ────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export function interpolateNodes(
    prev: LayoutNode[],
    next: LayoutNode[],
    progress: number
): LayoutNode[] {
    const prevMap = new Map(prev.map((n) => [n.id, n]));
    const result: LayoutNode[] = [];

    for (const node of next) {
        const old = prevMap.get(node.id);
        if (old) {
            // Node existed before — interpolate position
            result.push({
                ...node,
                x: lerp(old.x, node.x, progress),
                y: lerp(old.y, node.y, progress),
                width: lerp(old.width, node.width, progress),
            });
        } else {
            // New node appearing — start from parent's position, slide out
            const parent = prevMap.get(node.parentId ?? "");
            const startX = parent ? parent.x + parent.width : node.x;
            const startY = parent ? parent.y + parent.height / 2 - node.height / 2 : node.y;
            result.push({
                ...node,
                x: lerp(startX, node.x, progress),
                y: lerp(startY, node.y, progress),
            });
        }
    }

    return result;
}
