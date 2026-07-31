/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, Serwist } from "serwist";

declare global {
	interface WorkerGlobalScope extends SerwistGlobalConfig {
		__SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
	}
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
	precacheEntries: self.__SW_MANIFEST,
	skipWaiting: true,
	clientsClaim: true,
	navigationPreload: true,
	runtimeCaching: [
		// defaultCache's page rules do not match every App Router navigation, so
		// a miss escapes the worker entirely and the browser shows its own error
		// page instead of the offline fallback. This catches navigations first.
		{
			matcher: ({ request }) => request.mode === "navigate",
			handler: new NetworkFirst({
				cacheName: "pages",
				networkTimeoutSeconds: 10,
			}),
		},
		...defaultCache,
	],
	fallbacks: {
		entries: [
			{
				url: "/offline",
				matcher: ({ request }) => request.destination === "document",
			},
		],
	},
});

serwist.addEventListeners();
