import { Entity } from "./Entity";
import { TILE_SIZE } from "../world/constants";
import { spriteLoader } from "../assets/SpriteLoader";
import { TileMap } from "../world/TileMap";
import { feetBlocked, type ChaseField } from "../world/pathfinding";
import { getHumanoidStyle, type CharacterFacing } from "../assets/procedural/characters";
import {
    getHumanoidFrame,
    HUMANOID_NATIVE_H,
    HUMANOID_NATIVE_W
} from "../assets/procedural/characterAnimation";
import { getSpriteDef } from "../assets/procedural/registry";
import type { CharacterPose } from "../assets/procedural/characters";
import { getHoodedFrame } from "../assets/procedural/hoodedFigure";
import { drawKnife, knifeHandAnchor } from "../render/knifeDraw";
import { NpcIdle, type IdleObstacle } from "./NpcIdle";

const WALK_ANIM_FPS = 8;
const PANIC_WAVE_FPS = 6;
const PANIC_SHOUTS = ["Eek!", "Aaah!", "Help!", "Murder!", "Run!", "Heavens!", "Oh no!", "Save us!", "Eeeek!", "Mercy!"];
/** One knife cycle (raise, stab, recover). */
const KNIFE_CYCLE_SECONDS = 0.9;

import type { Facing } from "./Player";

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
  private swingingKnife = false;
  private knifeSwingTime = 0;
  private walkTime = 0;
  /** performance.now() of the last movement step (walk frames play while recent). */
  private lastWalkMs = -Infinity;
  /** Waving arms in alarm (bystanders while the murderer is loose). */
  private panicking = false;
  private heavingOverhead = false;
  /** Ambient strolling and scratching while nothing else is going on. */
  private readonly idle = new NpcIdle();
  private panicTime = 0;
  private panicShout: string | null = null;
  private shoutRemaining = 0;
  private shoutCooldown = 0;
  private lastShout: string | null = null;
  private stunnedRemaining = 0;
  private stunDuration = 0;
  /** +1 or -1 — which way they tip when shoved. */
  private fallSign = 1;
  /** Attic window throw (and similar) — override stun tip while set. */
  cutsceneScale = 1;
  cutsceneAlpha = 1;
  cutsceneTilt = 0;
  /** Draw-only shift (e.g. mid-leap) — the feet box, collision and depth sort stay put. */
  renderOffsetX = 0;
  renderOffsetY = 0;
  facing: Facing = "down";

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

  getSpriteName(): string {
    return this.spriteName;
  }

  setSpriteName(name: string): void {
    this.spriteName = name;
  }

  setName(name: string): void {
    this.name = name;
  }

  getShowNameLabel(): boolean {
    return this.showNameLabel;
  }

  setShowNameLabel(value: boolean): void {
    this.showNameLabel = value;
  }

  setFacing(facing: Facing): void {
    this.facing = facing;
  }

  getFacing(): Facing {
    return this.facing;
  }

  /** Advance the walk cycle and face the direction of travel (also used by cutscenes). */
  animateWalk(dt: number, dx: number, dy: number): void {
    if (Math.abs(dx) + Math.abs(dy) < 0.01) return;
    this.walkTime += dt;
    this.lastWalkMs = performance.now();
    this.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
  }

  /** Advance the knife swing (for scripted scenes that move the NPC directly). */
  advanceKnifeSwing(dt: number): void {
    if (this.swingingKnife) this.knifeSwingTime += dt;
  }

  /**
   * Wave arms in alarm. Anyone with their back to the camera turns to face it;
   * their authored facing returns when the panic ends.
   */
  setPanicking(value: boolean): void {
    if (value === this.panicking) return;
    this.panicking = value;
    // Random phase so a room full of people doesn't wave in lockstep
    this.panicTime = value ? Math.random() : 0;
    this.panicShout = null;
    this.shoutRemaining = 0;
    // First shout comes almost at once; staggered so not everyone yells together
    this.shoutCooldown = Math.random() * 0.6;
  }

  /** Current panic exclamation, or null between shouts. */
  getPanicShout(): string | null {
    return this.panicShout;
  }

  getPanicTime(): number {
    return this.panicTime;
  }

  /** Only people react — not the body or other non-humanoid props. */
  canPanic(): boolean {
    return getHumanoidStyle(this.spriteName) !== undefined;
  }

  /** Arms raised overhead (Ytte heaving the door bar). */
  setHeavingOverhead(value: boolean): void {
    this.heavingOverhead = value;
  }

  /** Humanoid, standing NPCs potter about when idle (not bodies or props). */
  canIdle(): boolean {
    return !this.walkable && this.canPanic();
  }

  /** Short strolls near where they stand and the odd scratch. */
  updateIdle(dt: number, map: TileMap, obstacles: readonly IdleObstacle[]): void {
    this.idle.update(dt, this, map, obstacles);
  }

  /** Drop any stroll or scratch in progress (dialog, chase, scare). */
  interruptIdle(): void {
    this.idle.interrupt(this);
  }

  isPanicking(): boolean {
    return this.panicking;
  }

  tickPanic(dt: number): void {
    if (!this.panicking) return;
    this.panicTime += dt;
    if (this.panicShout) {
      this.shoutRemaining -= dt;
      if (this.shoutRemaining <= 0) {
        this.panicShout = null;
        this.shoutCooldown = 0.6 + Math.random() * 1.4;
      }
      return;
    }
    this.shoutCooldown -= dt;
    if (this.shoutCooldown > 0) return;
    const choices = PANIC_SHOUTS.filter((w) => w !== this.lastShout);
    this.panicShout = choices[Math.floor(Math.random() * choices.length)];
    this.lastShout = this.panicShout;
    this.shoutRemaining = 1 + Math.random() * 0.5;
  }

  /** Facing used for drawing (panicking NPCs turn toward the camera). */
  private renderFacing(): Facing {
    return this.panicking && this.facing === "up" ? "down" : this.facing;
  }

  private currentPose(): CharacterPose {
    if (this.panicking) return Math.floor(this.panicTime * PANIC_WAVE_FPS) % 2 === 0 ? "panic_a" : "panic_b";
    // Hands close together overhead, as if gripping something
    if (this.heavingOverhead) return "panic_b";
    const idlePose = this.idle.pose;
    if (idlePose) return idlePose;
    if (performance.now() - this.lastWalkMs > 120) return "idle";
    const frame = Math.floor(this.walkTime * WALK_ANIM_FPS) % 4;
    return (["walk_a", "walk_b", "walk_c", "walk_d"] as const)[frame];
  }

  setSwingingKnife(value: boolean): void {
    this.swingingKnife = value;
    if (!value) this.knifeSwingTime = 0;
  }

  isSwingingKnife(): boolean {
    return this.swingingKnife;
  }

  setChasing(value: boolean): void {
    this.chasing = value;
  }

  /**
   * Knock the NPC down — they stop chasing until the stun expires.
   * @param fallSign tip direction (+1 / -1); defaults to tipping right.
   */
  stun(seconds: number, fallSign = 1): void {
    this.stunDuration = Math.max(0, seconds);
    this.stunnedRemaining = this.stunDuration;
    this.fallSign = fallSign >= 0 ? 1 : -1;
    this.chasing = false;
    this.fleeing = false;
    this.setSwingingKnife(false);
  }

  isStunned(): boolean {
    return this.stunnedRemaining > 0;
  }

  /** Clear knock-down state immediately (e.g. after a room change). */
  clearStun(): void {
    this.stunnedRemaining = 0;
    this.stunDuration = 0;
  }

  /** Returns true when stun just ended and chase should resume. */
  tickStun(dt: number): boolean {
    if (this.stunnedRemaining <= 0) return false;
    this.stunnedRemaining = Math.max(0, this.stunnedRemaining - dt);
    return this.stunnedRemaining <= 0;
  }

  /** 0 = upright, 1 = fully down — eased fall / get-up over the stun. */
  private getFallProgress(): number {
    if (this.stunDuration <= 0 || this.stunnedRemaining <= 0) return 0;
    const FALL_IN = 0.38;
    const GET_UP = 0.32;
    const elapsed = this.stunDuration - this.stunnedRemaining;

    if (elapsed < FALL_IN) {
      const t = elapsed / FALL_IN;
      // ease-out cubic — quick tip that settles
      return 1 - Math.pow(1 - t, 3);
    }

    if (this.stunnedRemaining < GET_UP) {
      const t = 1 - this.stunnedRemaining / GET_UP;
      // ease-in cubic — slow push off the floor then up
      return 1 - t * t * t;
    }

    return 1;
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
  /**
   * Run toward a target centre. With a `field` (flooded from the target) the
   * chaser routes around furniture instead of walking straight at it.
   */
  updateChase(dt: number, targetX: number, targetY: number, map: TileMap, field?: ChaseField): void {
    if (!this.chasing) return;
    if (this.swingingKnife) this.knifeSwingTime += dt;
    const waypoint = field?.steer(this.x, this.y);
    if (waypoint) {
      targetX = waypoint.x + this.width / 2;
      targetY = waypoint.y + this.height / 2;
    }
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    let dx = targetX - centerX;
    let dy = targetY - centerY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    // Don't overshoot a waypoint (keeps him from jittering around path corners)
    const step = Math.min(this.chaseSpeed * dt, len);
    dx /= len;
    dy /= len;
    const startX = this.x;
    const startY = this.y;
    this.stepWithCollision(dx * step, dy * step, map);
    this.animateWalk(dt, this.x - startX, this.y - startY);
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
    const startX = this.x;
    const startY = this.y;
    this.stepWithCollision(moveX, moveY, map);
    this.animateWalk(dt, this.x - startX, this.y - startY);
  }

  /** Feet-row collision against walls and furniture (same rule as the player). */
  wouldCollideAt(x: number, y: number, map: TileMap): boolean {
    return feetBlocked(map, x, y, this.width, this.height);
  }

  /** Axis-separated step; when already wedged in a wall (e.g. shoved into furniture) walk out freely. */
  private stepWithCollision(moveX: number, moveY: number, map: TileMap): void {
    if (this.wouldCollideAt(this.x, this.y, map)) {
      this.x += moveX;
      this.y += moveY;
      return;
    }
    const startX = this.x;
    const startY = this.y;
    if (!this.wouldCollideAt(this.x + moveX, this.y, map)) this.x += moveX;
    if (!this.wouldCollideAt(this.x, this.y + moveY, map)) this.y += moveY;
    // Squeezing diagonally past a corner can be clear even when each axis alone is not
    if (this.x === startX && this.y === startY && !this.wouldCollideAt(startX + moveX, startY + moveY, map)) {
      this.x += moveX;
      this.y += moveY;
    }
  }

  /** Sprite height when drawn at uniform scale (head overhangs above the entity box). */
  private spriteDrawHeight(): number {
    const def = getSpriteDef(this.spriteName);
    const nativeW = def?.nativeWidth ?? HUMANOID_NATIVE_W;
    const nativeH = def?.nativeHeight ?? HUMANOID_NATIVE_H;
    return Math.round(nativeH * (this.width / nativeW));
  }

  /** On-screen sprite box (head overhangs the entity box). */
  getSpriteBox(): { x: number; y: number; w: number; h: number } {
    const h = this.spriteDrawHeight();
    return { x: Math.round(this.x), y: Math.round(this.y + this.height - h), w: this.width, h };
  }

  private drawIdleSprite(ctx: CanvasRenderingContext2D, dx: number, dy: number): void {
    const drawHeight = this.spriteDrawHeight();
    const top = Math.round(dy + this.height - drawHeight);
    const left = Math.round(dx);
    const facing = this.renderFacing();
    const bakeFacing: CharacterFacing = facing === "up" ? "up" : facing === "down" ? "down" : "right";
    const pose = this.currentPose();
    const style = getHumanoidStyle(this.spriteName);
    let frame: HTMLCanvasElement | null = null;
    if (this.spriteName === "hooded_figure") frame = getHoodedFrame(bakeFacing, pose);
    else if (style) frame = getHumanoidFrame(style, bakeFacing, pose);
    if (!frame) {
      spriteLoader.drawSprite(ctx, this.spriteName, left, top, this.width, drawHeight);
      return;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(left, top);
    if (facing === "left") {
      ctx.translate(this.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(frame, 0, 0, this.width, drawHeight);
    ctx.restore();
  }

  clearCutscenePose(): void {
    this.cutsceneScale = 1;
    this.cutsceneAlpha = 1;
    this.cutsceneTilt = 0;
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.renderOffsetX !== 0 || this.renderOffsetY !== 0) {
      ctx.save();
      ctx.translate(Math.round(this.renderOffsetX), Math.round(this.renderOffsetY));
      this.renderAtFeet(ctx);
      ctx.restore();
      return;
    }
    this.renderAtFeet(ctx);
  }

  private renderAtFeet(ctx: CanvasRenderingContext2D): void {
    const poseActive =
      Math.abs(this.cutsceneScale - 1) > 0.001 ||
      this.cutsceneAlpha < 0.999 ||
      Math.abs(this.cutsceneTilt) > 0.001;

    if (poseActive) {
      if (this.cutsceneAlpha <= 0.01) return;
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;
      ctx.save();
      ctx.globalAlpha *= Math.max(0, Math.min(1, this.cutsceneAlpha));
      ctx.translate(cx, cy);
      ctx.rotate(this.cutsceneTilt);
      ctx.scale(this.cutsceneScale, this.cutsceneScale);
      this.drawIdleSprite(ctx, -this.width / 2, -this.height / 2);
      ctx.restore();
      return;
    }

    const fall = this.getFallProgress();
    if (fall > 0.001) {
      const angle = this.fallSign * fall * (Math.PI / 2);
      // Pivot near the feet so the tip reads as falling over
      const pivotX = this.x + this.width / 2;
      const pivotY = this.y + this.height * 0.85;
      const sink = fall * this.height * 0.12;

      ctx.save();
      ctx.translate(pivotX, pivotY + sink);
      ctx.rotate(angle);
      this.drawIdleSprite(ctx, -this.width / 2, -this.height * 0.85);
      ctx.restore();
    } else {
      const knifeBehind = this.swingingKnife && this.facing === "up";
      if (knifeBehind) this.drawHeldKnife(ctx);
      this.drawIdleSprite(ctx, this.x, this.y);
      if (this.swingingKnife && !knifeBehind) this.drawHeldKnife(ctx);
    }

    if (!this.showNameLabel || fall > 0.2) return;

    // Render name above NPC
    ctx.fillStyle = "#fff";
    ctx.font = "16px \"IM Fell English\", \"Libre Baskerville\", serif";
    ctx.textAlign = "center";
    ctx.fillText(this.name, this.x + this.width / 2, this.y + this.height - this.spriteDrawHeight() - 5);
    ctx.textAlign = "left"; // Reset alignment
  }

  /** Knife in the figure's hand, in a raise → stab → recover cycle. */
  private drawHeldKnife(ctx: CanvasRenderingContext2D): void {
    const box = this.getSpriteBox();
    const scale = box.w / HUMANOID_NATIVE_W;
    const bake = this.facing === "up" ? "up" : this.facing === "down" ? "down" : "right";
    const hand = knifeHandAnchor(this.spriteName, bake);
    const mirror = this.facing === "left";
    const hx = mirror ? HUMANOID_NATIVE_W - hand.x : hand.x;
    const phase = (this.knifeSwingTime % KNIFE_CYCLE_SECONDS) / KNIFE_CYCLE_SECONDS;
    drawKnife(ctx, box.x + hx * scale, box.y + hand.y * scale, phase, mirror || this.facing === "up", scale);
  }
}
