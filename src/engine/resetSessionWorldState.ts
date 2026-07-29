import { resetAtticWindows } from "../world/atticWindows";
import { huntTension } from "../audio/HuntTension";

/**
 * Clear module-level play-session state that outlives a `Game` instance.
 * Call when starting a New Game (and from `Game` construction) so a prior
 * run cannot leak visuals like broken attic windows.
 */
export function resetSessionWorldState(): void {
    resetAtticWindows();
    huntTension.stop();
}
