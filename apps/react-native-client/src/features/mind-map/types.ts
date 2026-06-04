export interface MindMapNode {
    id: string;
    label: string;
    children: MindMapNode[];
    color: string;
    borderColor: string;
    accentColor: string;
}

export interface LayoutNode {
    id: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    borderColor: string;
    accentColor: string;
    depth: number;
    parentId: string | null;
    collapsed: boolean;
    childIds: string[];
    lightBg?: string;
}
