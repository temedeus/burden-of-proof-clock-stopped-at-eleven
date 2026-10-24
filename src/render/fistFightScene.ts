/**
 * Fist fight close-up: the detective (left) and Chef Ytte (right) side-on in the
 * secret tunnel, drawn from the in-game 32×40 frames at a chunky integer scale.
 */
import type { PlayerSpriteName } from "@cse/content-schema";
import { getHumanoidFrame, HUMANOID_NATIVE_H, HUMANOID_NATIVE_W } from "../assets/procedural/characterAnimation";
import {
    getHumanoidStyle,
    PLAYER_CHARACTER_STYLES,
    type CharacterPose,
    type HumanoidStyle
} from "../assets/procedural/characters";
import { FIGHT_OUTRO_SECONDS, YTTE_STAMINA, type FistFight } from "../systems/FistFight";

export interface FistFightCast {
    playerSprite: PlayerSpriteName;
    murdererSprite: string;
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

/** Little burst of pixel stars where a punch lands. */
function drawImpact(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number): void {
    if (t > 0.22) return;
    const r = (3 + t * 50) * s;
    const fade = 1 - t / 0.22;
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        ctx.fillStyle = i % 2 ? `rgba(255, 240, 160, ${fade})` : `rgba(255, 255, 255, ${fade})`;
        ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), s * 2, s * 2);
    }
    ctx.fillStyle = `rgba(255, 255, 255, ${fade * 0.9})`;
    ctx.fillRect(Math.round(x - s * 2), Math.round(y - s * 2), s * 4, s * 4);
}

function drawStaminaBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    label: string,
    fill: number,
    segments: number,
    alignRight: boolean
): void {
    const h = 14;
    ctx.font = `bold 18px ${FONT_SC}`;
    ctx.textAlign = alignRight ? "right" : "left";
    ctx.fillStyle = "#e8e0d5";
    ctx.fillText(label, alignRight ? x + w : x, y - 8);
    ctx.fillStyle = "#1a1510";
    ctx.fillRect(x, y, w, h);
    const f = clamp01(fill);
    ctx.fillStyle = f < 0.3 ? "#8a2828" : f < 0.6 ? "#c85020" : "#48a058";
    const fw = (w - 4) * f;
    ctx.fillRect(alignRight ? x + w - 2 - fw : x + 2, y + 2, fw, h - 4);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    for (let i = 1; i < segments; i++) ctx.fillRect(Math.round(x + (w * i) / segments), y + 2, 2, h - 4);
    ctx.strokeStyle = "#c4a574";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
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
    drawTunnel(ctx, cx, groundY, s, time);

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
    } else if (fight.ducked && fight.phase === "open" && since < 0.4) {
        // Slipped under the swing: low lunge into the counter
        playerPose = "fight_punch";
        pdy = 2 * s;
        pdx = 3 * s;
        ptilt = 0.12;
    } else if (fight.sincePunch < 0.18) {
        playerPose = "fight_punch";
        pdx = 2 * s;
    } else if (fight.stagger > 0) {
        playerPose = "idle";
        pdx = -s;
        ptilt = -0.05;
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
    } else if (fight.phase === "open") {
        // Overextended and winded: guard down, chest heaving
        yttePose = "idle";
        ydy = Math.round(Math.abs(Math.sin(time * 10))) * s;
        ytilt = -0.05;
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

    if (ev === "hit_ytte") drawImpact(ctx, ytteFeetX - 4 * s, groundY - h * 0.78, s, since);
    if (ev === "hit_player") drawImpact(ctx, playerFeetX + 4 * s, groundY - h * 0.78, s, since);
    ctx.restore();

    // --- HUD ---
    const barW = Math.min(280, Math.round(W * 0.32));
    drawStaminaBar(ctx, 32, 48, barW, "Detective", fight.playerStamina / fight.playerMaxStamina, fight.playerMaxStamina, false);
    drawStaminaBar(ctx, W - 32 - barW, 48, barW, "Chef Ytte", fight.ytteStamina / YTTE_STAMINA, YTTE_STAMINA, true);

    ctx.textAlign = "center";
    if (fight.result === "won") {
        ctx.font = `bold 40px ${FONT_SC}`;
        ctx.fillStyle = `rgba(232, 200, 96, ${clamp01(fight.outroTime / 0.4)})`;
        ctx.fillText("Knocked out!", cx, H * 0.2);
    } else if (fight.result === "ongoing") {
        ctx.font = `bold 30px ${FONT_SC}`;
        ctx.fillStyle = "#e8e0d5";
        ctx.fillText("Put 'em up!", cx, 56);
        ctx.font = `17px ${FONT}`;
        ctx.fillStyle = "rgba(240, 230, 216, 0.85)";
        const key = touchControls ? "Interact" : "E / Space";
        ctx.fillText(`${key}: punch when his guard drops — or duck his swing as the "!" flares`, cx, H - 24);
    }
    ctx.textAlign = "left";
}
