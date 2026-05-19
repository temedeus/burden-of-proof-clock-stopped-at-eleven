import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { validateRooms, validateStoryCasePacket } from "../packages/content-schema/src/index.ts";

const ROOT = process.cwd();
const ROOMS_DIR = join(ROOT, "src", "data", "rooms");
const NPCS_DIR = join(ROOT, "src", "data", "npcs");
const CLUES_FILE = join(ROOT, "src", "data", "clues.json");
const STORY_DIR = join(ROOT, "src", "data", "story", "generated");
const STORY_FILES_DIR = join(STORY_DIR, "stories");
const STORY_MANIFEST_FILE = join(STORY_DIR, "story_manifest.json");

async function readJson(filePath) {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content);
}

async function readJsonDir(dirPath) {
    const entries = await readdir(dirPath);
    const jsonFiles = entries.filter((entry) => entry.endsWith(".json"));
    const parsed = await Promise.all(
        jsonFiles.map(async (entry) => ({
            id: entry.replace(".json", ""),
            value: await readJson(join(dirPath, entry))
        }))
    );
    return Object.fromEntries(parsed.map((item) => [item.id, item.value]));
}

async function loadFurnitureMap() {
    const table = await readJson(join(ROOT, "src", "data", "furniture", "table.json"));
    const bookshelves = await readJson(join(ROOT, "src", "data", "furniture", "bookshelves.json"));
    const decorations = await readJson(join(ROOT, "src", "data", "furniture", "decorations.json"));
    return {
        table,
        bookshelves,
        ...decorations
    };
}

async function validateGeneratedStories(roomsById, npcsById, cluesById) {
    const issues = [];
    const storyContext = {
        roomIds: Object.keys(roomsById),
        npcIds: Object.keys(npcsById),
        clueIds: Object.keys(cluesById)
    };

    let manifest;
    try {
        manifest = await readJson(STORY_MANIFEST_FILE);
    } catch {
        return { issues, manifestDirty: false };
    }

    const seen = new Set();
    let manifestDirty = false;

    for (const story of manifest.stories ?? []) {
        if (seen.has(story.id)) {
            issues.push({ roomId: story.id, message: `Duplicate story id '${story.id}' in manifest.` });
            continue;
        }
        seen.add(story.id);

        const rel = story.files?.story;
        if (!rel) {
            issues.push({ roomId: story.id, message: "Missing files.story in manifest entry." });
            continue;
        }

        const filePath = join(ROOT, "src", "data", "story", rel);
        let packet;
        try {
            packet = await readJson(filePath);
        } catch {
            issues.push({ roomId: story.id, message: "Manifest story file missing or unreadable." });
            if (story.isValid !== false) {
                story.isValid = false;
                manifestDirty = true;
            }
            continue;
        }

        const storyIssues = validateStoryCasePacket(story.id, packet, {
            ...storyContext,
            rooms: roomsById
        });
        issues.push(...storyIssues);

        const isValid = storyIssues.length === 0;
        if (story.isValid !== isValid) {
            story.isValid = isValid;
            manifestDirty = true;
        }
    }

    try {
        const storyFiles = (await readdir(STORY_FILES_DIR)).filter((f) => f.endsWith(".json"));
        for (const fileName of storyFiles) {
            const id = fileName.replace(".json", "");
            if (!seen.has(id)) {
                issues.push({ roomId: id, message: `Story file '${fileName}' is not listed in manifest.` });
            }
        }
    } catch {
        // No stories directory yet.
    }

    if (manifestDirty) {
        await writeFile(STORY_MANIFEST_FILE, JSON.stringify(manifest, null, 2) + "\n", "utf8");
    }

    return { issues, manifestDirty };
}

async function main() {
    const roomsById = await readJsonDir(ROOMS_DIR);
    const npcsById = await readJsonDir(NPCS_DIR);
    const cluesById = await readJson(CLUES_FILE);
    const furnitureById = await loadFurnitureMap();

    const issues = [
        ...validateRooms(Object.values(roomsById), furnitureById, npcsById),
        ...(await validateGeneratedStories(roomsById, npcsById, cluesById)).issues
    ];

    if (issues.length === 0) {
        console.log("Content validation passed.");
        return;
    }

    console.error("Content validation failed:");
    for (const issue of issues) {
        const label = issue.roomId === "global" ? "global" : issue.roomId;
        console.error(`- [${label}] ${issue.message}`);
    }
    process.exitCode = 1;
}

main().catch((error) => {
    console.error("Validation script crashed:", error);
    process.exitCode = 1;
});
