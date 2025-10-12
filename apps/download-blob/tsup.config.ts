import { defineConfig } from "tsup"

export default defineConfig({
	entry: ["src/**/*.ts"],
	platform: "node",
	format: ["esm"],
	dts: true,
	sourcemap: true,
	clean: true,
	bundle: true,
	splitting: false,
	outDir: "dist",
	minify: false,
	external: ["dotenv"],
})
