import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/lib/i18n";
import AchievementsBadges from "./AchievementsBadges";
import { computeAchievements } from "@/lib/achievements";

function renderBadges(achievements = computeAchievements(null, [])) {
	return render(
		<I18nProvider>
			<AchievementsBadges achievements={achievements} />
		</I18nProvider>,
	);
}

describe("AchievementsBadges", () => {
	it("shows the earned counter", () => {
		renderBadges();
		expect(screen.getByText("0/10")).toBeDefined();
	});

	it("renders every achievement title", () => {
		renderBadges();
		expect(screen.getByText("First Deck")).toBeDefined();
		expect(screen.getByText("Deck Master")).toBeDefined();
	});

	it("counts earned achievements", () => {
		const achievements = computeAchievements(
			{ xp: 150, streak: 0, dailyGoal: 20, lastStudiedAt: null, memberSince: "", totalDecks: 1, totalCards: 0, reviewedToday: 0 },
			[],
		);
		renderBadges(achievements);
		expect(screen.getByText("2/10")).toBeDefined();
	});
});
