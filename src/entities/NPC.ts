import { Entity } from "./Entity";
import { TILE_SIZE } from "../world/constants";
import { spriteLoader } from "../assets/SpriteLoader";
import { TileMap } from "../world/TileMap";
import { TILE_WALL, TILE_WOOD_WALL, TILE_ROCK_WALL, TILE_MANOR_WALL, TILE_GATE_WALL, TILE_FURNITURE } from "../world/TileTypes";

const DEFAULT_CHASE_SPEED = 100;

export class NPC extends Entity {
  width = TILE_SIZE * 2;
  height = TILE_SIZE * 2;
  private spriteName: string = "npc_male";
  private showNameLabel = true;
  readonly walkable: boolean;
  readonly footstepSound?: string;
  private chasing = false;
  private chaseSpeed = DEFAULT_CHASE_SPEED;
  private fleeing = false;
  private fleeSpeed = 90;

  constructor(
    id: string,
    x: number,
    y: number,
    public name: string,
    public role?: string,
    spriteName?: string,
    showNameLabel = true,
    walkable = false,
    footstepSound?: string
  ) {
    super(id, x, y);
    this.showNameLabel = showNameLabel;
    this.walkable = walkable;
    this.footstepSound = footstepSound;
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

  setChasing(value: boolean): void {
    this.chasing = value;
  }

  setChaseSpeed(speed: number): void {
    this.chaseSpeed = speed;
  }

  setFleeing(value: boolean): void {
    this.fleeing = value;
  }

  setFleeSpeed(speed: number): void {
    this.fleeSpeed = speed;
  }

  isFleeing(): boolean {
    return this.fleeing;
  }

  isChasing(): boolean {
    return this.chasing;
  }

  /** Move toward target; only collides with walls/furniture */
  updateChase(dt: number, targetX: number, targetY: number, map: TileMap): void {
    if (!this.chasing) return;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    let dx = targetX - centerX;
    let dy = targetY - centerY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    dx /= len;
    dy /= len;
    const moveX = dx * this.chaseSpeed * dt;
    const moveY = dy * this.chaseSpeed * dt;
    if (!this.collidesWithMap(this.x + moveX, this.y, map)) this.x += moveX;
    if (!this.collidesWithMap(this.x, this.y + moveY, map)) this.y += moveY;
  }

  /** Move away from a point (e.g. murderer fleeing from police) */
  updateFlee(dt: number, fromX: number, fromY: number, map: TileMap): void {
    if (!this.fleeing) return;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    let dx = centerX - fromX;
    let dy = centerY - fromY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    dx /= len;
    dy /= len;
    const moveX = dx * this.fleeSpeed * dt;
    const moveY = dy * this.fleeSpeed * dt;
    if (!this.collidesWithMap(this.x + moveX, this.y, map)) this.x += moveX;
    if (!this.collidesWithMap(this.x, this.y + moveY, map)) this.y += moveY;
  }

  private collidesWithMap(x: number, y: number, map: TileMap): boolean {
    const left = Math.floor(x / TILE_SIZE);
    const right = Math.ceil((x + this.width) / TILE_SIZE);
    const top = Math.floor(y / TILE_SIZE);
    const bottom = Math.ceil((y + this.height) / TILE_SIZE);
    for (let ty = top; ty < bottom; ty++) {
      for (let tx = left; tx < right; tx++) {
        if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return true;
        const tile = map.getTile(tx, ty);
        if (
            tile === TILE_WALL ||
            tile === TILE_WOOD_WALL ||
            tile === TILE_ROCK_WALL ||
            tile === TILE_MANOR_WALL ||
            tile === TILE_GATE_WALL ||
            tile === TILE_FURNITURE
        )
            return true;
      }
    }
    return false;
  }

  render(ctx: CanvasRenderingContext2D) {
    // Render NPC sprite from spritesheet, scaled to occupy 4 tiles (2x2)
    spriteLoader.drawSprite(ctx, this.spriteName, this.x, this.y, this.width, this.height);
    
    if (!this.showNameLabel) return;

    // Render name above NPC
    ctx.fillStyle = "#fff";
    ctx.font = "16px serif";
    ctx.textAlign = "center";
    ctx.fillText(this.name, this.x + this.width / 2, this.y - 5);
    ctx.textAlign = "left"; // Reset alignment
  }
}
