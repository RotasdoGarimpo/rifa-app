import { readFileSync } from "node:fs";

import { serwist } from "@serwist/next/config";

/**
 * Serwist runs as a separate build step rather than a Next plugin.
 *
 * @serwist/next's plugin injects a webpack config, and Next 16 defaults to
 * Turbopack — using it would mean building the whole app with `--webpack`
 * just to emit a service worker. Configurator mode keeps the app on Turbopack
 * and builds the worker afterwards from the same options.
 */

// The glob only matches hashed assets under .next/static, so the offline page
// has to be precached explicitly — otherwise the fallback points at a URL that
// was never cached and offline navigation fails outright. Keying the revision
// to the build id means a new deploy replaces it rather than serving a stale
// copy forever.
const buildId = readFileSync(".next/BUILD_ID", "utf8").trim();

export default serwist({
	swSrc: "src/app/sw.ts",
	swDest: "public/sw.js",
	globDirectory: ".next",
	additionalPrecacheEntries: [{ url: "/offline", revision: buildId }],
});
