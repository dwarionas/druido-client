import { describe, it, expect } from "vitest";
import { parseCsv, parseCardsCsv, serializeCardsCsv } from "./csv";

describe("parseCsv", () => {
	it("splits simple rows", () => {
		expect(parseCsv("a,b,c\nd,e,f")).toEqual([
			["a", "b", "c"],
			["d", "e", "f"],
		]);
	});

	it("keeps commas inside quoted fields", () => {
		expect(parseCsv('"Hello, world",answer')).toEqual([["Hello, world", "answer"]]);
	});

	it("unescapes doubled quotes", () => {
		expect(parseCsv('"say ""hi""",ok')).toEqual([['say "hi"', "ok"]]);
	});

	it("supports newlines inside quoted fields", () => {
		expect(parseCsv('"line one\nline two",x')).toEqual([["line one\nline two", "x"]]);
	});

	it("handles CRLF line endings", () => {
		expect(parseCsv("a,b\r\nc,d")).toEqual([
			["a", "b"],
			["c", "d"],
		]);
	});

	it("skips blank lines", () => {
		expect(parseCsv("a,b\n\n\nc,d\n")).toEqual([
			["a", "b"],
			["c", "d"],
		]);
	});
});

describe("parseCardsCsv", () => {
	it("skips the header row", () => {
		const cards = parseCardsCsv("question,answer,tags\ndie Katze,кіт,animals");
		expect(cards).toEqual([{ question: "die Katze", answer: "кіт", tags: ["animals"] }]);
	});

	it("works without a header row", () => {
		const cards = parseCardsCsv("die Katze,кіт");
		expect(cards).toEqual([{ question: "die Katze", answer: "кіт", tags: [] }]);
	});

	it("splits multiple tags", () => {
		const cards = parseCardsCsv('q,a,"b2, verbs"');
		expect(cards[0].tags).toEqual(["b2", "verbs"]);
	});

	it("drops rows without a question or an answer", () => {
		const cards = parseCardsCsv("q1,\n,a2\nq3,a3");
		expect(cards).toEqual([{ question: "q3", answer: "a3", tags: [] }]);
	});
});

describe("serializeCardsCsv", () => {
	it("round-trips cards with tricky characters", () => {
		const cards = [
			{ question: 'he said "stop", twice', answer: "line1\nline2", tags: ["a", "b"] },
			{ question: "plain", answer: "text", tags: [] },
		];

		const parsed = parseCardsCsv(serializeCardsCsv(cards));

		expect(parsed).toEqual(cards);
	});
});
