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
