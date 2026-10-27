import { DIALOG_LINES_PER_PAGE, paginateDialog } from "../render/GameHud";
import { SPEECH_BUBBLE_TEXT_WIDTH } from "../render/speechBubble";
import { splitDialogSpeakers, type DialogSegment } from "../systems/dialogSpeakers";

export interface PendingConfirmation {
    id: string;
    prompt: string;
    /** Clue granted on "yes" when no puzzle handles `id` (story chests, cabinets). */
    grantsClueId?: string;
}

/**
 * Paged dialog + yes/no confirm prompt state for the play screen.
 * Also queues work to run once the player closes the current dialog
 * (e.g. start the moose lick after its examine text).
 */
export class DialogController {
    /** Text of the current page, or null when no dialog is showing. */
    page: string | null = null;
    pageIndex = 0;
    private pages: string[] = [];
    /** Who says each page (parallel to `pages`); speakers get a bubble, narration the box. */
    private speakers: DialogSegment[] = [];
    private closeCallbacks: (() => void)[] = [];

    confirmation: PendingConfirmation | null = null;
    confirmPageIndex = 0;
    private confirmPages: string[] = [];

    constructor(private ctx: CanvasRenderingContext2D) {}

    get pageCount(): number {
        return this.pages.length;
    }

    get hasMorePages(): boolean {
        return this.pageIndex < this.pages.length - 1;
    }

    /** Speaker segment of the current page. */
    get segment(): DialogSegment | undefined {
        return this.speakers[this.pageIndex];
    }

    /** Paginate dialog per speaker: spoken lines wrap to bubble width, narration to the message box. */
    setPages(text: string, resolveNpc: (name: string) => string | null): void {
        this.pages = [];
        this.speakers = [];
        for (const segment of splitDialogSpeakers(text, resolveNpc)) {
            const pages = segment.speakerId
                ? paginateDialog(this.ctx, segment.text, DIALOG_LINES_PER_PAGE, SPEECH_BUBBLE_TEXT_WIDTH)
                : paginateDialog(this.ctx, segment.text);
            for (const page of pages) {
                this.pages.push(page);
                this.speakers.push(segment);
            }
        }
        if (this.pages.length === 0) {
            this.pages = [text];
            this.speakers = [{ speakerId: null, speakerName: null, text }];
        }
        this.pageIndex = 0;
        this.page = this.pages[0];
    }

    /** Turn to the next page; false when already on the last one. */
    nextPage(): boolean {
        if (!this.hasMorePages) return false;
        this.pageIndex += 1;
        this.page = this.pages[this.pageIndex];
        return true;
    }

    clear(): void {
        this.page = null;
        this.pages = [];
        this.speakers = [];
        this.pageIndex = 0;
    }

    /** Run `callback` the next time the player closes a dialog. */
    whenClosed(callback: () => void): void {
        this.closeCallbacks.push(callback);
    }

    /** Run (and drop) everything queued with `whenClosed`, in order. */
    runCloseCallbacks(): void {
        const callbacks = this.closeCallbacks;
        this.closeCallbacks = [];
        for (const callback of callbacks) callback();
    }

    openConfirm(confirmation: PendingConfirmation, hint: string): void {
        this.confirmation = confirmation;
        this.confirmPages = paginateDialog(this.ctx, `${confirmation.prompt}\n\n${hint}`);
        this.confirmPageIndex = 0;
    }

    /** Current confirm prompt page, or null when no prompt is open. */
    get confirmPage(): string | null {
        return this.confirmation ? this.confirmPages[this.confirmPageIndex] ?? null : null;
    }

    get confirmPageCount(): number {
        return this.confirmPages.length;
    }

    /** Turn the prompt page; true once past the last page (call `takeConfirmation` next). */
    advanceConfirm(): boolean {
        if (this.confirmPageIndex < this.confirmPages.length - 1) {
            this.confirmPageIndex += 1;
            return false;
        }
        this.confirmPages = [];
        this.confirmPageIndex = 0;
        return true;
    }

    /** Hand over the accepted confirmation and clear it. */
    takeConfirmation(): PendingConfirmation | null {
        const confirmation = this.confirmation;
        this.confirmation = null;
        return confirmation;
    }

    cancelConfirm(): void {
        this.confirmation = null;
        this.confirmPages = [];
        this.confirmPageIndex = 0;
    }
}
