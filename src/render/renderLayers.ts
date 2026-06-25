/** Ordered render passes for room scenes (bottom to top). */
export enum RenderLayer {
    Background = 0,
    Tiles = 1,
    Doors = 2,
    Rugs = 3,
    Furniture = 4,
    Actors = 5
}

export const ROOM_SCENE_LAYER_ORDER: RenderLayer[] = [
    RenderLayer.Background,
    RenderLayer.Tiles,
    RenderLayer.Doors,
    RenderLayer.Rugs,
    RenderLayer.Furniture,
    RenderLayer.Actors
];

/** Game HUD overlays drawn after the room scene (bottom to top). */
export enum HudLayer {
    World = 0,
    Debug = 1,
    Dialog = 2,
    ClueNotification = 3,
    RoomTitle = 4,
    AccusationBlink = 5,
    Victory = 6,
    Inventory = 7
}

export const HUD_LAYER_ORDER: HudLayer[] = [
    HudLayer.World,
    HudLayer.Debug,
    HudLayer.Dialog,
    HudLayer.ClueNotification,
    HudLayer.RoomTitle,
    HudLayer.AccusationBlink,
    HudLayer.Victory,
    HudLayer.Inventory
];
