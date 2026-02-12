import { Entity } from "./Entity";
import { TILE_SIZE } from "../world/constants";

export class NPC extends Entity {
  width = TILE_SIZE * 0.7;
  height = TILE_SIZE * 0.7;

  constructor(
    id: string,
    x: number,
    y: number,
    public name: string,
    public role?: string
  ) {
    super(id, x, y);
  }

  render(ctx: CanvasRenderingContext2D) {
    // Render NPC as a blue square (different from player's white)
    ctx.fillStyle = "#4488ff";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Render name above NPC
    ctx.fillStyle = "#fff";
    ctx.font = "12px serif";
    ctx.textAlign = "center";
    ctx.fillText(this.name, this.x + this.width / 2, this.y - 5);
    ctx.textAlign = "left"; // Reset alignment
  }
}
