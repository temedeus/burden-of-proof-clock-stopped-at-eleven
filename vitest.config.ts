import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            "@cse/content-schema": path.resolve(__dirname, "packages/content-schema/src/index.ts")
        }
    },
    test: {
        include: ["packages/content-schema/src/**/*.test.ts", "src/**/*.test.ts"]
    }
});
