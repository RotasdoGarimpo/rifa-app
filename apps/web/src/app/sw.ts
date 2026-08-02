/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, NetworkOnly, Serwist } from "serwist";

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
		// The API is proxied through this origin (see next.config.ts), which puts
		// it inside defaultCache's same-origin "others" rule. Only POST saves us
		// today, and only because Serwist's rules default to GET — the day an oRPC
		// query moves to GET, admin data would be served from a 24h cache to
		// whoever opens the page next. defaultCache already does exactly this for
		// /api/auth; /rpc needs the same.
		{
			matcher: ({ url: { pathname }, sameOrigin }) =>
				sameOrigin && pathname.startsWith("/rpc"),
			handler: new NetworkOnly({ networkTimeoutSeconds: 10 }),
		},
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
