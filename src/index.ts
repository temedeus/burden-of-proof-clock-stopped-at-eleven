import { Loop } from "./engine/Loop";
import { Game } from "./engine/Game";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const game = new Game();
const loop = new Loop();
console.log("INDEX.TS LOADED");
loop.start((dt) => {
  game.update(dt);
  game.render(ctx);
});
