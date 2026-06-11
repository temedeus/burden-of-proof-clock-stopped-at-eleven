let touchDevice: boolean | null = null;

/** True on phones/tablets with coarse pointer or touch support. */
export function isTouchDevice(): boolean {
    if (touchDevice === null) {
        touchDevice =
            matchMedia("(hover: none) and (pointer: coarse)").matches ||
            navigator.maxTouchPoints > 0;
    }
    return touchDevice;
}

/** Enable touch UI on desktop via `?simulateMobile=true` or `?simulateMobile=1`. */
export function isSimulateMobile(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("simulateMobile") === "true" || urlParams.get("simulateMobile") === "1";
}

/** True when touch controls and mobile UI hints should be shown. */
export function shouldShowTouchControls(): boolean {
    return isTouchDevice() || isSimulateMobile();
}

/** Map a screen pointer position to canvas pixel coordinates. */
export function clientToCanvas(
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}
