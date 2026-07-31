"use client";

import { useEffect } from "react";

/**
 * Registers the service worker built by `serwist build`. Configurator mode has
 * no Next plugin to inject the registration, so it happens here.
 *
 * Skipped in development: a worker serving a cached bundle on every reload
 * makes edits look like they did not apply.
 */
export function ServiceWorker() {
	useEffect(() => {
		if (
			process.env.NODE_ENV !== "production" ||
			!("serviceWorker" in navigator)
		) {
			return;
		}

		navigator.serviceWorker.register("/sw.js").catch(() => {
			// A failed registration must never break the page.
		});
	}, []);

	return null;
}
