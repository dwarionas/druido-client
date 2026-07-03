"use client";

import React from "react";
import { useI18n } from "@/lib/i18n";
import { getStatsOverview, getStatsHeatmap, getStatsDaily, getStatsByDeck, type StatsOverview, type DailyStats, type DeckStats } from "@/lib/decks-api";
import { computeAchievements } from "@/lib/achievements";
import AchievementsBadges from "@/components/app/AchievementsBadges";
import { Flame, Star, Layers, FolderOpen } from "lucide-react";

interface HeatmapCell {
    date: string;
    count: number;
    level: number;
    inRange: boolean;
}

function toDateKey(d: Date) {
    return d.toISOString().split("T")[0];
}

// GitHub-style grid: columns are weeks, rows are weekdays starting on Sunday
function buildHeatmapWeeks(heatmap: Record<string, number>): HeatmapCell[][] {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - 364);

    const gridStart = new Date(rangeStart);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    const weeks: HeatmapCell[][] = [];
    const cursor = new Date(gridStart);

    while (cursor <= today) {
        const week: HeatmapCell[] = [];
        for (let i = 0; i < 7; i++) {
            const key = toDateKey(cursor);
            const count = heatmap[key] || 0;
            const level = count === 0 ? 0 : count <= 5 ? 1 : count <= 15 ? 2 : count <= 30 ? 3 : 4;
            week.push({
                date: key,
                count,
                level,
                inRange: cursor >= rangeStart && cursor <= today,
            });
            cursor.setDate(cursor.getDate() + 1);
        }
        weeks.push(week);
    }

    return weeks;
}

const LEVEL_CLASSES = [
    "bg-muted",
    "bg-primary/25",
    "bg-primary/50",
    "bg-primary/75",
    "bg-primary",
];

export default function StatsPage() {
    const { t, locale } = useI18n();
    const [overview, setOverview] = React.useState<StatsOverview | null>(null);
    const [heatmap, setHeatmap] = React.useState<Record<string, number>>({});
    const [daily, setDaily] = React.useState<DailyStats[]>([]);
    const [deckStats, setDeckStats] = React.useState<DeckStats[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let cancelled = false;
        Promise.all([getStatsOverview(), getStatsHeatmap(), getStatsDaily(30), getStatsByDeck()])
            .then(([ov, hm, dl, ds]) => {
                if (!cancelled) {
                    setOverview(ov);
                    setHeatmap(hm);
                    setDaily(dl);
                    setDeckStats(ds);
                }
            })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const goalProgress = overview ? Math.min((overview.reviewedToday / overview.dailyGoal) * 100, 100) : 0;

    const weeks = React.useMemo(() => buildHeatmapWeeks(heatmap), [heatmap]);

    // month label above the first week that starts a new month
    const monthLabels = React.useMemo(() => {
        return weeks.map((week, i) => {
            if (i === 0) return "";
            const prevMonth = new Date(weeks[i - 1][0].date).getMonth();
            const month = new Date(week[0].date).getMonth();
            if (month === prevMonth) return "";
            return new Date(week[0].date).toLocaleDateString(locale, { month: "short" });
        });
    }, [weeks, locale]);

    // fill the last 30 days so the chart has no gaps
    const dailyFilled = React.useMemo(() => {
        const byDate = new Map(daily.map((d) => [d.date, d]));
        const days: DailyStats[] = [];
        const cursor = new Date();
        cursor.setDate(cursor.getDate() - 29);
        for (let i = 0; i < 30; i++) {
            const key = toDateKey(cursor);
            days.push(byDate.get(key) ?? { date: key, cardsReviewed: 0, xpEarned: 0 });
            cursor.setDate(cursor.getDate() + 1);
        }
        return days;
    }, [daily]);

    const maxDaily = Math.max(...dailyFilled.map(d => d.cardsReviewed), 1);

    const overviewCards = [
        { icon: Flame, iconClass: "text-orange-500", value: overview?.streak ?? 0, labelKey: "stats.streak" },
        { icon: Star, iconClass: "text-amber-500", value: overview?.xp ?? 0, labelKey: "stats.xp" },
        { icon: Layers, iconClass: "text-primary", value: overview?.totalCards ?? 0, labelKey: "stats.total_cards" },
        { icon: FolderOpen, iconClass: "text-blue-500", value: overview?.totalDecks ?? 0, labelKey: "stats.total_decks" },
    ];

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-muted rounded-md" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted rounded-xl" />)}
                </div>
                <div className="h-40 bg-muted rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("stats.title")}</h1>

            {/* Overview cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {overviewCards.map(({ icon: Icon, iconClass, value, labelKey }) => (
                    <div key={labelKey} className="bg-card border border-border rounded-xl p-5 flex flex-col items-center justify-center text-center">
                        <Icon className={`h-5 w-5 mb-2 ${iconClass}`} />
                        <div className="text-2xl font-bold">{value}</div>
                        <div className="text-xs font-medium text-muted-foreground mt-1">{t(labelKey)}</div>
                    </div>
                ))}
            </div>

            {/* Daily goal progress */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold">{t("stats.daily_goal")}</h2>
                    <span className="text-sm font-medium text-muted-foreground">{overview?.reviewedToday ?? 0} / {overview?.dailyGoal ?? 20}</span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-700 rounded-full"
                        style={{ width: `${goalProgress}%` }}
                    />
                </div>
            </div>

            {/* Activity heatmap */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-base font-semibold mb-4">{t("stats.activity")}</h2>
                <div className="overflow-x-auto pb-2">
                    <div className="min-w-[720px]">
                        <div className="flex gap-1 mb-1 text-[10px] text-muted-foreground">
                            {monthLabels.map((label, i) => (
                                <span key={i} className="w-3 shrink-0 overflow-visible whitespace-nowrap">{label}</span>
                            ))}
                        </div>
                        <div className="flex gap-1">
                            {weeks.map((week, wi) => (
                                <div key={wi} className="flex flex-col gap-1">
                                    {week.map((cell) => (
                                        <div
                                            key={cell.date}
                                            className={`w-3 h-3 rounded-[3px] ${cell.inRange ? LEVEL_CLASSES[cell.level] : "bg-transparent"}`}
                                            title={cell.inRange ? `${cell.date}: ${cell.count} ${t("stats.cards")}` : undefined}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs font-medium text-muted-foreground">
                    <span>{t("stats.less")}</span>
                    <div className="flex gap-1">
                        {LEVEL_CLASSES.map((cls, i) => (
                            <div key={i} className={`w-3 h-3 rounded-[3px] ${cls}`} />
                        ))}
                    </div>
                    <span>{t("stats.more")}</span>
                </div>
            </div>

            {/* 30-day bar chart */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-base font-semibold mb-4">{t("stats.daily_chart")}</h2>
                <div className="flex items-end gap-1 h-36">
                    {dailyFilled.map((d) => (
                        <div
                            key={d.date}
                            className={`flex-1 rounded-t-sm transition-colors relative group min-w-[6px] ${d.cardsReviewed > 0 ? "bg-primary/40 hover:bg-primary" : "bg-muted"}`}
                            style={{ height: `${Math.max((d.cardsReviewed / maxDaily) * 100, 3)}%` }}
                            title={`${d.date}: ${d.cardsReviewed} ${t("stats.cards")}`}
                        >
                            <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground border border-border shadow-md text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap z-10">
                                {d.cardsReviewed}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-3 text-xs font-medium text-muted-foreground">
                    <span>{dailyFilled[0]?.date.slice(5)}</span>
                    <span>{dailyFilled[dailyFilled.length - 1]?.date.slice(5)}</span>
                </div>
            </div>

            {/* Deck mastery */}
            {deckStats.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-base font-semibold mb-6">{t("stats.deck_mastery")}</h2>
                    <div className="space-y-6">
                        {deckStats.map((ds) => (
                            <div key={ds.deckId}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold truncate">{ds.deckName}</span>
                                    <span className="text-xs font-medium shrink-0 ml-2 text-primary">{ds.masteryPercent}%</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                                    {ds.mature > 0 && <div className="bg-green-500 h-full" style={{ width: `${(ds.mature / Math.max(ds.total, 1)) * 100}%` }} />}
                                    {ds.learning > 0 && <div className="bg-orange-500 h-full" style={{ width: `${(ds.learning / Math.max(ds.total, 1)) * 100}%` }} />}
                                    {ds.new > 0 && <div className="bg-blue-500 h-full" style={{ width: `${(ds.new / Math.max(ds.total, 1)) * 100}%` }} />}
                                </div>
                                <div className="flex flex-wrap gap-4 mt-2 text-xs font-medium text-muted-foreground">
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> {ds.mature} {t("deck.stats.mature")}</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> {ds.learning} {t("deck.stats.learning")}</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> {ds.new} {t("deck.stats.new")}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Achievements */}
            <div className="bg-card border border-border rounded-xl p-6">
                <AchievementsBadges achievements={computeAchievements(overview, deckStats)} />
            </div>
        </div>
    );
}
