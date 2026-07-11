import type { MindMapNode, LayoutNode } from "../types";
import { NODE_CONFIGS, SAFE_PADDING } from "../constants";

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

// Shared line-height so measurement and rendering always agree on how tall a
// block of wrapped text is. Mismatched values here previously caused the card
// height to be reserved for more lines than were actually drawn, leaving the
// visible empty gap inside the card.
function lineHeightFor(config: (typeof NODE_CONFIGS)[keyof typeof NODE_CONFIGS]): number {
    return config.fontSize + 4;
}

// Number of characters that fit on one line inside a card of `allocatedWidth`.
// `allocatedWidth` is the REAL card width (the per-depth max), so text wraps at
// the same column the renderer draws at — previously measurement wrapped at the
// (narrower) `minWidth`, reserving height for lines that never appeared.
export function charsPerLine(depth: number, allocatedWidth: number): number {
    const config = NODE_CONFIGS[depth as keyof typeof NODE_CONFIGS] || NODE_CONFIGS[2];
    // depth===1 reserves room on the right for the collapse icon (matches NodeCard).
    const iconRoom = depth === 1 ? 28 : 0;
    return Math.max(
        12,
        Math.floor((allocatedWidth - config.paddingH * 2 - iconRoom) / (config.fontSize * 0.55)),
    );
}

// Count wrapped lines for a label at a given allocated width. Extracted so both
// width measurement (per-depth max) and height measurement stay in sync.
function countLines(label: string, depth: number, allocatedWidth: number): number {
    return wrapText(label, charsPerLine(depth, allocatedWidth)).length;
}

// ─── Measure ────────────────────────────────────────────────────────────────

// First pass: compute the natural width of a label assuming a single line, used
// to derive the per-depth max width (kept for visual consistency across cards
// at the same depth).
export function measureNode(label: string, depth: number): { width: number; height: number } {
    const config = NODE_CONFIGS[depth as keyof typeof NODE_CONFIGS] || NODE_CONFIGS[2];
    const charWidth = config.fontSize * 0.55;
    const iconRoom = depth === 1 ? 28 : 0;
    const textWidth = label.length * charWidth;
    const width = Math.max(config.minWidth, textWidth + config.paddingH * 2 + iconRoom);
    const lineHeight = lineHeightFor(config);
    // Height here is only a fallback for the per-depth pass; the real height is
    // recomputed in measureNodeHeight once the allocated width is known.
    const lines = Math.max(1, countLines(label, depth, width));
    const height = Math.max(config.height, lines * lineHeight + config.paddingV);
    return { width, height };
}

// Second pass: given the FINAL (per-depth max) width, measure the real height.
// This is what makes the card hug its text — it wraps at the actual rendered
// column instead of the narrower measurement column.
export function measureNodeHeight(label: string, depth: number, allocatedWidth: number): number {
    const config = NODE_CONFIGS[depth as keyof typeof NODE_CONFIGS] || NODE_CONFIGS[2];
    const lineHeight = lineHeightFor(config);
    const lines = Math.max(1, countLines(label, depth, allocatedWidth));
    return Math.max(config.height, lines * lineHeight + config.paddingV);
}

// ─── Max width per depth (equal-width nodes) ────────────────────────────────

export function measureMaxWidthsPerDepth(tree: MindMapNode): Map<number, number> {
    const maxWidths = new Map<number, number>();

    function walk(node: MindMapNode, depth: number) {
        const { width } = measureNode(node.label, depth);
        // Cap the per-depth width so one long label can't balloon every card
        // at that depth. Long labels wrap to a second line instead of stretching
        // short-text siblings — keeps cards equal-width but tight to their text.
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
    maxWidthsPerDepth?: Map<number, number>
): { nodes: LayoutNode[]; totalHeight: number } {
    const ownMeasure = measureNode(node.label, depth);
    const width = maxWidthsPerDepth?.get(depth) ?? ownMeasure.width;
    // Recompute height against the FINAL (per-depth max) width so the card
    // hugs its text. Without this, height was based on the narrower measurement
    // width, reserving space for more lines than were actually drawn and
    // leaving an empty band inside the card.
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
