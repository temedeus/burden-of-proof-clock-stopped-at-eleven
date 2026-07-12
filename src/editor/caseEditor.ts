import type { ClueAssignment, FurnitureConfig, GeneratedClue, RoomConfig, StoryCasePacket } from "@cse/content-schema";
import { ACTIVE_STORY_ID, MIN_STORY_CLUE_COUNT, validateStoryCasePacket } from "@cse/content-schema";
import activeStoryFallback from "../data/story/generated/stories/active.json";

export interface CaseEditorDeps {
    backendBase: string;
    workingRooms: Record<string, RoomConfig>;
    npcIds: string[];
    clueCatalogIds: string[];
    furnitureById: Record<string, FurnitureConfig>;
    reportIssue: (message: string) => void;
    onSelectionBadgeExtra: (extra: string) => void;
}

interface FurnitureOption {
    furnitureId: string;
    furnitureIndex: number;
    label: string;
}

function furnitureOptionsForRoom(room: RoomConfig | undefined): FurnitureOption[] {
    if (!room) return [];
    const counts = new Map<string, number>();
    const options: FurnitureOption[] = [];
    for (const placement of room.furniture ?? []) {
        const furnitureIndex = counts.get(placement.furnitureId) ?? 0;
        counts.set(placement.furnitureId, furnitureIndex + 1);
        const suffix = furnitureIndex > 0 ? ` #${furnitureIndex}` : "";
        options.push({
            furnitureId: placement.furnitureId,
            furnitureIndex,
            label: `${placement.furnitureId}${suffix}`
        });
    }
    return options;
}

function encodeFurnitureValue(furnitureId: string, furnitureIndex: number): string {
    return `${furnitureId}|${furnitureIndex}`;
}

function decodeFurnitureValue(value: string): { furnitureId: string; furnitureIndex: number } | null {
    if (!value) return null;
    const [furnitureId, indexPart] = value.split("|");
    if (!furnitureId) return null;
    const furnitureIndex = Number(indexPart);
    if (!Number.isFinite(furnitureIndex) || furnitureIndex < 0) return null;
    return { furnitureId, furnitureIndex };
}

function npcOptionsForRoom(room: RoomConfig | undefined): { npcId: string; label: string }[] {
    if (!room) return [];
    return (room.npcs ?? []).map((placement) => ({
        npcId: placement.npcId,
        label: placement.npcId
    }));
}

export function parseRequiresCluesInput(raw: string): string[] | undefined {
    const ids = raw
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    return ids.length > 0 ? ids : undefined;
}

export function formatRequiresCluesInput(ids?: string[]): string {
    return ids?.join(", ") ?? "";
}

function uniqueClueId(base: string, existing: Set<string>): string {
    let id = base.replace(/[^a-z0-9_]/gi, "_").toLowerCase() || "clue";
    let candidate = id;
    let n = 2;
    while (existing.has(candidate)) {
        candidate = `${id}_${n}`;
        n++;
    }
    return candidate;
}

export class CaseEditor {
    private workingCase: StoryCasePacket | null = null;
    private caseDirty = false;
    private formBuilt = false;
    private selectedClueIndex = 0;

    private readonly storyStatusEl: HTMLParagraphElement;
    private readonly caseTitleInput: HTMLInputElement;
    private readonly caseCulpritSelect: HTMLSelectElement;
    private readonly clueSelect: HTMLSelectElement;
    private readonly clueEditorRoot: HTMLDivElement;
    private readonly playCaseLink: HTMLAnchorElement;
    private readonly caseDirtyStatus: HTMLParagraphElement;

    private roomSelect!: HTMLSelectElement;
    private furnitureSelect!: HTMLSelectElement;
    private npcSelect!: HTMLSelectElement;
    private sourceSelect!: HTMLSelectElement;
    private readonly clueChainPreview: HTMLPreElement;

    constructor(
        private readonly deps: CaseEditorDeps,
        root: ParentNode
    ) {
        this.storyStatusEl = root.querySelector("#story-status") as HTMLParagraphElement;
        this.caseTitleInput = root.querySelector("#case-title") as HTMLInputElement;
        this.caseCulpritSelect = root.querySelector("#case-culprit") as HTMLSelectElement;
        this.clueSelect = root.querySelector("#clue-select") as HTMLSelectElement;
        this.clueEditorRoot = root.querySelector("#clue-editor") as HTMLDivElement;
        this.playCaseLink = root.querySelector("#play-case-link") as HTMLAnchorElement;
        this.caseDirtyStatus = root.querySelector("#case-dirty-status") as HTMLParagraphElement;
        this.clueChainPreview = root.querySelector("#clue-chain-preview") as HTMLPreElement;

        root.querySelector("#validate-case-btn")?.addEventListener("click", () => this.validateCase());
        root.querySelector("#save-case-btn")?.addEventListener("click", () => void this.saveCase());
        root.querySelector("#add-clue-btn")?.addEventListener("click", () => this.addClue());
        root.querySelector("#remove-clue-btn")?.addEventListener("click", () => this.removeClue());

        this.clueSelect.addEventListener("change", () => {
            this.syncCurrentClueFromForm();
            this.selectedClueIndex = this.clueSelect.selectedIndex;
            this.loadCurrentClueIntoForm();
        });

        this.caseTitleInput.addEventListener("input", () => {
            if (!this.workingCase) return;
            this.workingCase.title = this.caseTitleInput.value;
            this.updateStoryStatus();
            this.markCaseDirty();
        });
        this.caseCulpritSelect.addEventListener("change", () => {
            if (!this.workingCase) return;
            this.workingCase.culpritNpcId = this.caseCulpritSelect.value;
            this.markCaseDirty();
        });

        this.refreshCulpritOptions();
    }

    getActiveCaseId(): string {
        return ACTIVE_STORY_ID;
    }

    isCaseDirty(): boolean {
        return this.caseDirty;
    }

    async bootstrap(): Promise<void> {
        await this.loadStory();
    }

    onRoomsUpdated(): void {
        if (!this.formBuilt) return;
        this.refreshRoomSelect();
        this.refreshFurnitureSelect();
    }

    onFurnitureSelected(roomId: string, listIndex: number | null): void {
        if (listIndex == null || !this.workingCase) {
            this.deps.onSelectionBadgeExtra("");
            return;
        }
        const room = this.deps.workingRooms[roomId];
        const placement = room?.furniture[listIndex];
        if (!placement || !room) return;

        const furnitureIndex = CaseEditor.furnitureInstanceIndex(room, listIndex);
        const furnitureClueId = (this.workingCase.clueAssignments ?? []).find(
            (a) =>
                a.roomId === roomId &&
                a.furnitureId === placement.furnitureId &&
                (a.furnitureIndex ?? 0) === furnitureIndex
        )?.clueId;

        const clueId = furnitureClueId;

        const clueName =
            clueId &&
            (this.workingCase.generatedClues ?? []).find((c) => c.id === clueId)?.name;
        this.deps.onSelectionBadgeExtra(
            clueName
                ? ` · has clue: ${clueName}`
                : ` · ${placement.furnitureId} (no clue here)`
        );
    }

    static furnitureInstanceIndex(room: RoomConfig, listIndex: number): number {
        const placement = room.furniture[listIndex];
        if (!placement) return 0;
        let count = 0;
        for (let i = 0; i < listIndex; i++) {
            if (room.furniture[i].furnitureId === placement.furnitureId) count++;
        }
        return count;
    }

    private ensureClueForm(): void {
        if (this.formBuilt || !this.clueEditorRoot) return;

        const roomIds = Object.keys(this.deps.workingRooms).sort();
        const roomOptions = roomIds.length
            ? roomIds.map((id) => `<option value="${id}">${id}</option>`).join("")
            : '<option value="">— no rooms —</option>';

        this.clueEditorRoot.innerHTML = `
            <label>Id</label>
            <input type="text" id="clue-field-id" />
            <label>Name (inventory)</label>
            <input type="text" id="clue-field-name" />
            <label>Description</label>
            <textarea id="clue-field-description"></textarea>
            <label>Requires clues (comma-separated ids)</label>
            <input type="text" id="clue-field-requires-clues" placeholder="e.g. examined_body, examined_clock" />
            <label>Blocked hint (when prerequisites missing)</label>
            <textarea id="clue-field-blocked-hint" placeholder="Shown instead of examine hint until requirements are met"></textarea>
            <label class="checkbox-row"><input type="checkbox" id="clue-field-hide-inventory" /> Hide from inventory panel</label>
            <label>Room</label>
            <select id="clue-field-room">${roomOptions}</select>
            <label>Assignment source</label>
            <select id="clue-field-source">
              <option value="furniture">Furniture examine</option>
              <option value="npc">NPC examine</option>
              <option value="confirm">Confirm puzzle (furniture)</option>
            </select>
            <label id="clue-field-furniture-label">Furniture in room</label>
            <select id="clue-field-furniture"></select>
            <label id="clue-field-npc-label">NPC in room</label>
            <select id="clue-field-npc"></select>
            <label>Examine hint</label>
            <textarea id="clue-field-hint" placeholder="Shown when examining this object (or after confirm)"></textarea>
        `;

        this.roomSelect = this.clueEditorRoot.querySelector("#clue-field-room") as HTMLSelectElement;
        this.furnitureSelect = this.clueEditorRoot.querySelector("#clue-field-furniture") as HTMLSelectElement;
        this.npcSelect = this.clueEditorRoot.querySelector("#clue-field-npc") as HTMLSelectElement;
        this.sourceSelect = this.clueEditorRoot.querySelector("#clue-field-source") as HTMLSelectElement;

        this.roomSelect.addEventListener("change", () => {
            this.refreshFurnitureSelect();
            this.refreshNpcSelect();
            this.syncCurrentClueFromForm();
        });
        this.sourceSelect.addEventListener("change", () => {
            this.refreshAssignmentSourceUi();
            this.syncCurrentClueFromForm();
        });

        for (const id of [
            "clue-field-id",
            "clue-field-name",
            "clue-field-description",
            "clue-field-requires-clues",
            "clue-field-blocked-hint",
            "clue-field-hint"
        ]) {
            const el = this.clueEditorRoot.querySelector(`#${id}`);
            el?.addEventListener("input", () => this.syncCurrentClueFromForm());
        }
        const hideInventoryEl = this.clueEditorRoot.querySelector("#clue-field-hide-inventory");
        hideInventoryEl?.addEventListener("change", () => this.syncCurrentClueFromForm());
        this.furnitureSelect.addEventListener("change", () => this.syncCurrentClueFromForm());
        this.npcSelect.addEventListener("change", () => this.syncCurrentClueFromForm());

        this.refreshAssignmentSourceUi();

        this.formBuilt = true;
    }

    private getClues(): GeneratedClue[] {
        return this.workingCase?.generatedClues ?? [];
    }

    private ensureWorkingClueArrays(): void {
        if (!this.workingCase) return;
        if (!this.workingCase.generatedClues) this.workingCase.generatedClues = [];
        if (!this.workingCase.clueAssignments) this.workingCase.clueAssignments = [];
    }

    private refreshClueSelect(): void {
        const clues = this.getClues();
        const prevIndex = this.selectedClueIndex;
        this.clueSelect.innerHTML = "";
        for (let i = 0; i < clues.length; i++) {
            const clue = clues[i];
            const option = document.createElement("option");
            option.value = String(i);
            option.textContent = `${i + 1}. ${clue.name || clue.id || "Unnamed"}`;
            this.clueSelect.appendChild(option);
        }
        if (clues.length === 0) {
            const option = document.createElement("option");
            option.textContent = "— no clues —";
            this.clueSelect.appendChild(option);
            return;
        }
        this.selectedClueIndex = Math.min(prevIndex, clues.length - 1);
        this.clueSelect.selectedIndex = this.selectedClueIndex;
        this.refreshDependencyPreview();
    }

    private refreshRoomSelect(): void {
        if (!this.formBuilt) return;
        const roomIds = Object.keys(this.deps.workingRooms).sort();
        const prev = this.roomSelect.value;
        this.roomSelect.innerHTML =
            roomIds.length === 0
                ? '<option value="">— no rooms —</option>'
                : roomIds.map((id) => `<option value="${id}">${id}</option>`).join("");
        if (prev && roomIds.includes(prev)) this.roomSelect.value = prev;
        else if (roomIds[0]) this.roomSelect.value = roomIds[0];
        this.refreshFurnitureSelect();
        this.refreshNpcSelect();
    }

    private refreshNpcSelect(): void {
        if (!this.formBuilt) return;
        const roomId = this.roomSelect.value;
        const room = this.deps.workingRooms[roomId];
        const options = npcOptionsForRoom(room);
        const prev = this.npcSelect.value;

        if (options.length === 0) {
            this.npcSelect.innerHTML = '<option value="">— no NPCs in room —</option>';
            return;
        }

        this.npcSelect.innerHTML = options
            .map((o) => `<option value="${o.npcId}">${o.label}</option>`)
            .join("");

        if (prev && [...this.npcSelect.options].some((o) => o.value === prev)) {
            this.npcSelect.value = prev;
        } else {
            this.npcSelect.value = options[0].npcId;
        }
    }

    private refreshAssignmentSourceUi(): void {
        if (!this.formBuilt) return;
        const source = this.sourceSelect.value;
        const furnitureLabel = this.clueEditorRoot.querySelector("#clue-field-furniture-label") as HTMLLabelElement;
        const npcLabel = this.clueEditorRoot.querySelector("#clue-field-npc-label") as HTMLLabelElement;
        const showFurniture = source === "furniture" || source === "confirm";
        furnitureLabel.style.display = showFurniture ? "block" : "none";
        this.furnitureSelect.style.display = showFurniture ? "block" : "none";
        npcLabel.style.display = source === "npc" ? "block" : "none";
        this.npcSelect.style.display = source === "npc" ? "block" : "none";
    }

    private refreshDependencyPreview(): void {
        if (!this.clueChainPreview) return;
        const clues = this.getClues();
        if (clues.length === 0) {
            this.clueChainPreview.textContent = "—";
            return;
        }
        this.clueChainPreview.textContent = clues
            .map((clue, index) => {
                const reqs =
                    clue.requiresClues && clue.requiresClues.length > 0
                        ? clue.requiresClues.join(" + ")
                        : "(start)";
                return `${index + 1}. ${clue.name || clue.id}  ←  ${reqs}`;
            })
            .join("\n");
    }

    private refreshFurnitureSelect(): void {
        if (!this.formBuilt) return;
        const roomId = this.roomSelect.value;
        const room = this.deps.workingRooms[roomId];
        const options = furnitureOptionsForRoom(room);
        const prev = this.furnitureSelect.value;

        if (options.length === 0) {
            this.furnitureSelect.innerHTML = '<option value="">— no furniture —</option>';
            return;
        }

        this.furnitureSelect.innerHTML = options
            .map(
                (o) =>
                    `<option value="${encodeFurnitureValue(o.furnitureId, o.furnitureIndex)}">${o.label}</option>`
            )
            .join("");

        if (prev && [...this.furnitureSelect.options].some((o) => o.value === prev)) {
            this.furnitureSelect.value = prev;
        } else {
            this.furnitureSelect.value = encodeFurnitureValue(options[0].furnitureId, options[0].furnitureIndex);
        }
    }

    private loadCurrentClueIntoForm(): void {
        if (!this.workingCase || !this.formBuilt) return;
        const clues = this.getClues();
        const clue = clues[this.selectedClueIndex];
        const assignment =
            (this.workingCase.clueAssignments ?? []).find((a) => a.clueId === clue?.id) ??
            this.workingCase.clueAssignments?.[this.selectedClueIndex];

        const idEl = this.clueEditorRoot.querySelector("#clue-field-id") as HTMLInputElement;
        const nameEl = this.clueEditorRoot.querySelector("#clue-field-name") as HTMLInputElement;
        const descEl = this.clueEditorRoot.querySelector("#clue-field-description") as HTMLTextAreaElement;
        const requiresEl = this.clueEditorRoot.querySelector("#clue-field-requires-clues") as HTMLInputElement;
        const blockedEl = this.clueEditorRoot.querySelector("#clue-field-blocked-hint") as HTMLTextAreaElement;
        const hideEl = this.clueEditorRoot.querySelector("#clue-field-hide-inventory") as HTMLInputElement;
        const hintEl = this.clueEditorRoot.querySelector("#clue-field-hint") as HTMLTextAreaElement;

        idEl.value = clue?.id ?? "";
        nameEl.value = clue?.name ?? "";
        descEl.value = clue?.description ?? "";
        requiresEl.value = formatRequiresCluesInput(clue?.requiresClues);
        blockedEl.value = clue?.blockedHint ?? assignment?.blockedHint ?? "";
        hideEl.checked = clue?.hideFromInventory ?? false;
        hintEl.value = assignment?.hint ?? "";

        if (assignment?.roomId && [...this.roomSelect.options].some((o) => o.value === assignment.roomId)) {
            this.roomSelect.value = assignment.roomId;
        }
        this.refreshFurnitureSelect();
        this.refreshNpcSelect();

        if (assignment?.npcId) {
            this.sourceSelect.value = "npc";
            if ([...this.npcSelect.options].some((o) => o.value === assignment.npcId)) {
                this.npcSelect.value = assignment.npcId!;
            }
        } else if (assignment?.furnitureId) {
            const value = encodeFurnitureValue(assignment.furnitureId, assignment.furnitureIndex ?? 0);
            if ([...this.furnitureSelect.options].some((o) => o.value === value)) {
                this.furnitureSelect.value = value;
            }
            this.sourceSelect.value =
                this.deps.furnitureById[assignment.furnitureId]?.interactionType === "confirm"
                    ? "confirm"
                    : "furniture";
        } else {
            this.sourceSelect.value = "furniture";
        }

        this.refreshAssignmentSourceUi();
        this.refreshDependencyPreview();
    }

    private syncCurrentClueFromForm(): void {
        if (!this.workingCase || !this.formBuilt) return;
        this.ensureWorkingClueArrays();

        const clues = this.workingCase.generatedClues;
        const assignments = this.workingCase.clueAssignments;
        if (this.selectedClueIndex < 0 || this.selectedClueIndex >= clues.length) return;

        const idEl = this.clueEditorRoot.querySelector("#clue-field-id") as HTMLInputElement;
        const nameEl = this.clueEditorRoot.querySelector("#clue-field-name") as HTMLInputElement;
        const descEl = this.clueEditorRoot.querySelector("#clue-field-description") as HTMLTextAreaElement;
        const requiresEl = this.clueEditorRoot.querySelector("#clue-field-requires-clues") as HTMLInputElement;
        const blockedEl = this.clueEditorRoot.querySelector("#clue-field-blocked-hint") as HTMLTextAreaElement;
        const hideEl = this.clueEditorRoot.querySelector("#clue-field-hide-inventory") as HTMLInputElement;
        const hintEl = this.clueEditorRoot.querySelector("#clue-field-hint") as HTMLTextAreaElement;

        const existingIds = new Set(clues.map((c, i) => (i === this.selectedClueIndex ? "" : c.id)).filter(Boolean));
        const rawId = idEl.value.trim();
        const id = rawId
            ? uniqueClueId(rawId, existingIds)
            : uniqueClueId(`clue_${this.selectedClueIndex + 1}`, existingIds);

        const clue: GeneratedClue = {
            id,
            name: nameEl.value.trim() || `Clue ${this.selectedClueIndex + 1}`,
            description: descEl.value.trim() || "Something seems out of place.",
            requiresClues: parseRequiresCluesInput(requiresEl.value),
            blockedHint: blockedEl.value.trim() || undefined,
            hideFromInventory: hideEl.checked ? true : undefined
        };
        clues[this.selectedClueIndex] = clue;

        const roomId = this.roomSelect.value || Object.keys(this.deps.workingRooms)[0] || "hall";
        const hint = hintEl.value.trim() || "Something here relates to the case…";
        const source = this.sourceSelect.value;

        let assignment: ClueAssignment;
        if (source === "npc") {
            assignment = {
                clueId: clue.id,
                roomId,
                npcId: this.npcSelect.value,
                hint,
                blockedHint: clue.blockedHint
            };
        } else {
            const furniture = decodeFurnitureValue(this.furnitureSelect.value);
            assignment = {
                clueId: clue.id,
                roomId,
                furnitureId: furniture?.furnitureId,
                furnitureIndex: furniture?.furnitureIndex ?? 0,
                hint,
                blockedHint: clue.blockedHint
            };
        }
        assignments[this.selectedClueIndex] = assignment;

        const option = this.clueSelect.options[this.selectedClueIndex];
        if (option) {
            option.textContent = `${this.selectedClueIndex + 1}. ${clue.name || clue.id}`;
        }
        this.refreshDependencyPreview();
        this.markCaseDirty();
    }

    private syncAllCluesFromForm(): void {
        this.syncCurrentClueFromForm();
    }

    private addClue(): void {
        if (!this.workingCase) {
            this.deps.reportIssue("Story not loaded.");
            return;
        }
        this.syncCurrentClueFromForm();
        this.ensureWorkingClueArrays();

        const existingIds = new Set(this.workingCase.generatedClues.map((c) => c.id));
        const n = this.workingCase.generatedClues.length + 1;
        const id = uniqueClueId(`clue_${n}`, existingIds);
        const defaultRoomId = Object.keys(this.deps.workingRooms)[0] ?? "hall";
        const room = this.deps.workingRooms[defaultRoomId];
        const firstFurniture = furnitureOptionsForRoom(room)[0];

        this.workingCase.generatedClues.push({
            id,
            name: `Clue ${n}`,
            description: "Describe what the player discovers."
        });
        this.workingCase.clueAssignments.push({
            clueId: id,
            roomId: defaultRoomId,
            furnitureId: firstFurniture?.furnitureId,
            furnitureIndex: firstFurniture?.furnitureIndex ?? 0,
            hint: "Something here relates to the case…"
        });

        this.selectedClueIndex = this.workingCase.generatedClues.length - 1;
        this.refreshClueSelect();
        this.loadCurrentClueIntoForm();
        this.markCaseDirty();
        this.deps.reportIssue(`Added clue '${id}'.`);
    }

    private removeClue(): void {
        if (!this.workingCase) return;
        this.syncCurrentClueFromForm();

        if (this.workingCase.generatedClues.length <= MIN_STORY_CLUE_COUNT) {
            this.deps.reportIssue(`Keep at least ${MIN_STORY_CLUE_COUNT} clue.`);
            return;
        }

        const removed = this.workingCase.generatedClues[this.selectedClueIndex]?.id;
        this.workingCase.generatedClues.splice(this.selectedClueIndex, 1);
        this.workingCase.clueAssignments.splice(this.selectedClueIndex, 1);
        this.selectedClueIndex = Math.min(this.selectedClueIndex, this.workingCase.generatedClues.length - 1);

        this.refreshClueSelect();
        this.loadCurrentClueIntoForm();
        this.markCaseDirty();
        this.deps.reportIssue(`Removed clue '${removed}'.`);
    }

    private refreshCulpritOptions(): void {
        const selected = this.caseCulpritSelect.value;
        this.caseCulpritSelect.innerHTML = "";
        for (const npcId of this.deps.npcIds.filter((id) => !id.startsWith("police"))) {
            const option = document.createElement("option");
            option.value = npcId;
            option.textContent = npcId;
            this.caseCulpritSelect.appendChild(option);
        }
        if (selected && [...this.caseCulpritSelect.options].some((o) => o.value === selected)) {
            this.caseCulpritSelect.value = selected;
        }
    }

    private setCaseDirtyStatus(): void {
        this.caseDirtyStatus.textContent = this.caseDirty ? "Story: unsaved changes" : "Story: saved";
    }

    private markCaseDirty(): void {
        this.caseDirty = true;
        this.setCaseDirtyStatus();
    }

    private clearCaseDirty(): void {
        this.caseDirty = false;
        this.setCaseDirtyStatus();
    }

    private updateStoryStatus(): void {
        const title = this.workingCase?.title?.trim() || "Untitled";
        const count = this.getClues().length;
        this.storyStatusEl.textContent = `Editing: ${title} (${count} clue${count === 1 ? "" : "s"})`;
    }

    private updatePlayLink(): void {
        this.playCaseLink.href = `http://localhost:5173/?story=${ACTIVE_STORY_ID}`;
        this.playCaseLink.textContent = `Play “${this.workingCase?.title ?? "story"}” in game`;
    }

    private storyContext(packet: StoryCasePacket | null = null) {
        const clueIds = [...this.deps.clueCatalogIds];
        if (packet?.generatedClues) {
            for (const clue of packet.generatedClues) {
                if (clue.id) clueIds.push(clue.id);
            }
        }
        return {
            roomIds: Object.keys(this.deps.workingRooms),
            npcIds: this.deps.npcIds,
            clueIds,
            rooms: this.deps.workingRooms
        };
    }

    private fillFormFromCase(packet: StoryCasePacket): void {
        this.workingCase = packet;
        this.ensureClueForm();
        this.refreshRoomSelect();

        this.caseTitleInput.value = packet.title ?? "";
        this.caseCulpritSelect.value = packet.culpritNpcId ?? "";

        if ((packet.generatedClues ?? []).length === 0) {
            this.workingCase.generatedClues = [
                { id: "clue_1", name: "Clue 1", description: "Something seems out of place." }
            ];
            this.workingCase.clueAssignments = [
                {
                    clueId: "clue_1",
                    roomId: Object.keys(this.deps.workingRooms)[0] ?? "hall",
                    furnitureId: "table",
                    furnitureIndex: 0,
                    hint: "Something here relates to the case…"
                }
            ];
        }

        this.selectedClueIndex = 0;
        this.refreshClueSelect();
        this.loadCurrentClueIntoForm();
        this.updateStoryStatus();
    }

    validateCase(): boolean {
        if (!this.workingCase) {
            this.deps.reportIssue("Story not loaded — start the editor backend (pnpm dev:editor:backend).");
            return false;
        }
        this.syncAllCluesFromForm();
        const issues = validateStoryCasePacket(
            ACTIVE_STORY_ID,
            this.workingCase,
            this.storyContext(this.workingCase)
        );
        if (issues.length === 0) {
            this.deps.reportIssue(`Story is valid (${this.getClues().length} clues).`);
            return true;
        }
        this.deps.reportIssue(issues.map((issue) => `[${issue.roomId}] ${issue.message}`).join("\n"));
        return false;
    }

    private async fetchStoryFromBackend(): Promise<StoryCasePacket> {
        const storyRes = await fetch(`${this.deps.backendBase}/api/story`);
        if (storyRes.ok) {
            const payload = (await storyRes.json()) as { packet: StoryCasePacket };
            if (payload.packet) return payload.packet;
        }

        const legacyRes = await fetch(`${this.deps.backendBase}/api/cases/${ACTIVE_STORY_ID}`);
        if (legacyRes.ok) {
            const payload = (await legacyRes.json()) as { packet: StoryCasePacket };
            if (payload.packet) return payload.packet;
        }

        const status = storyRes.status === 404 ? " (backend may need restart: pnpm dev:editor:backend)" : "";
        throw new Error(`Story API failed: /api/story ${storyRes.status}, /api/cases/${ACTIVE_STORY_ID} ${legacyRes.status}${status}`);
    }

    async loadStory(): Promise<void> {
        try {
            const packet = await this.fetchStoryFromBackend();
            this.fillFormFromCase(packet);
            this.clearCaseDirty();
            this.updatePlayLink();
        } catch (error) {
            try {
                const packet = activeStoryFallback as StoryCasePacket;
                this.ensureClueForm();
                this.fillFormFromCase(packet);
                this.markCaseDirty();
                this.updatePlayLink();
                const detail = error instanceof Error ? error.message : String(error);
                this.deps.reportIssue(
                    `Loaded story from active.json (read-only until backend works).\n${detail}\n\nRun: pnpm dev:editor:backend`
                );
            } catch {
                this.ensureClueForm();
                this.refreshRoomSelect();
                this.deps.reportIssue(
                    error instanceof Error
                        ? error.message
                        : "Could not load story. Run: pnpm dev:editor:backend"
                );
                this.storyStatusEl.textContent = "Story not loaded";
            }
        }
    }

    async saveCase(): Promise<void> {
        if (!this.workingCase) {
            this.deps.reportIssue("Story not loaded.");
            return;
        }
        this.syncAllCluesFromForm();
        this.workingCase.title = this.caseTitleInput.value.trim() || "Untitled";
        this.workingCase.culpritNpcId = this.caseCulpritSelect.value;
        try {
            const body = JSON.stringify({ packet: this.workingCase });
            let response = await fetch(`${this.deps.backendBase}/api/story`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body
            });
            if (response.status === 404) {
                response = await fetch(`${this.deps.backendBase}/api/cases/${ACTIVE_STORY_ID}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body
                });
            }
            const payload = (await response.json()) as {
                error?: string;
                isValid?: boolean;
                issues?: Array<{ message: string; roomId: string }>;
                archivedTo?: string | null;
            };
            if (!response.ok) {
                throw new Error(
                    payload.error ??
                        `HTTP ${response.status} — restart backend: pnpm dev:editor:backend`
                );
            }
            this.clearCaseDirty();
            this.updateStoryStatus();
            let message = payload.isValid
                ? `Story saved (valid, ${this.getClues().length} clues).`
                : "Story saved but validation failed.";
            if (payload.archivedTo) {
                message += `\nPrevious version archived to ${payload.archivedTo}.`;
            }
            if (!payload.isValid) {
                const msgs = (payload.issues ?? []).map((i) => i.message).join("; ");
                message += ` ${msgs}`;
            }
            this.deps.reportIssue(message);
        } catch (error) {
            this.deps.reportIssue(`Save story failed: ${(error as Error).message}`);
        }
    }
}
