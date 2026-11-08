import type { Room } from "../world/Room";

/** Schematic floor plan in abstract units (not tile-accurate). */
interface MapRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface MapFloor {
    id: string;
    label: string;
    rooms: Record<string, MapRect>;
}

/** Each floor is laid out on its own, in abstract units. */
export const MAP_FLOORS: readonly MapFloor[] = [
    {
        id: "upper",
        label: "Upper Floor",
        rooms: {
            master_bedroom: { x: 0, y: 0, w: 2.5, h: 3 },
            bathroom_master: { x: 2.5, y: 0, w: 1, h: 3 },
            guest_room_a: { x: 3.5, y: 0, w: 2, h: 3 },
            bathroom_a: { x: 5.5, y: 0, w: 1, h: 3 },
            guest_room_b: { x: 6.5, y: 0, w: 2, h: 3 },
            bathroom_b: { x: 8.5, y: 0, w: 1, h: 3 },
            maid_room: { x: 9.5, y: 0, w: 2, h: 3 },
            attic: { x: 11.5, y: 0, w: 3.5, h: 3 },
            landing_west: { x: 0, y: 3.2, w: 2.5, h: 1.2 },
            landing: { x: 2.5, y: 3.2, w: 6, h: 1.2 },
            landing_east: { x: 8.5, y: 3.2, w: 4, h: 1.2 }
        }
    },
    {
        id: "ground",
        label: "Ground Floor",
        rooms: {
            dancing_room: { x: 6, y: 0, w: 4, h: 1.8 },
            study: { x: 10, y: 0, w: 3, h: 1.8 },
            kitchen: { x: 0, y: 2, w: 3, h: 2.4 },
            dining: { x: 3, y: 2, w: 3, h: 2.4 },
            hall: { x: 6, y: 2, w: 4, h: 2.4 },
            library: { x: 10, y: 2, w: 3, h: 2.4 }
        }
    },
    {
        id: "grounds",
        label: "Grounds",
        rooms: {
            courtyard: { x: 0, y: 0, w: 4, h: 2.6 },
            stable: { x: 4, y: 0, w: 3, h: 2.6 },
            garden: { x: 7, y: 0, w: 5, h: 2.6 }
        }
    },
    {
        id: "cellar",
        label: "Cellar",
        rooms: {
            cellar_storage: { x: 0, y: 0, w: 4, h: 2.4 },
            wine_cellar: { x: 4, y: 0, w: 4, h: 2.4 },
            secret_tunnel: { x: 0, y: 2.6, w: 4, h: 1.8 },
            hidden_room: { x: 4, y: 2.6, w: 4, h: 1.8 }
        }
    }
];

/** Flat lookup of every mapped room's rect (within its own floor). */
export const MAP_LAYOUT: Record<string, MapRect> = Object.assign({}, ...MAP_FLOORS.map((f) => f.rooms));

export function floorIndexOf(roomId: string): number {
    const i = MAP_FLOORS.findIndex((f) => roomId in f.rooms);
    return i < 0 ? 0 : i;
}

const BG_DIM = "rgba(0, 0, 0, 0.86)";
const GOLD = "#ffd700";
const BODY_FONT = '"IM Fell English", "Libre Baskerville", serif';
const TITLE_FONT = '"IM Fell English SC", "IM Fell English", "Libre Baskerville", serif';

export interface MapEdge {
    a: string;
    b: string;
    secret: boolean;
}

/** Door connections between adjacent mapped rooms, derived from room exits. */
export function computeMapEdges(rooms: Record<string, Room>): MapEdge[] {
    const seen = new Map<string, MapEdge>();
    for (const room of Object.values(rooms)) {
        if (!MAP_LAYOUT[room.id]) continue;
        for (const exit of room.exits) {
            if (!MAP_LAYOUT[exit.targetRoom] || exit.interactionOnly) continue;
            if (floorIndexOf(exit.targetRoom) !== floorIndexOf(room.id)) continue;
            const [a, b] = [room.id, exit.targetRoom].sort();
            const key = `${a}|${b}`;
            const secret = !!exit.skipDoorSprite && !!exit.requiresUnlock;
            const prev = seen.get(key);
            seen.set(key, { a, b, secret: prev ? prev.secret && secret : secret });
        }
    }
    return [...seen.values()];
}

/** Segment between two rects, or null when they are not neighbours. */
export function edgeSegment(a: MapRect, b: MapRect): [number, number, number, number] | null {
    const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    const maxGap = 1.7;
    if (ox > 0.3) {
        const gap = a.y < b.y ? b.y - (a.y + a.h) : a.y - (b.y + b.h);
        if (gap >= -0.01 && gap <= maxGap) {
            const mx = (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2;
            const [top, bottom] = a.y < b.y ? [a, b] : [b, a];
            return [mx, top.y + top.h, mx, bottom.y];
        }
    }
    if (oy > 0.3) {
        const gap = a.x < b.x ? b.x - (a.x + a.w) : a.x - (b.x + b.w);
        if (gap >= -0.01 && gap <= maxGap) {
            const my = (Math.max(a.y, b.y) + Math.min(a.y + a.h, b.y + b.h)) / 2;
            const [left, right] = a.x < b.x ? [a, b] : [b, a];
            return [left.x + left.w, my, right.x, my];
        }
    }
    return null;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    let cur = "";
    for (const word of text.split(" ")) {
        const next = cur ? `${cur} ${word}` : word;
        if (!cur || ctx.measureText(next).width <= maxWidth) cur = next;
        else {
            lines.push(cur);
            cur = word;
        }
    }
    if (cur) lines.push(cur);
    return lines;
}

/** Draw `text` centered in the box, wrapping and shrinking so it is never clipped. */
function fitLabel(
    ctx: CanvasRenderingContext2D,
    text: string,
    cx: number,
    cy: number,
    maxW: number,
    maxH: number,
    color: string
): void {
    let size = 15;
    let lines: string[] = [];
    for (; size >= 8; size--) {
        ctx.font = `${size}px ${BODY_FONT}`;
        lines = wrap(ctx, text, maxW);
        const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
        if (widest <= maxW && lines.length * (size + 2) <= maxH) break;
    }
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lineH = size + 2;
    const top = cy - ((lines.length - 1) * lineH) / 2;
    lines.forEach((l, i) => ctx.fillText(l, cx, top + i * lineH));
    ctx.textBaseline = "alphabetic";
}

export class MapScreen {
    private floorIndex = 0;
    /** Floors with at least one visited room, in display order. */
    private floors: number[] = [0];
    private tabRects: { x: number; y: number; w: number; h: number }[] = [];

    /** Show the floor the player is on; only floors already entered get a tab. */
    open(currentRoomId: string, visited: ReadonlySet<string>): void {
        const current = floorIndexOf(currentRoomId);
        this.floors = MAP_FLOORS.map((_, i) => i).filter(
            (i) => i === current || Object.keys(MAP_FLOORS[i].rooms).some((id) => visited.has(id))
        );
        this.floorIndex = current;
    }

    private step(delta: number): void {
        const pos = Math.max(0, this.floors.indexOf(this.floorIndex));
        const n = this.floors.length;
        this.floorIndex = this.floors[(((pos + delta) % n) + n) % n];
    }

    /** Handle key input; mutates the selected floor. */
    handleKeys(pressed: (key: string) => boolean): void {
        if (pressed("arrowleft") || pressed("a") || pressed("arrowup") || pressed("w")) this.step(-1);
        if (pressed("arrowright") || pressed("d") || pressed("arrowdown") || pressed("s")) this.step(1);
        this.floors.forEach((floor, pos) => {
            if (pressed(String(pos + 1))) this.floorIndex = floor;
        });
    }

    /** Tabs switch floors; any other tap closes the map. */
    handlePointer(x: number, y: number): "close" | null {
        const hit = this.tabRects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
        if (hit >= 0) {
            this.floorIndex = this.floors[hit];
            return null;
        }
        return "close";
    }

    render(
        ctx: CanvasRenderingContext2D,
        rooms: Record<string, Room>,
        visited: ReadonlySet<string>,
        currentRoomId: string,
        titleOf: (roomId: string) => string,
        time: number
    ): void {
        const W = ctx.canvas.width;
        const H = ctx.canvas.height;
        ctx.fillStyle = BG_DIM;
        ctx.fillRect(0, 0, W, H);

        const floor = MAP_FLOORS[this.floorIndex];
        const layout = floor.rooms;
        const isShown = (id: string) => !!layout[id] && (visited.has(id) || id === currentRoomId);
        const currentFloor = floorIndexOf(currentRoomId);

        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = `bold 28px ${TITLE_FONT}`;
        ctx.fillStyle = "#000";
        ctx.fillText("Manor Map", W / 2 + 1, 43);
        ctx.fillStyle = "#f3ead2";
        ctx.fillText("Manor Map", W / 2, 42);

        // Floor tabs
        const tabH = 30;
        const tabGap = 8;
        const tabY = 58;
        ctx.font = `15px ${BODY_FONT}`;
        const tabs = this.floors.map((fi, pos) => ({ fi, label: `${pos + 1}  ${MAP_FLOORS[fi].label}` }));
        const widths = tabs.map((t) => ctx.measureText(t.label).width + 28);
        const totalW = widths.reduce((a, b) => a + b, 0) + tabGap * (tabs.length - 1);
        let tx = Math.round((W - totalW) / 2);
        this.tabRects = [];
        tabs.forEach((t, i) => {
            const rect = { x: tx, y: tabY, w: widths[i], h: tabH };
            this.tabRects.push(rect);
            const active = t.fi === this.floorIndex;
            ctx.fillStyle = "#0e0b09";
            ctx.fillRect(rect.x - 1, rect.y - 1, rect.w + 2, rect.h + 2);
            ctx.fillStyle = active ? "#5a4a2c" : "#26211d";
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            ctx.strokeStyle = active ? GOLD : "#5a4c3a";
            ctx.lineWidth = active ? 2 : 1;
            ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
            ctx.fillStyle = active ? "#f3ead2" : "#9a8d76";
            ctx.textAlign = "center";
            ctx.font = `15px ${BODY_FONT}`;
            ctx.fillText(t.label, rect.x + rect.w / 2, rect.y + 20);
            if (t.fi === currentFloor) {
                ctx.fillStyle = GOLD;
                ctx.beginPath();
                ctx.arc(rect.x + 10, rect.y + 8, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            tx += widths[i] + tabGap;
        });

        const ids = Object.keys(layout);
        const maxX = Math.max(...ids.map((id) => layout[id].x + layout[id].w));
        const maxY = Math.max(...ids.map((id) => layout[id].y + layout[id].h));
        const areaTop = tabY + tabH + 22;
        const areaBottom = H - 44;
        const scale = Math.floor(Math.min((W - 48) / maxX, (areaBottom - areaTop) / maxY, 70));
        const ox = Math.round((W - maxX * scale) / 2);
        const oy = Math.round(areaTop + (areaBottom - areaTop - maxY * scale) / 2);
        const px = (r: MapRect) => ({
            x: Math.round(ox + r.x * scale) + 2,
            y: Math.round(oy + r.y * scale) + 2,
            w: Math.round(r.w * scale) - 4,
            h: Math.round(r.h * scale) - 4
        });

        // Connections first so rooms sit on top of the line ends.
        for (const edge of computeMapEdges(rooms)) {
            if (!isShown(edge.a) || !isShown(edge.b)) continue;
            const seg = edgeSegment(layout[edge.a], layout[edge.b]);
            if (!seg) continue;
            ctx.strokeStyle = "#c9b98a";
            ctx.lineWidth = 4;
            ctx.setLineDash(edge.secret ? [5, 4] : []);
            ctx.beginPath();
            ctx.moveTo(ox + seg[0] * scale, oy + seg[1] * scale);
            ctx.lineTo(ox + seg[2] * scale, oy + seg[3] * scale);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        for (const id of ids) {
            if (!isShown(id)) continue;
            const r = px(layout[id]);
            const seen = visited.has(id) || id === currentRoomId;
            const current = id === currentRoomId;

            ctx.fillStyle = "#0e0b09";
            ctx.fillRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
            ctx.fillStyle = current ? "#5a4a2c" : seen ? "#3b3128" : "#201b17";
            ctx.fillRect(r.x, r.y, r.w, r.h);
            if (seen) {
                ctx.fillStyle = "rgba(255,240,200,0.08)";
                ctx.fillRect(r.x, r.y, r.w, 2);
            }
            ctx.strokeStyle = current ? GOLD : seen ? "#8a7a5a" : "#3a3229";
            ctx.lineWidth = current ? 3 : 1;
            ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

            const label = seen ? titleOf(id) : "?";
            fitLabel(ctx, label, r.x + r.w / 2, r.y + r.h / 2, r.w - 10, r.h - 8, seen ? "#f3ead2" : "#6a5f50");

            if (current) {
                const pulse = 3 + Math.sin(time * 4) * 1.2;
                ctx.fillStyle = GOLD;
                ctx.beginPath();
                ctx.arc(r.x + 9, r.y + 9, pulse, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.textAlign = "center";
        ctx.font = `14px ${BODY_FONT}`;
        ctx.fillStyle = "#8a7d66";
        const hint = (this.floors.length > 1 ? "←/→ or 1–" + this.floors.length + " to change floor · " : "") + "Gold marks your position · M or Esc to close";
        let size = 14;
        for (; size > 9; size--) {
            ctx.font = `${size}px ${BODY_FONT}`;
            if (ctx.measureText(hint).width <= W - 32) break;
        }
        ctx.fillText(hint, W / 2, H - 18);
        ctx.textAlign = "left";
    }
}
