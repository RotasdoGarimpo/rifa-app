import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { authRouter } from "./auth";
import { raffleRouter } from "./raffle";
import { reservationRouter } from "./reservation";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	auth: authRouter,
	raffle: raffleRouter,
	reservation: reservationRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
