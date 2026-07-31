/**
 * Development seed. Recreates the three raffles from the design prototype plus
 * a spread of reservations, so the grid, progress bars and admin list all have
 * something realistic to render.
 *
 * Run with: bun run seed
 */
import {
	createRaffle,
	createReservation,
} from "@rifa-app/api/lib/reservations";
import prisma from "@rifa-app/db";

const RAFFLES = [
	{
		slug: "viola-caipira-rozini-master",
		title: "Viola Caipira Rozini Master",
		subtitle: "Viola de 10 cordas + case e afinador",
		priceCents: 1_000,
		totalTickets: 200,
		drawDate: new Date("2026-08-20T20:00:00Z"),
		featured: true,
		paidCount: 58,
	},
	{
		slug: "violao-tagima-woodstock",
		title: "Violão Tagima Woodstock",
		subtitle: "Elétrico, nylon, com capa",
		priceCents: 2_500,
		totalTickets: 100,
		drawDate: new Date("2026-09-05T20:00:00Z"),
		featured: false,
		paidCount: 46,
	},
	{
		slug: "cavaquinho-luthier-marques",
		title: "Cavaquinho Luthier Marques",
		subtitle: "Feito à mão, tampo maciço",
		priceCents: 500,
		totalTickets: 1_000,
		drawDate: new Date("2026-09-28T20:00:00Z"),
		featured: false,
		paidCount: 180,
	},
] as const;

const BUYERS = [
	{ name: "Ana Beatriz Melo", phone: "11912345678", numbers: [7, 12, 45] },
	{ name: "Rogério Tavares", phone: "11988761020", numbers: [88, 89] },
	{ name: "Juliana Prado", phone: "11974448890", numbers: [150, 151, 152] },
	{ name: "Seu Zé da Viola", phone: "62992017766", numbers: [1, 2, 3] },
] as const;

console.log("Clearing existing data…");
await prisma.raffle.deleteMany();

for (const { paidCount, ...data } of RAFFLES) {
	const raffle = await createRaffle({ ...data });
	console.log(`  ${raffle.slug} — ${data.totalTickets} tickets`);
}

// Reserve before marking anything sold, so the buyers below get the exact
// numbers the design shows instead of colliding with the paid block.
console.log("Creating pending reservations on the featured raffle…");
for (const buyer of BUYERS) {
	const reservation = await createReservation({
		raffleSlug: RAFFLES[0].slug,
		numbers: [...buyer.numbers],
		name: buyer.name,
		phone: buyer.phone,
	});
	console.log(`  ${reservation.code} — ${buyer.name}`);
}

console.log("Marking a block of tickets paid so progress bars are not empty…");
for (const { slug, paidCount } of RAFFLES) {
	const free = await prisma.ticket.findMany({
		where: { raffle: { slug }, status: "FREE" },
		select: { id: true },
		take: paidCount,
		orderBy: { number: "asc" },
	});

	await prisma.ticket.updateMany({
		where: { id: { in: free.map((ticket) => ticket.id) } },
		data: { status: "PAID" },
	});

	console.log(`  ${slug} — ${free.length} paid`);
}

const [raffles, reservations, tickets] = await Promise.all([
	prisma.raffle.count(),
	prisma.reservation.count(),
	prisma.ticket.count(),
]);

console.log(
	`\nDone — ${raffles} raffles, ${reservations} reservations, ${tickets} tickets.`,
);
process.exit(0);
