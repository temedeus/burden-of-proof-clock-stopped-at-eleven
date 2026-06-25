import { describe, expect, it } from "vitest";
import { buildFurnitureCatalog, type FurnitureConfig } from "./furniture";

const table: FurnitureConfig = {
    id: "table",
    name: "Table",
    description: "A table",
    width: 2,
    height: 2
};

const bookshelves: FurnitureConfig = {
    id: "bookshelves",
    name: "Bookshelves",
    description: "Shelves",
    width: 1,
    height: 2
};

describe("buildFurnitureCatalog", () => {
    it("merges table, bookshelves, and decoration entries", () => {
        const lamp: FurnitureConfig = {
            id: "lamp",
            name: "Lamp",
            description: "Light",
            width: 1,
            height: 1
        };

        const catalog = buildFurnitureCatalog(table, bookshelves, { lamp });

        expect(Object.keys(catalog).sort()).toEqual(["bookshelves", "lamp", "table"]);
        expect(catalog.table).toBe(table);
        expect(catalog.bookshelves).toBe(bookshelves);
        expect(catalog.lamp).toBe(lamp);
    });

    it("keys entries by furniture id", () => {
        const catalog = buildFurnitureCatalog(table, bookshelves, {});
        expect(catalog.table.id).toBe("table");
        expect(catalog.bookshelves.id).toBe("bookshelves");
    });
});
