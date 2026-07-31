import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@rifa-app/env/server";

import { PrismaClient } from "../prisma/generated/client";

export type { Prisma } from "../prisma/generated/client";
// Re-exported so consumers never have to reach into prisma/generated themselves.
export {
	RaffleStatus,
	ReservationStatus,
	TicketStatus,
} from "../prisma/generated/enums";
export type {
	RaffleModel as Raffle,
	ReservationModel as Reservation,
	TicketModel as Ticket,
} from "../prisma/generated/models";

export function createPrismaClient() {
	const adapter = new PrismaPg({
		connectionString: env.DATABASE_URL,
	});
	return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();
export default prisma;
