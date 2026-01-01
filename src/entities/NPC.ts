import { Entity } from "./Entity";

export class NPC extends Entity {
  constructor(
    id: string,
    x: number,
    y: number,
    public name: string,
    public role?: string
  ) {
    super(id, x, y);
  }
}
