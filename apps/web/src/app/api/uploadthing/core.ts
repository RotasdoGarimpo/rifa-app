import { verifySessionToken } from "@rifa-app/api/lib/session";
import { cookies } from "next/headers";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

/**
 * Prize photos.
 *
 * The auth check reuses `verifySessionToken` from @rifa-app/api rather than
 * growing a second way to validate a session — this handler runs in Next while
 * the cookie is issued by Elysia, so the two must agree exactly.
 *
 * Cookies ignore port, so on localhost the :3333 cookie reaches :3000 fine.
 * In production the two origins must share a parent domain, or this middleware
 * sees no cookie and every upload is rejected.
 */
export const uploadRouter = {
	raffleImage: f({
		image: { maxFileSize: "4MB", maxFileCount: 1 },
	})
		.middleware(async () => {
			const store = await cookies();
			const session = await verifySessionToken(store.get("rifa_admin")?.value);

			if (!session) {
				throw new UploadThingError("Não autorizado.");
			}

			return { uploadedAt: Date.now() };
		})
		.onUploadComplete(async ({ file }) => {
			// Returned to the client callback, which saves it onto the raffle.
			return { url: file.ufsUrl };
		}),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
