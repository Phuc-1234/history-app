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

// ─── Measure ────────────────────────────────────────────────────────────────

export function measureNode(label: string, depth: number): { width: number; height: number } {
    const config = NODE_CONFIGS[depth as keyof typeof NODE_CONFIGS] || NODE_CONFIGS[2];
    const maxCharsPerLine = Math.floor((config.minWidth - config.paddingH) / (config.fontSize * 0.55));
    const lines = wrapText(label, Math.max(12, maxCharsPerLine));
    const charWidth = config.fontSize * 0.55;
    const longestLine = Math.max(...lines.map((l) => l.length * charWidth));
    const textWidth = longestLine;
    const width = Math.max(config.minWidth, textWidth + config.paddingH * 2 + (depth === 1 ? 28 : 0));
    const lineHeight = config.fontSize + 4;
    const height = Math.max(config.height, lines.length * lineHeight + config.paddingV);
    return { width, height };
}

// ─── Max width per depth (equal-width nodes) ────────────────────────────────

export function measureMaxWidthsPerDepth(tree: MindMapNode): Map<number, number> {
    const maxWidths = new Map<number, number>();

    function walk(node: MindMapNode, depth: number) {
        const { width } = measureNode(node.label, depth);
        const current = maxWidths.get(depth) ?? 0;
        if (width > current) maxWidths.set(depth, width);
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
    const height = ownMeasure.height;
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
