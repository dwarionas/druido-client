// Minimal CSV helpers for card import/export.
// Handles quoted fields, escaped quotes ("") and newlines inside quotes.

export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let inQuotes = false;

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];

		if (inQuotes) {
			if (ch === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				field += ch;
			}
			continue;
		}

		if (ch === '"') {
			inQuotes = true;
		} else if (ch === ",") {
			row.push(field);
			field = "";
		} else if (ch === "\n" || ch === "\r") {
			if (ch === "\r" && text[i + 1] === "\n") i++;
			row.push(field);
			field = "";
			rows.push(row);
			row = [];
		} else {
			field += ch;
		}
	}

	if (field !== "" || row.length > 0) {
		row.push(field);
		rows.push(row);
	}

	return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export interface CsvCard {
	question: string;
	answer: string;
	tags: string[];
}

export function parseCardsCsv(text: string): CsvCard[] {
	const rows = parseCsv(text);
	if (rows.length === 0) return [];

	// skip a header row like "question,answer,tags"
	const start = rows[0][0]?.trim().toLowerCase() === "question" ? 1 : 0;

	const cards: CsvCard[] = [];
	for (let i = start; i < rows.length; i++) {
		const [question = "", answer = "", tags = ""] = rows[i];
		if (!question.trim() || !answer.trim()) continue;
		cards.push({
			question: question.trim(),
			answer: answer.trim(),
			tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
		});
	}
	return cards;
}

function escapeCsvField(value: string): string {
	if (/[",\n\r]/.test(value)) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

export function serializeCardsCsv(cards: CsvCard[]): string {
	const header = "question,answer,tags";
	const rows = cards.map((c) =>
		[c.question, c.answer, c.tags.join(", ")].map(escapeCsvField).join(","),
	);
	return [header, ...rows].join("\n");
}
