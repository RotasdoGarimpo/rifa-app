import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Rifa da Viola",
		short_name: "Rifa da Viola",
		description: "Garanta seus números e concorra pela Loteria Federal.",
		lang: "pt-BR",
		dir: "ltr",
		start_url: "/",
		scope: "/",
		display: "standalone",
		orientation: "portrait",
		// Matches the Rifaí ground so the splash screen does not flash white
		// before the app paints.
		background_color: "#f6f7f9",
		theme_color: "#446df6",
		categories: ["shopping", "entertainment"],
		icons: [
			{
				src: "/favicon/web-app-manifest-192x192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "maskable",
			},
			{
				src: "/favicon/web-app-manifest-512x512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
			{
				src: "/favicon/favicon.svg",
				sizes: "any",
				type: "image/svg+xml",
			},
		],
	};
}
