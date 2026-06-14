export type FurnitureConfig = {
    id: string;
    name: string;
    description: string;
    width: number;
    height: number;
    drawWidth?: number;
    drawHeight?: number;
    renderAnchor?: "center" | "bottom";
    spriteName?: string;
};

export type ToolMode = "add" | "select" | "delete";
export type EditTarget = "furniture" | "npc" | "doors" | "clues";
