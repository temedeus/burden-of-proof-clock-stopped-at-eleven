import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
    base: process.env.VITE_BASE ?? "/",
    resolve: {
        alias: {
            "@cse/content-schema": fileURLToPath(
                new URL("./packages/content-schema/src/index.ts", import.meta.url)
            )
        }
    },
    build: {
        rollupOptions: {
            input: {
                main: fileURLToPath(new URL("./index.html", import.meta.url))
            }
        }
    }
});
