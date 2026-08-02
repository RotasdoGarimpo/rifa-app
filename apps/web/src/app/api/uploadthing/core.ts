import { env } from "@rifa-app/env/web";
import { headers } from "next/headers";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

/**
 * Prize photos.
 *
 * This is the one place Next has to validate a session. It asks apps/server
 * rather than importing the auth instance: that would pull Prisma — generated
 * for the Bun runtime — into the Next process just to read a cookie.
 */
async function isAdmin() {
	const cookie = (await headers()).get("cookie");
	if (!cookie) return false;

	const response = await fetch(`${env.SERVER_ORIGIN}/api/auth/get-session`, {
		headers: { cookie },
	});
	if (!response.ok) return false;

	// An unauthenticated request is a 200 with a null body, not an error.
	return (await response.json()) !== null;
}

export const uploadRouter = {
	raffleImage: f({
		image: { maxFileSize: "4MB", maxFileCount: 1 },
	})
		.middleware(async () => {
			if (!(await isAdmin())) {
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
