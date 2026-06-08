export type SpriteDrawFn = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number
) => void;

export interface ProceduralSpriteDef {
    nativeWidth: number;
    nativeHeight: number;
    draw: SpriteDrawFn;
}
