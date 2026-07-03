import { describe, it, expect } from "vitest";
import { computeAchievements } from "./achievements";
import type { StatsOverview, DeckStats } from "./decks-api";

function overview(partial: Partial<StatsOverview> = {}): StatsOverview {
	return {
		xp: 0,
		streak: 0,
		dailyGoal: 20,
		lastStudiedAt: null,
		memberSince: "",
		totalDecks: 0,
		totalCards: 0,
		reviewedToday: 0,
		...partial,
	};
}

function earnedIds(ov: StatsOverview, decks: DeckStats[] = []) {
	return computeAchievements(ov, decks)
		.filter((a) => a.earned)
		.map((a) => a.id);
}

describe("computeAchievements", () => {
	it("returns everything locked without an overview", () => {
		const achievements = computeAchievements(null, []);
		expect(achievements).toHaveLength(10);
		expect(achievements.every((a) => !a.earned)).toBe(true);
	});

	it("unlocks the first-deck achievement", () => {
		expect(earnedIds(overview({ totalDecks: 1 }))).toEqual(["first-deck"]);
	});

	it("unlocks streak tiers cumulatively", () => {
		expect(earnedIds(overview({ streak: 7 }))).toEqual(
			expect.arrayContaining(["streak-3", "streak-7"]),
		);
		expect(earnedIds(overview({ streak: 7 }))).not.toContain("streak-30");
	});

	it("requires a non-empty deck for deck mastery", () => {
		const emptyDeck: DeckStats = { deckId: "d", deckName: "D", total: 0, mature: 0, learning: 0, new: 0, masteryPercent: 100 };
		expect(earnedIds(overview(), [emptyDeck])).not.toContain("deck-master");

		const mastered: DeckStats = { ...emptyDeck, total: 10, mature: 10 };
		expect(earnedIds(overview(), [mastered])).toContain("deck-master");
	});

	it("unlocks xp milestones", () => {
		expect(earnedIds(overview({ xp: 100 }))).toContain("xp-100");
		expect(earnedIds(overview({ xp: 100 }))).not.toContain("xp-1000");
		expect(earnedIds(overview({ xp: 1500 }))).toContain("xp-1000");
	});
});
