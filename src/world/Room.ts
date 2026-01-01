import { TileMap } from "./TileMap";

export class Room {
  constructor(
    public id: string,
    public name: string,
    public tileMap: TileMap,
    public exits: Record<string, string>
  ) {}
}
