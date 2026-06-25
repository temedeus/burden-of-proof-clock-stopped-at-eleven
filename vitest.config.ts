import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["packages/content-schema/src/**/*.test.ts"]
    }
});
