import type {
    ClueAssignment,
    GeneratedClue,
    RoomConfig,
    StoryCasePacket,
    StoryManifest
} from "@cse/content-schema";
import { STORY_CLUE_COUNT, validateStoryCasePacket } from "@cse/content-schema";

export interface CaseEditorDeps {
    backendBase: string;
    workingRooms: Record<string, RoomConfig>;
    npcIds: string[];
    clueCatalogIds: string[];
    getSelectedFurniture: () => { roomId: string; listIndex: number } | null;
    reportIssue: (message: string) => void;
    onSelectionBadgeExtra: (extra: string) => void;
}

export class CaseEditor {
    private manifest: StoryManifest = { version: 1, stories: [] };
    private activeCaseId = "";
    private workingCase: StoryCasePacket | null = null;
    private caseDirty = false;

    private readonly caseSelect: HTMLSelectElement;
    private readonly caseTitleInput: HTMLInputElement;
    private readonly caseCulpritSelect: HTMLSelectElement;
    private readonly caseCluesRoot: HTMLDivElement;
    private readonly furnitureClueSelect: HTMLSelectElement;
    private readonly furnitureHintInput: HTMLTextAreaElement;
    private readonly playCaseLink: HTMLAnchorElement;
    private readonly caseDirtyStatus: HTMLParagraphElement;

    constructor(
        private readonly deps: CaseEditorDeps,
        root: ParentNode
    ) {
        this.caseSelect = root.querySelector("#case-select") as HTMLSelectElement;
        this.caseTitleInput = root.querySelector("#case-title") as HTMLInputElement;
        this.caseCulpritSelect = root.querySelector("#case-culprit") as HTMLSelectElement;
        this.caseCluesRoot = root.querySelector("#case-clues") as HTMLDivElement;
        this.furnitureClueSelect = root.querySelector("#furniture-clue-select") as HTMLSelectElement;
        this.furnitureHintInput = root.querySelector("#furniture-clue-hint") as HTMLTextAreaElement;
        this.playCaseLink = root.querySelector("#play-case-link") as HTMLAnchorElement;
        this.caseDirtyStatus = root.querySelector("#case-dirty-status") as HTMLParagraphElement;

        root.querySelector("#new-case-btn")?.addEventListener("click", () => void this.createCase());
        root.querySelector("#delete-case-btn")?.addEventListener("click", () => void this.deleteCase());
        root.querySelector("#validate-case-btn")?.addEventListener("click", () => this.validateCase());
        root.querySelector("#save-case-btn")?.addEventListener("click", () => void this.saveCase());
        root.querySelector("#apply-furniture-clue-btn")?.addEventListener("click", () => this.applyFurnitureClue());

        this.caseTitleInput.addEventListener("input", () => {
            if (!this.workingCase) return;
            this.workingCase.title = this.caseTitleInput.value;
            this.markCaseDirty();
        });
        this.caseCulpritSelect.addEventListener("change", () => {
            if (!this.workingCase) return;
            this.workingCase.culpritNpcId = this.caseCulpritSelect.value;
            this.markCaseDirty();
        });
        this.caseSelect.addEventListener("change", () => void this.loadSelectedCase());

        this.buildClueFormSkeleton();
        this.refreshCulpritOptions();
    }

    getActiveCaseId(): string {
        return this.activeCaseId;
    }

    isCaseDirty(): boolean {
        return this.caseDirty;
    }

    async bootstrap(): Promise<void> {
        await this.reloadManifest();
    }

    private buildClueFormSkeleton(): void {
        this.caseCluesRoot.innerHTML = "";
        for (let i = 0; i < STORY_CLUE_COUNT; i++) {
            const block = document.createElement("div");
            block.className = "case-clue-row";
            block.innerHTML = `
                <label>Clue ${i + 1} id</label>
                <input type="text" data-clue-field="id" data-clue-index="${i}" />
                <label>Name</label>
                <input type="text" data-clue-field="name" data-clue-index="${i}" />
                <label>Description</label>
                <input type="text" data-clue-field="description" data-clue-index="${i}" />
            `;
            this.caseCluesRoot.appendChild(block);
            for (const input of block.querySelectorAll("input")) {
                input.addEventListener("input", () => this.syncCluesFromForm());
            }
        }
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
        this.caseDirtyStatus.textContent = this.caseDirty
            ? "Case: unsaved changes"
            : "Case: saved";
    }

    private markCaseDirty(): void {
        this.caseDirty = true;
        this.setCaseDirtyStatus();
    }

    private clearCaseDirty(): void {
        this.caseDirty = false;
        this.setCaseDirtyStatus();
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

    private refreshCaseSelect(): void {
        const selected = this.caseSelect.value;
        this.caseSelect.innerHTML = "";
        for (const entry of this.manifest.stories ?? []) {
            const option = document.createElement("option");
            option.value = entry.id;
            const valid = entry.isValid === false ? " (invalid)" : "";
            option.textContent = `${entry.title ?? entry.id}${valid}`;
            this.caseSelect.appendChild(option);
        }
        if (selected && (this.manifest.stories ?? []).some((s) => s.id === selected)) {
            this.caseSelect.value = selected;
        } else if (this.manifest.stories?.[0]) {
            this.caseSelect.value = this.manifest.stories[0].id;
        }
        this.updatePlayLink();
    }

    private updatePlayLink(): void {
        if (!this.activeCaseId) {
            this.playCaseLink.href = "#";
            this.playCaseLink.textContent = "Play case (save & pick a case first)";
            return;
        }
        this.playCaseLink.href = `http://localhost:5173/?story=${encodeURIComponent(this.activeCaseId)}`;
        this.playCaseLink.textContent = `Play “${this.workingCase?.title ?? this.activeCaseId}” in game`;
    }

    private fillFormFromCase(packet: StoryCasePacket): void {
        this.caseTitleInput.value = packet.title ?? "";
        this.caseCulpritSelect.value = packet.culpritNpcId ?? "";
        const clues = packet.generatedClues ?? [];
        for (let i = 0; i < STORY_CLUE_COUNT; i++) {
            const clue = clues[i];
            for (const field of ["id", "name", "description"] as const) {
                const input = this.caseCluesRoot.querySelector(
                    `input[data-clue-index="${i}"][data-clue-field="${field}"]`
                ) as HTMLInputElement | null;
                if (input) input.value = clue?.[field] ?? "";
            }
        }
        this.refreshFurnitureClueOptions();
    }

    private syncCluesFromForm(): void {
        if (!this.workingCase) return;
        const generatedClues: GeneratedClue[] = [];
        for (let i = 0; i < STORY_CLUE_COUNT; i++) {
            const id = (
                this.caseCluesRoot.querySelector(`input[data-clue-index="${i}"][data-clue-field="id"]`) as HTMLInputElement
            ).value.trim();
            const name = (
                this.caseCluesRoot.querySelector(`input[data-clue-index="${i}"][data-clue-field="name"]`) as HTMLInputElement
            ).value.trim();
            const description = (
                this.caseCluesRoot.querySelector(
                    `input[data-clue-index="${i}"][data-clue-field="description"]`
                ) as HTMLInputElement
            ).value.trim();
            generatedClues.push({
                id: id || `clue_${i + 1}`,
                name: name || `Clue ${i + 1}`,
                description: description || "Something seems out of place."
            });
        }
        this.workingCase.generatedClues = generatedClues;
        this.reconcileAssignmentsAfterClueIdChange();
        this.markCaseDirty();
        this.refreshFurnitureClueOptions();
    }

    private reconcileAssignmentsAfterClueIdChange(): void {
        if (!this.workingCase) return;
        const clues = this.workingCase.generatedClues ?? [];
        const assignments = this.workingCase.clueAssignments ?? [];
        const byIndex = new Map<number, ClueAssignment>();
        for (let i = 0; i < assignments.length; i++) {
            byIndex.set(i, assignments[i]);
        }
        this.workingCase.clueAssignments = clues.map((clue, index) => {
            const prev = byIndex.get(index) ?? assignments.find((a) => a.clueId === clue.id);
            return {
                clueId: clue.id,
                roomId: prev?.roomId ?? Object.keys(this.deps.workingRooms)[0] ?? "hall",
                furnitureId: prev?.furnitureId,
                furnitureIndex: prev?.furnitureIndex ?? 0,
                hint: prev?.hint ?? "Something here relates to the case…"
            };
        });
    }

    private refreshFurnitureClueOptions(): void {
        const selected = this.furnitureClueSelect.value;
        this.furnitureClueSelect.innerHTML = '<option value="">— none —</option>';
        for (const clue of this.workingCase?.generatedClues ?? []) {
            const option = document.createElement("option");
            option.value = clue.id;
            option.textContent = `${clue.id} — ${clue.name}`;
            this.furnitureClueSelect.appendChild(option);
        }
        if (selected && [...this.furnitureClueSelect.options].some((o) => o.value === selected)) {
            this.furnitureClueSelect.value = selected;
        }
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

    onFurnitureSelected(roomId: string, listIndex: number | null): void {
        if (listIndex == null || !this.workingCase) {
            this.deps.onSelectionBadgeExtra("");
            this.furnitureClueSelect.value = "";
            this.furnitureHintInput.value = "";
            return;
        }
        const room = this.deps.workingRooms[roomId];
        if (!room) return;
        const placement = room.furniture[listIndex];
        if (!placement) return;
        const furnitureIndex = CaseEditor.furnitureInstanceIndex(room, listIndex);
        const assignment = (this.workingCase.clueAssignments ?? []).find(
            (a) =>
                a.roomId === roomId &&
                a.furnitureId === placement.furnitureId &&
                (a.furnitureIndex ?? 0) === furnitureIndex
        );
        const assignedClue = assignment?.clueId ?? "";
        this.refreshFurnitureClueOptions();
        this.furnitureClueSelect.value = assignedClue;
        this.furnitureHintInput.value = assignment?.hint ?? "";
        const label = assignedClue ? ` · clue: ${assignedClue}` : "";
        this.deps.onSelectionBadgeExtra(
            ` · ${placement.furnitureId} #${furnitureIndex}${label}`
        );
    }

    applyFurnitureClue(): void {
        if (!this.workingCase) {
            this.deps.reportIssue("No case loaded.");
            return;
        }
        const selection = this.deps.getSelectedFurniture();
        if (!selection) {
            this.deps.reportIssue("Select a furniture piece on the canvas first.");
            return;
        }
        const { roomId, listIndex } = selection;
        const room = this.deps.workingRooms[roomId];
        const placement = room?.furniture[listIndex];
        if (!room || !placement) return;

        const clueId = this.furnitureClueSelect.value;
        const hint = this.furnitureHintInput.value.trim();
        const furnitureIndex = CaseEditor.furnitureInstanceIndex(room, listIndex);

        if (!clueId) {
            this.deps.reportIssue("Pick a clue to assign.");
            return;
        }
        if (!hint) {
            this.deps.reportIssue("Enter an examine hint for this clue.");
            return;
        }

        const slotAssignment: ClueAssignment = {
            clueId,
            roomId,
            furnitureId: placement.furnitureId,
            furnitureIndex,
            hint
        };
        const byClueId = new Map(
            (this.workingCase.clueAssignments ?? []).map((assignment) => [assignment.clueId, assignment])
        );
        byClueId.set(clueId, slotAssignment);
        const clues = this.workingCase.generatedClues ?? [];
        this.workingCase.clueAssignments = clues.map(
            (clue) =>
                byClueId.get(clue.id) ?? {
                    clueId: clue.id,
                    roomId,
                    furnitureId: placement.furnitureId,
                    furnitureIndex: 0,
                    hint: "Assign this clue to furniture in the editor."
                }
        );

        this.markCaseDirty();
        this.onFurnitureSelected(roomId, listIndex);
        this.deps.reportIssue(`Assigned '${clueId}' to ${placement.furnitureId} #${furnitureIndex} in ${roomId}.`);
    }

    validateCase(): boolean {
        if (!this.workingCase || !this.activeCaseId) {
            this.deps.reportIssue("No case loaded.");
            return false;
        }
        this.syncCluesFromForm();
        const issues = validateStoryCasePacket(
            this.activeCaseId,
            this.workingCase,
            this.storyContext(this.workingCase)
        );
        if (issues.length === 0) {
            this.deps.reportIssue(`Case '${this.activeCaseId}' is valid.`);
            return true;
        }
        this.deps.reportIssue(
            issues.map((issue) => `[${issue.roomId}] ${issue.message}`).join("\n")
        );
        return false;
    }

    async reloadManifest(): Promise<void> {
        try {
            const response = await fetch(`${this.deps.backendBase}/api/cases`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = (await response.json()) as { manifest: StoryManifest };
            this.manifest = payload.manifest ?? { version: 1, stories: [] };
            this.refreshCaseSelect();
            if (!this.activeCaseId && this.manifest.stories?.[0]) {
                this.caseSelect.value = this.manifest.stories[0].id;
                await this.loadSelectedCase();
            }
        } catch {
            this.deps.reportIssue("Could not load cases from backend. Start: pnpm dev:editor:backend");
        }
    }

    async loadSelectedCase(): Promise<void> {
        const caseId = this.caseSelect.value;
        if (!caseId) return;
        if (this.caseDirty) {
            const proceed = window.confirm("Case has unsaved changes. Discard and load another?");
            if (!proceed) {
                this.caseSelect.value = this.activeCaseId;
                return;
            }
        }
        try {
            const response = await fetch(`${this.deps.backendBase}/api/cases/${caseId}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = (await response.json()) as { packet: StoryCasePacket };
            this.activeCaseId = caseId;
            this.workingCase = payload.packet;
            this.fillFormFromCase(this.workingCase);
            this.clearCaseDirty();
            this.updatePlayLink();
        } catch (error) {
            this.deps.reportIssue(`Failed to load case: ${(error as Error).message}`);
        }
    }

    async createCase(): Promise<void> {
        try {
            const response = await fetch(`${this.deps.backendBase}/api/cases`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            });
            const payload = (await response.json()) as { id?: string; error?: string };
            if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
            await this.reloadManifest();
            if (payload.id) {
                this.caseSelect.value = payload.id;
                await this.loadSelectedCase();
            }
            this.deps.reportIssue(`Created case '${payload.id}'.`);
        } catch (error) {
            this.deps.reportIssue(`Create case failed: ${(error as Error).message}`);
        }
    }

    async deleteCase(): Promise<void> {
        if (!this.activeCaseId) return;
        if (!window.confirm(`Delete case '${this.activeCaseId}'?`)) return;
        try {
            const response = await fetch(`${this.deps.backendBase}/api/cases/${this.activeCaseId}`, {
                method: "DELETE"
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.activeCaseId = "";
            this.workingCase = null;
            this.caseDirty = false;
            await this.reloadManifest();
            this.deps.reportIssue("Case deleted.");
        } catch (error) {
            this.deps.reportIssue(`Delete failed: ${(error as Error).message}`);
        }
    }

    async saveCase(): Promise<void> {
        if (!this.workingCase || !this.activeCaseId) {
            this.deps.reportIssue("No case loaded.");
            return;
        }
        this.syncCluesFromForm();
        this.workingCase.title = this.caseTitleInput.value.trim() || this.activeCaseId;
        this.workingCase.culpritNpcId = this.caseCulpritSelect.value;
        try {
            const response = await fetch(`${this.deps.backendBase}/api/cases/${this.activeCaseId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packet: this.workingCase })
            });
            const payload = (await response.json()) as {
                error?: string;
                isValid?: boolean;
                issues?: Array<{ message: string; roomId: string }>;
            };
            if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
            this.clearCaseDirty();
            await this.reloadManifest();
            if (payload.isValid) {
                this.deps.reportIssue(`Saved case '${this.activeCaseId}' (valid).`);
            } else {
                const msgs = (payload.issues ?? []).map((i) => i.message).join("; ");
                this.deps.reportIssue(`Saved case '${this.activeCaseId}' but validation failed: ${msgs}`);
            }
        } catch (error) {
            this.deps.reportIssue(`Save case failed: ${(error as Error).message}`);
        }
    }
}
