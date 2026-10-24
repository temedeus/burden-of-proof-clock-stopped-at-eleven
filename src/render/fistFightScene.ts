/**
 * Fist fight close-up: the detective (left) and Chef Ytte (right) side-on in the
 * secret tunnel or the dining room, drawn from the in-game 32×40 frames at a
 * chunky integer scale.
 */
import type { PlayerSpriteName } from "@cse/content-schema";
import { getHumanoidFrame, HUMANOID_NATIVE_H, HUMANOID_NATIVE_W } from "../assets/procedural/characterAnimation";
import {
    drawFireplaceAnimated,
    drawFireplaceStone,
    FIREPLACE_H,
    FIREPLACE_W
} from "../assets/procedural/fireplace";
import { drawFireplaceSoot } from "./diningBurnDamage";
import { seeded } from "../assets/procedural/furnitureKit";
import {
    getHumanoidStyle,
    PLAYER_CHARACTER_STYLES,
    type CharacterPose,
    type HumanoidStyle
} from "../assets/procedural/characters";
import {
    FIGHT_OUTRO_SECONDS,
    FIGHT_TUTORIAL_LOCK_SECONDS,
    KO_SLOWMO_SECONDS,
    type Fighter,
    type FistFight
} from "../systems/FistFight";

/** Where the brawl happens — picks the backdrop. */
export type FistFightSetting = "tunnel" | "dining";

export interface FistFightCast {
    playerSprite: PlayerSpriteName;
    murdererSprite: string;
    setting?: FistFightSetting;
    /** Dining room only: whether the hearth is still burning (it's cold after the fire). */
    fireLit?: boolean;
}

const FONT_SC = "\"IM Fell English SC\", \"IM Fell English\", \"Libre Baskerville\", serif";
const FONT = "\"IM Fell English\", \"Libre Baskerville\", serif";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (v: number) => 1 - (1 - v) * (1 - v);

function murdererStyle(sprite: string): HumanoidStyle {
    // The hooded disguise has no fighting frames — he fights unmasked
    return getHumanoidStyle(sprite) ?? getHumanoidStyle("worker_man_grin")!;
}

/** Native px from the frame bottom to the soles: dresses stand on a lower hem line than trousers. */
function soleLift(style: HumanoidStyle): number {
    return style.dress ? 2 : 6;
}

/**
 * Dining room behind the fighters: speckled plaster over dark wainscot panelling,
 * parquet floor, and the marble fireplace set back on the far wall.
 */
function drawDiningRoom(
    ctx: CanvasRenderingContext2D,
    cx: number,
    groundY: number,
    s: number,
    time: number,
    fireLit: boolean
): void {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    // The far wall meets the floor a little above the fighters' feet
    const wallBase = groundY - 6 * s;
    const wainscotTop = wallBase - 26 * s;

    // Plaster with a fine speckle, like the in-game wall tiles
    ctx.fillStyle = "#d6cdbd";
    ctx.fillRect(0, 0, W, wainscotTop);
    const rand = seeded(41);
    for (let i = 0; i < (W * wainscotTop) / (s * s * 14); i++) {
        ctx.fillStyle = rand() < 0.5 ? "#c4baa8" : "#e4ddd0";
        ctx.fillRect(Math.floor((rand() * W) / s) * s, Math.floor((rand() * wainscotTop) / s) * s, s, s);
    }

    // Wainscot: dado rail, then raised panels between lighter stiles
    ctx.fillStyle = "#3a2516";
    ctx.fillRect(0, wainscotTop, W, wallBase - wainscotTop);
    ctx.fillStyle = "#7a5636";
    ctx.fillRect(0, wainscotTop, W, 2 * s);
    ctx.fillStyle = "#24160c";
    ctx.fillRect(0, wainscotTop + 2 * s, W, s);
    const panelW = 9 * s;
    for (let x = 0; x < W; x += panelW) {
        ctx.fillStyle = "#4e331f";
        ctx.fillRect(x + 2 * s, wainscotTop + 5 * s, panelW - 4 * s, wallBase - wainscotTop - 9 * s);
        ctx.fillStyle = "#5e3f27";
        ctx.fillRect(x + 2 * s, wainscotTop + 5 * s, panelW - 4 * s, s);
        ctx.fillStyle = "#2a1a0e";
        ctx.fillRect(x + 2 * s, wallBase - 5 * s, panelW - 4 * s, s);
    }
    ctx.fillStyle = "#2a1a0e";
    ctx.fillRect(0, wallBase - 2 * s, W, 2 * s);

    // Parquet: staggered dark planks receding to the wall
    ctx.fillStyle = "#3a281c";
    ctx.fillRect(0, wallBase, W, H - wallBase);
    const plankH = 3 * s;
    for (let row = 0; wallBase + row * plankH < H; row++) {
        const y = wallBase + row * plankH;
        ctx.fillStyle = "#2a1c12";
        ctx.fillRect(0, y, W, Math.max(1, Math.round(s / 2)));
        const plankW = 16 * s;
        const offset = (row * 7 * s) % plankW;
        for (let x = -offset; x < W; x += plankW) {
            ctx.fillStyle = row % 2 ? "#44301f" : "#3e2b1c";
            ctx.fillRect(x + s, y + s, plankW - 2 * s, plankH - s);
            ctx.fillStyle = "#2a1c12";
            ctx.fillRect(x, y, Math.max(1, Math.round(s / 2)), plankH);
        }
    }

    // Fireplace set back behind the fighters, chimney breast running out of frame
    const fs = s * 0.62;
    const fw = FIREPLACE_W * fs;
    const fh = FIREPLACE_H * fs;
    const fx = Math.round(cx - fw / 2);
    const fy = Math.round(wallBase + 2 * s - fh);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (fireLit) {
        drawFireplaceAnimated(ctx, fx, fy, fw, fh, time);
    } else {
        // After the fire: cold ash in the grate and soot up the chimneypiece, as in the room
        ctx.save();
        ctx.translate(fx, fy);
        ctx.scale(fs, fs);
        drawFireplaceStone(ctx);
        ctx.restore();
        drawFireplaceSoot(ctx, fx, fy, fw, fh);
    }
    ctx.restore();

    // Room light: warm on the hearth when it burns, otherwise a dim evening gloom
    const glow = ctx.createRadialGradient(cx, groundY - 22 * s, 8 * s, cx, groundY - 22 * s, 100 * s);
    glow.addColorStop(0, fireLit ? "rgba(255, 150, 60, 0.16)" : "rgba(255, 220, 170, 0.06)");
    glow.addColorStop(0.6, "rgba(0, 0, 0, 0.3)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0.85)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
}

/** Frame with feet centred on (feetX, groundY); `tilt` pivots at the feet. */
function drawFigure(
    ctx: CanvasRenderingContext2D,
    frame: HTMLCanvasElement,
    feetX: number,
    groundY: number,
    w: number,
    h: number,
    mirror: boolean,
    tilt: number
): void {
    ctx.save();
    ctx.translate(Math.round(feetX), Math.round(groundY));
    ctx.rotate(tilt);
    if (mirror) ctx.scale(-1, 1);
    ctx.drawImage(frame, -w / 2, -h, w, h);
    ctx.restore();
}

/** Rough-hewn tunnel wall and floor, lit by a lantern between the fighters. */
function drawTunnel(ctx: CanvasRenderingContext2D, cx: number, groundY: number, s: number, time: number): void {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    ctx.fillStyle = "#0c0a09";
    ctx.fillRect(0, 0, W, H);

    const bw = 14 * s;
    const bh = 7 * s;
    for (let row = 0; row * bh < groundY; row++) {
        const offset = row % 2 ? bw / 2 : 0;
        for (let x = -bw; x < W + bw; x += bw) {
            const shade = 38 + ((row * 7 + Math.floor((x + offset) / bw) * 13) % 11);
            ctx.fillStyle = `rgb(${shade + 6}, ${shade}, ${shade - 6})`;
            ctx.fillRect(Math.round(x + offset + s), Math.round(row * bh + s), bw - 2 * s, bh - 2 * s);
        }
    }
    ctx.fillStyle = "#1c1814";
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = "#2a241e";
    ctx.fillRect(0, groundY, W, s);

    // Flickering lantern pool, dark at the edges
    const flicker = 1 + Math.sin(time * 9) * 0.03 + Math.sin(time * 23) * 0.02;
    const light = ctx.createRadialGradient(cx, groundY - 20 * s, 6 * s, cx, groundY - 20 * s, 95 * s * flicker);
    light.addColorStop(0, "rgba(255, 170, 90, 0.18)");
    light.addColorStop(0.55, "rgba(0, 0, 0, 0.35)");
    light.addColorStop(1, "rgba(0, 0, 0, 0.92)");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, W, H);
}

/** Little burst of pixel stars where a punch lands; a guarded one is a small dull knock. */
function drawImpact(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, guarded = false): void {
    if (t > 0.22) return;
    const r = (3 + t * (guarded ? 20 : 50)) * s;
    const fade = 1 - t / 0.22;
    const rays = guarded ? 4 : 8;
    for (let i = 0; i < rays; i++) {
        const a = (i / rays) * Math.PI * 2 + 0.3;
        ctx.fillStyle = guarded
            ? `rgba(190, 180, 160, ${fade})`
            : i % 2
              ? `rgba(255, 240, 160, ${fade})`
              : `rgba(255, 255, 255, ${fade})`;
        ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), s * 2, s * 2);
    }
    if (guarded) return;
    ctx.fillStyle = `rgba(255, 255, 255, ${fade * 0.9})`;
    ctx.fillRect(Math.round(x - s * 2), Math.round(y - s * 2), s * 4, s * 4);
}

/** Health (segmented, one notch per clean hit) over a thinner stamina bar. */
function drawFighterBars(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    label: string,
    fighter: Fighter,
    alignRight: boolean,
    time: number
): void {
    const h = 14;
    ctx.font = `bold 18px ${FONT_SC}`;
    ctx.textAlign = alignRight ? "right" : "left";
    ctx.fillStyle = "#e8e0d5";
    ctx.fillText(label, alignRight ? x + w : x, y - 8);

    const fill = (fy: number, fh: number, f: number, color: string) => {
        ctx.fillStyle = "#1a1510";
        ctx.fillRect(x, fy, w, fh);
        const fw = (w - 4) * clamp01(f);
        ctx.fillStyle = color;
        ctx.fillRect(alignRight ? x + w - 2 - fw : x + 2, fy + 2, fw, fh - 4);
        ctx.strokeStyle = "#c4a574";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, fy, w, fh);
    };

    const health = fighter.health / fighter.maxHealth;
    fill(y, h, health, health < 0.3 ? "#8a2828" : health < 0.6 ? "#c85020" : "#48a058");
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    for (let i = 1; i < fighter.maxHealth; i++) ctx.fillRect(Math.round(x + (w * i) / fighter.maxHealth), y + 2, 2, h - 4);

    // Stamina: amber, flashing red while winded
    const sy = y + h + 5;
    const flash = fighter.winded && Math.floor(time * 6) % 2 === 0;
    fill(sy, 9, fighter.stamina, fighter.winded ? (flash ? "#c83828" : "#7a2418") : "#d8a838");
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = fighter.winded ? "#e86050" : "rgba(232, 224, 213, 0.7)";
    ctx.fillText(fighter.winded ? "Winded!" : "Stamina", alignRight ? x + w : x, sy + 24);
    ctx.textAlign = "left";
}

const BLOOD = "#7a1010";
const BLOOD_HI = "#a82020";
const BLOOD_DARK = "#4e0808";
const TOOTH = "#ece4d0";
const TOOTH_SHADE = "#a89c84";

/** Stable 0..1 noise per particle so the spray looks random but replays identically. */
function hash01(i: number, k: number): number {
    const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/** Ballistic arc from (ox, oy); returns the point at time `t`, or the landing spot once it hits `floorY`. */
function arc(
    ox: number,
    oy: number,
    vx: number,
    vy: number,
    g: number,
    floorY: number,
    t: number
): { x: number; y: number; landed: boolean } {
    const y = oy + vy * t + 0.5 * g * t * t;
    if (y < floorY) return { x: ox + vx * t, y, landed: false };
    const land = (-vy + Math.sqrt(vy * vy + 2 * g * (floorY - oy))) / g;
    return { x: ox + vx * land, y: floorY, landed: true };
}

/**
 * Knockout spray from Ytte's mouth: teeth tumbling end over end and blood droplets,
 * flung away from the detective's fist and settling on the tunnel floor. `t` is
 * scene time since the blow (slowed during the slow motion).
 */
function drawKnockoutDebris(ctx: CanvasRenderingContext2D, ox: number, oy: number, groundY: number, s: number, t: number): void {
    const g = 170 * s;

    for (let i = 0; i < 20; i++) {
        const delay = hash01(i, 1) * 0.06;
        const tt = t - delay;
        if (tt <= 0) continue;
        const vx = (35 + hash01(i, 3) * 85) * s;
        const vy = -(18 + hash01(i, 4) * 52) * s;
        const size = hash01(i, 5) > 0.6 ? 2 * s : s;
        const floorY = groundY + Math.round(hash01(i, 6) * 5) * s;
        const p = arc(ox, oy, vx, vy, g, floorY, tt);
        if (p.landed) {
            // Splat, flattened on the floor
            ctx.fillStyle = BLOOD_DARK;
            ctx.fillRect(Math.round(p.x - size * 1.5), Math.round(p.y), Math.round(size * 3), s);
            ctx.fillStyle = BLOOD;
            ctx.fillRect(Math.round(p.x - size), Math.round(p.y), Math.round(size * 2), s);
        } else {
            ctx.fillStyle = i % 3 === 0 ? BLOOD_HI : BLOOD;
            // Stretched along the fall once it's dropping fast
            const falling = vy + g * tt > 30 * s;
            ctx.fillRect(Math.round(p.x), Math.round(p.y), size, falling ? size * 2 : size);
        }
    }

    for (let i = 0; i < 3; i++) {
        const vx = (45 + hash01(i, 7) * 40) * s;
        const vy = -(48 + hash01(i, 8) * 22) * s;
        const floorY = groundY + (1 + i * 2) * s;
        const p = arc(ox, oy - s, vx, vy, g, floorY, t);
        const spin = hash01(i, 9) > 0.5 ? 1 : -1;
        // Tumbles in the air, lies on its side once down
        const angle = p.landed ? Math.PI / 2 : spin * t * (9 + i * 3);
        ctx.save();
        ctx.translate(Math.round(p.x), Math.round(p.y - (p.landed ? s : 0)));
        ctx.rotate(angle);
        ctx.fillStyle = TOOTH_SHADE;
        ctx.fillRect(-s, -1.5 * s, 2 * s, 3 * s);
        ctx.fillStyle = TOOTH;
        ctx.fillRect(-s, -1.5 * s, 2 * s, 2 * s);
        // Bloody root
        ctx.fillStyle = BLOOD_HI;
        ctx.fillRect(-s, 0.5 * s, s, s);
        ctx.restore();
    }
}

/** Cinematic slow-motion dressing: letterbox bars slide in and a flash on the blow. */
function drawSlowMoFrame(ctx: CanvasRenderingContext2D, fight: FistFight): void {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const flash = clamp01(1 - fight.outroTime / 0.06);
    if (flash > 0) {
        ctx.fillStyle = `rgba(255, 250, 235, ${flash * 0.45})`;
        ctx.fillRect(0, 0, W, H);
    }
    // Bars in during the slow motion, back out as time catches up
    const r = fight.outroRealTime;
    const inT = easeOut(clamp01(r / 0.25));
    const outT = clamp01((r - KO_SLOWMO_SECONDS) / 0.35);
    const bar = Math.round(H * 0.08 * inT * (1 - outT));
    if (bar > 0) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, bar);
        ctx.fillRect(0, H - bar, W, bar);
    }
    // Cold, desaturated tint while time crawls
    ctx.fillStyle = `rgba(20, 24, 40, ${0.22 * (1 - outT)})`;
    ctx.fillRect(0, 0, W, H);
}

/** Big "!" in the telegraph colours, as drawn over Ytte's head. */
function drawBang(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number): void {
    ctx.font = `bold ${size}px ${FONT_SC}`;
    ctx.textAlign = "center";
    ctx.fillStyle = color;
    ctx.fillText("!", x, y);
}

/** How-to card before the first exchange: what the red and yellow "!" mean. */
function drawTutorialCard(ctx: CanvasRenderingContext2D, fight: FistFight, time: number, touchControls: boolean): void {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, W, H);

    const cw = Math.min(560, W - 48);
    const ch = 300;
    const x = Math.round((W - cw) / 2);
    const y = Math.round((H - ch) / 2);
    ctx.fillStyle = "rgba(20, 16, 12, 0.94)";
    ctx.fillRect(x, y, cw, ch);
    ctx.strokeStyle = "#c4a574";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cw, ch);

    ctx.textAlign = "center";
    ctx.font = `bold 28px ${FONT_SC}`;
    ctx.fillStyle = "#e8c860";
    ctx.fillText("Bare-knuckle brawl", W / 2, y + 44);

    const key = touchControls ? "Interact" : "E";
    const rows: { color: string; head: string; body: string }[] = [
        { color: "#a03028", head: "Red — he's winding up", body: "Ytte is about to strike. Keep your guard up." },
        {
            color: "#ffe060",
            head: `Yellow — strike now!`,
            body: `Press ${key} to slip his punch and hit back.`
        }
    ];
    rows.forEach((row, i) => {
        const ry = y + 104 + i * 70;
        // The yellow one pulses like it does in the fight
        const pulse = i === 1 ? 1 + Math.round(Math.sin(time * 12)) * 0.08 : 1;
        drawBang(ctx, x + 56, ry + 18, row.color, Math.round(52 * pulse));
        ctx.textAlign = "left";
        ctx.font = `bold 21px ${FONT_SC}`;
        ctx.fillStyle = row.color;
        ctx.fillText(row.head, x + 100, ry);
        ctx.font = `17px ${FONT}`;
        ctx.fillStyle = "#e8e0d5";
        ctx.fillText(row.body, x + 100, ry + 24);
    });

    ctx.textAlign = "center";
    ctx.font = `15px ${FONT}`;
    ctx.fillStyle = "rgba(232, 224, 213, 0.7)";
    ctx.fillText("Punches cost stamina — swing into his guard and he'll hit back.", W / 2, y + ch - 62);

    const ready = fight.tutorialTime >= FIGHT_TUTORIAL_LOCK_SECONDS;
    ctx.font = `bold 20px ${FONT_SC}`;
    ctx.fillStyle = ready ? `rgba(232, 200, 96, ${0.7 + Math.sin(time * 5) * 0.3})` : "rgba(232, 200, 96, 0.3)";
    ctx.fillText(touchControls ? "Tap Interact to fight" : "Press E to fight", W / 2, y + ch - 26);
    ctx.textAlign = "left";
}

export function drawFistFightScene(
    ctx: CanvasRenderingContext2D,
    fight: FistFight,
    cast: FistFightCast,
    time: number,
    touchControls: boolean
): void {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const s = Math.max(4, Math.round((7 * H) / 600));
    const w = HUMANOID_NATIVE_W * s;
    const h = HUMANOID_NATIVE_H * s;
    const cx = W / 2;
    const groundY = Math.round(H * 0.8);

    const ev = fight.lastEvent;
    const since = fight.sinceEvent;
    const outro = easeOut(clamp01(fight.outroTime / (FIGHT_OUTRO_SECONDS * 0.4)));

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // Camera jolts when the detective takes a hit
    if (ev === "hit_player" && since < 0.25) ctx.translate(Math.round(Math.sin(since * 80) * s * 2 * (1 - since / 0.25)), 0);
    if (cast.setting === "dining") drawDiningRoom(ctx, cx, groundY, s, time, cast.fireLit === true);
    else drawTunnel(ctx, cx, groundY, s, time);

    // --- Detective (left, facing right) ---
    let playerPose: CharacterPose = "fight_guard";
    let pdx = 0;
    let pdy = Math.round(Math.sin(time * 5) * 0.6) * s;
    let ptilt = 0;
    if (fight.result === "lost") {
        playerPose = "idle";
        ptilt = -outro * (Math.PI / 2);
        pdx = -outro * 4 * s;
        // Lying flat: lift the body back onto the floor
        pdy = -outro * 8 * s;
    } else if (ev === "hit_player" && since < 0.35) {
        playerPose = "idle";
        pdx = -easeOut(1 - since / 0.35) * 4 * s;
        ptilt = -0.12 * (1 - since / 0.35);
    } else if (fight.ducked && fight.phase !== "guard" && since < 0.4) {
        // Slipped under the swing: low lunge into the counter
        playerPose = "fight_punch";
        pdy = 2 * s;
        pdx = 3 * s;
        ptilt = 0.12;
    } else if (fight.sincePunch < 0.2) {
        playerPose = "fight_punch";
        pdx = 2 * s;
    } else if (fight.player.winded) {
        // Out of breath: guard dropped, chest heaving
        playerPose = "idle";
        pdy = Math.round(Math.abs(Math.sin(time * 10))) * s;
        ptilt = 0.05;
    } else if (ev === "chip_player" && since < 0.2) {
        // Took it on the forearms
        pdx = -s;
    }
    const playerStyle = PLAYER_CHARACTER_STYLES[cast.playerSprite] ?? PLAYER_CHARACTER_STYLES.female_detective;
    const playerFeetX = cx - 9 * s + pdx;
    drawFigure(
        ctx,
        getHumanoidFrame(playerStyle, "right", playerPose),
        playerFeetX,
        groundY + pdy + soleLift(playerStyle) * s,
        w,
        h,
        false,
        ptilt
    );

    // --- Ytte (right, facing left) ---
    let yttePose: CharacterPose = "fight_guard";
    let ydx = 0;
    let ydy = 0;
    let ytilt = 0;
    if (fight.result === "won") {
        yttePose = "idle";
        ytilt = outro * (Math.PI / 2);
        ydx = outro * 4 * s;
        ydy = -outro * 8 * s;
    } else if (ev === "hit_ytte" && since < 0.3) {
        yttePose = "idle";
        ydx = easeOut(1 - since / 0.3) * 4 * s;
        ytilt = 0.14 * (1 - since / 0.3);
    } else if (fight.phase === "windup") {
        yttePose = "fight_windup";
        ydx = Math.round((fight.phaseTime / fight.phaseDuration) * 2) * s;
    } else if (fight.phase === "strike") {
        yttePose = "fight_punch";
        ydx = -3 * s;
    } else if (fight.phase === "recover") {
        // Overextended after the swing: guard still down
        yttePose = "idle";
        ytilt = -0.05;
    } else if (fight.ytte.winded) {
        // Out of breath: guard dropped, chest heaving
        yttePose = "idle";
        ydy = Math.round(Math.abs(Math.sin(time * 10))) * s;
        ytilt = -0.05;
    } else if (ev === "chip_ytte" && since < 0.2) {
        ydx = s;
    }
    const ytteFeetX = cx + 9 * s + ydx;
    const ytteStyle = murdererStyle(cast.murdererSprite);
    drawFigure(
        ctx,
        getHumanoidFrame(ytteStyle, "right", yttePose),
        ytteFeetX,
        groundY + ydy + soleLift(ytteStyle) * s,
        w,
        h,
        true,
        ytilt
    );

    // Telegraph: "!" over Ytte's head, flaring when it's time to duck
    if (fight.result === "ongoing" && fight.phase === "windup") {
        const bright = fight.duckWindowOpen;
        const pulse = bright ? 1 + Math.round(Math.sin(time * 40)) * 0.15 : 1;
        ctx.font = `bold ${Math.round(14 * s * pulse)}px ${FONT_SC}`;
        ctx.textAlign = "center";
        ctx.fillStyle = bright ? "#ffe060" : "#a03028";
        ctx.fillText("!", ytteFeetX, groundY - h + 2 * s);
        ctx.textAlign = "left";
    }

    if (ev === "hit_ytte" || ev === "chip_ytte") {
        drawImpact(ctx, ytteFeetX - 4 * s, groundY - h * 0.78, s, since, ev === "chip_ytte");
    }
    if (ev === "hit_player" || ev === "chip_player") {
        drawImpact(ctx, playerFeetX + 4 * s, groundY - h * 0.78, s, since, ev === "chip_player");
    }
    if (fight.result === "won") {
        // Spray leaves his mouth where the knockout punch caught him
        drawKnockoutDebris(ctx, cx + 5 * s, groundY - h * 0.78, groundY, s, fight.outroTime);
        drawSlowMoFrame(ctx, fight);
    }
    ctx.restore();

    // --- HUD ---
    const barW = Math.min(280, Math.round(W * 0.32));
    drawFighterBars(ctx, 32, 48, barW, "Detective", fight.player, false, time);
    drawFighterBars(ctx, W - 32 - barW, 48, barW, "Chef Ytte", fight.ytte, true, time);

    ctx.textAlign = "center";
    if (fight.result === "won") {
        ctx.font = `bold 40px ${FONT_SC}`;
        ctx.fillStyle = `rgba(232, 200, 96, ${clamp01(fight.outroTime / 0.4)})`;
        ctx.fillText("Knocked out!", cx, H * 0.2);
    }
    if (fight.tutorial) {
        drawTutorialCard(ctx, fight, time, touchControls);
    } else if (fight.result === "ongoing") {
        ctx.font = `bold 30px ${FONT_SC}`;
        // Outlined so it reads over the dining room's mirror and plaster
        ctx.lineJoin = "round";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "rgba(10, 6, 4, 0.85)";
        ctx.strokeText("Put 'em up!", cx, 56);
        ctx.fillStyle = "#e8e0d5";
        ctx.fillText("Put 'em up!", cx, 56);
        ctx.font = `17px ${FONT}`;
        ctx.fillStyle = "rgba(240, 230, 216, 0.85)";
        const key = touchControls ? "Interact" : "E / Space";
        ctx.fillText(
            `Red "!" — guard up · Yellow "!" — strike with ${key} · punches cost stamina`,
            cx,
            H - 24
        );
    }
    ctx.textAlign = "left";
}
