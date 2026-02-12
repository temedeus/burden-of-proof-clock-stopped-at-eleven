import { Entity } from "./Entity";
import { TILE_SIZE } from "../world/constants";
import { spriteLoader } from "../assets/SpriteLoader";

export class NPC extends Entity {
  width = TILE_SIZE * 2; // 2x2 tiles = 4 tiles total
  height = TILE_SIZE * 2; // 2x2 tiles = 4 tiles total
  private spriteName: string = 'npc_male'; // Default sprite

  constructor(
    id: string,
    x: number,
    y: number,
    public name: string,
    public role?: string,
    spriteName?: string
  ) {
    super(id, x, y);
    // Determine sprite based on role or use provided sprite name
    if (spriteName) {
      this.spriteName = spriteName;
    } else if (role === 'butler' || name.toLowerCase().includes('butler')) {
      this.spriteName = 'npc_male';
    } else {
      // Default to male sprite, can be overridden
      this.spriteName = 'npc_male';
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    // Render NPC sprite from spritesheet, scaled to occupy 4 tiles (2x2)
    spriteLoader.drawSprite(ctx, this.spriteName, this.x, this.y, this.width, this.height);
    
    // Render name above NPC
    ctx.fillStyle = "#fff";
    ctx.font = "16px serif";
    ctx.textAlign = "center";
    ctx.fillText(this.name, this.x + this.width / 2, this.y - 5);
    ctx.textAlign = "left"; // Reset alignment
  }
}
