import { env } from "@rifa-app/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	/**
	 * apps/server runs on its own domain in production, which would make the
	 * admin session a third-party cookie — Safari drops those outright. Proxying
	 * both backend surfaces through this origin keeps the cookie first-party and
	 * SameSite=Lax, and removes CORS from the browser's path entirely.
	 *
	 * /api/uploadthing is deliberately not matched: that handler is local.
	 */
	async rewrites() {
		return [
			{
				source: "/api/auth/:path*",
				destination: `${env.SERVER_ORIGIN}/api/auth/:path*`,
			},
			{
				source: "/rpc/:path*",
				destination: `${env.SERVER_ORIGIN}/rpc/:path*`,
			},
		];
	},
};

export default nextConfig;
