import type { LucideIcon } from "lucide-react";
import { Target, Layers, Library, Flame, CalendarCheck, Trophy, Star, Sparkles, Crown, FolderOpen } from "lucide-react";
import { StatsOverview, DeckStats } from "./decks-api";

export interface Achievement {
    id: string;
    icon: LucideIcon;
    titleKey: string;
    descKey: string;
    earned: boolean;
}

export function computeAchievements(
    overview: StatsOverview | null,
    deckStats: DeckStats[],
): Achievement[] {
    if (!overview) return getAll(false);

    const totalCards = overview.totalCards;
    const totalDecks = overview.totalDecks;
    const streak = overview.streak;
    const xp = overview.xp;
    const hasMastered = deckStats.some((d) => d.masteryPercent === 100 && d.total > 0);

    return [
        {
            id: "first-deck",
            icon: Target,
            titleKey: "achievements.first_deck",
            descKey: "achievements.first_deck.desc",
            earned: totalDecks >= 1,
        },
        {
            id: "ten-cards",
            icon: Layers,
            titleKey: "achievements.ten_cards",
            descKey: "achievements.ten_cards.desc",
            earned: totalCards >= 10,
        },
        {
            id: "hundred-cards",
            icon: Library,
            titleKey: "achievements.hundred_cards",
            descKey: "achievements.hundred_cards.desc",
            earned: totalCards >= 100,
        },
        {
            id: "streak-3",
            icon: Flame,
            titleKey: "achievements.streak_3",
            descKey: "achievements.streak_3.desc",
            earned: streak >= 3,
        },
        {
            id: "streak-7",
            icon: CalendarCheck,
            titleKey: "achievements.streak_7",
            descKey: "achievements.streak_7.desc",
            earned: streak >= 7,
        },
        {
            id: "streak-30",
            icon: Trophy,
            titleKey: "achievements.streak_30",
            descKey: "achievements.streak_30.desc",
            earned: streak >= 30,
        },
        {
            id: "xp-100",
            icon: Star,
            titleKey: "achievements.xp_100",
            descKey: "achievements.xp_100.desc",
            earned: xp >= 100,
        },
        {
            id: "xp-1000",
            icon: Sparkles,
            titleKey: "achievements.xp_1000",
            descKey: "achievements.xp_1000.desc",
            earned: xp >= 1000,
        },
        {
            id: "deck-master",
            icon: Crown,
            titleKey: "achievements.deck_master",
            descKey: "achievements.deck_master.desc",
            earned: hasMastered,
        },
        {
            id: "five-decks",
            icon: FolderOpen,
            titleKey: "achievements.five_decks",
            descKey: "achievements.five_decks.desc",
            earned: totalDecks >= 5,
        },
    ];
}

function getAll(earned: boolean): Achievement[] {
    return computeAchievements(
        { xp: earned ? 9999 : 0, streak: earned ? 9999 : 0, dailyGoal: 20, lastStudiedAt: null, memberSince: "", totalDecks: earned ? 99 : 0, totalCards: earned ? 999 : 0, reviewedToday: 0 },
        earned ? [{ deckId: "", deckName: "", total: 10, mature: 10, learning: 0, new: 0, masteryPercent: 100 }] : [],
    );
}
