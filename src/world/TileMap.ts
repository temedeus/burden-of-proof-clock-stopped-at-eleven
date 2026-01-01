export class TileMap {
  constructor(
    public width: number,
    public height: number,
    public tiles: number[]
  ) {}

  getTile(x: number, y: number): number {
    return this.tiles[y * this.width + x];
  }
}
