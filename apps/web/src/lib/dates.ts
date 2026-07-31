/** "20/08", matching the design's compact draw-date label. */
export function formatDrawDate(date: Date | string | null) {
	if (!date) return "a definir";

	return new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		timeZone: "America/Sao_Paulo",
	}).format(new Date(date));
}
