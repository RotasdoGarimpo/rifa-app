/**
 * Formatting and message building, ported from the design prototype's
 * rifa-core.js.
 *
 * These live server-side on purpose: the WhatsApp text a buyer sends and the
 * amount the organizer charges are derived from the same database row, so they
 * cannot drift apart. User-facing strings are pt-BR by design — see the
 * repo conventions.
 */

/** Zero-pad a number to the width of the raffle's highest number: 7 -> "007". */
export function padNumber(value: number, totalTickets: number) {
	const width = Math.max(String(totalTickets).length, 2);
	return String(value).padStart(width, "0");
}

/** 1000 -> "R$ 10,00" */
export function formatMoney(cents: number) {
	return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

/** Strip a phone down to digits for storage and wa.me links. */
export function normalizePhone(input: string) {
	return input.replace(/\D/g, "").slice(0, 11);
}

/** "11912345678" -> "(11) 91234-5678", formatting progressively as you type. */
export function formatPhone(input: string) {
	const digits = normalizePhone(input);

	if (digits.length <= 2) {
		return digits.length > 0 ? `(${digits}` : "";
	}
	if (digits.length <= 6) {
		return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
	}
	if (digits.length <= 10) {
		return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
	}
	return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Builds a wa.me deep link, adding Brazil's country code when it is missing. */
export function whatsappLink(text: string, phone: string) {
	const digits = phone.replace(/\D/g, "");
	const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;

	return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(text)}`;
}

type MessageRaffle = {
	title: string;
	priceCents: number;
	totalTickets: number;
};

export type ReservationMessageInput = {
	raffle: MessageRaffle;
	code: string;
	name: string;
	phone: string;
	numbers: number[];
};

/** The message the buyer sends to the organizer to ask for the PIX key. */
export function buildReservationMessage(input: ReservationMessageInput) {
	const { raffle, numbers } = input;
	const list = numbers.map((n) => padNumber(n, raffle.totalTickets)).join(", ");
	const total = numbers.length * raffle.priceCents;

	return [
		"Oi! Quero garantir meus números na rifa 🎸",
		"",
		`*Rifa:* ${raffle.title}`,
		`*Reserva:* #${input.code}`,
		`*Nome:* ${input.name}`,
		`*WhatsApp:* ${formatPhone(input.phone)}`,
		"",
		`*Números (${numbers.length}):* ${list}`,
		`*A pagar:* ${numbers.length} × ${formatMoney(raffle.priceCents)} = *${formatMoney(total)}*`,
		"",
		"Pode me mandar a chave PIX? 🙏",
	].join("\n");
}

export type ChargeMessageInput = ReservationMessageInput & { pixKey: string };

/** The message the organizer sends to chase an unpaid reservation. */
export function buildChargeMessage(input: ChargeMessageInput) {
	const { raffle, numbers } = input;
	const list = numbers.map((n) => padNumber(n, raffle.totalTickets)).join(", ");
	const total = numbers.length * raffle.priceCents;
	const firstName = input.name.trim().split(/\s+/)[0] ?? input.name;

	return [
		`Oi ${firstName}! Sobre a reserva #${input.code} — ${raffle.title}.`,
		`Números: ${list}`,
		`Total: ${formatMoney(total)} no PIX (chave: ${input.pixKey}).`,
		"Assim que cair eu confirmo seus números. Valeu!",
	].join("\n");
}

/** "Viola Caipira Rozini Master" -> "viola-caipira-rozini-master" */
export function slugify(input: string) {
	return (
		input
			.normalize("NFD")
			// Strip the combining accents that NFD just split off.
			.replace(/[̀-ͯ]/g, "")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 60)
	);
}
