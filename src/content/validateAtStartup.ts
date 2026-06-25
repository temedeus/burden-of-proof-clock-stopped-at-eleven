import { validateRooms } from "@cse/content-schema";
import { loadFurnitureCatalog, loadNpcCatalog, loadRoomCatalog } from "./loadCatalog";

/** Log content validation issues in development builds. */
export function validateContentAtStartup(): void {
    if (!import.meta.env.DEV) return;

    const issues = validateRooms(
        Object.values(loadRoomCatalog()),
        loadFurnitureCatalog(),
        loadNpcCatalog()
    );

    if (issues.length === 0) return;

    console.warn("[content] Validation issues at startup:");
    for (const issue of issues) {
        console.warn(`  [${issue.roomId}] ${issue.message}`);
    }
}
