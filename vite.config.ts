import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
    resolve: {
        alias: {
            "@cse/content-schema": fileURLToPath(
                new URL("./packages/content-schema/src/index.ts", import.meta.url)
            )
        }
    }
});
