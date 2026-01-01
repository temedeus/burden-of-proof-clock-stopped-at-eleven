export interface Interactable {
    id: string;
    name: string;
    description: string;
    tiles: { x: number; y: number }[];
}
