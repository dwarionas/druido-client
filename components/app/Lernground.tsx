"use client";

import React from "react";
import { Rating } from "ts-fsrs";
import { useFSRS } from "@/hooks/useFSRS";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
	deckId: string;
	version?: number;
}

export default function Lernground({ deckId, version = 0 }: Props) {
	const [buttons] = React.useState<Record<string, Rating>>({
		Знову: Rating.Again,
		Тяжко: Rating.Hard,
		Добре: Rating.Good,
		Легко: Rating.Easy,
	});
	const [revealed, setRevealed] = React.useState(false);
	const { currentCard, rateCard, schedule, loading, hasCards, totalCards, currentIndex } = useFSRS(deckId, version);

	const ratingStyles: Partial<Record<Rating, string>> = {
		[Rating.Again]: "border-destructive/40 bg-destructive/5 text-destructive hover:bg-destructive/10",
		[Rating.Hard]: "border-amber-300/70 bg-amber-50 text-amber-900 hover:bg-amber-100",
		[Rating.Good]: "border-emerald-300/70 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
		[Rating.Easy]: "border-sky-300/70 bg-sky-50 text-sky-900 hover:bg-sky-100",
	};

	const baseButtonClasses =
		"flex flex-col items-center justify-center gap-1 py-2 text-xs border transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

	if (loading) {
		return <p className="text-muted-foreground">Завантаження карток цієї колоди...</p>;
	}

	if (!hasCards || !currentCard) {
		return <p className="text-muted-foreground">У цій колоді ще немає карток для повторення.</p>;
	}

	const currentNumber = currentIndex + 1;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium">
					Карта {currentNumber} з {totalCards}
				</span>
				<span className="hidden sm:inline">Спочатку подивись відповідь, потім оціни картку.</span>
			</div>

			<div className="space-y-2 rounded-md border bg-muted/40 p-4">
				<div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Питання</div>
				<div className="rounded-sm bg-background/80 px-3 py-2 text-sm leading-relaxed md:text-base">{currentCard.question}</div>
			</div>

			<div
				className={cn("space-y-3 rounded-md border bg-muted/40 p-4", !revealed && "cursor-pointer hover:bg-muted/60")}
				onClick={() => {
					if (!revealed) setRevealed(true);
				}}
			>
				<div className="flex items-center justify-between gap-2">
					<span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Відповідь</span>
				</div>
				{revealed ? (
					<div className="rounded-sm bg-background/80 px-3 py-2 text-sm leading-relaxed md:text-base">{currentCard.answer}</div>
				) : (
					<p className="text-xs text-muted-foreground">
						Натисни на цю картку, щоб побачити відповідь, а потім обери, наскільки вона була важкою.
					</p>
				)}
			</div>

			<div className="grid gap-2 md:grid-cols-4">
				{Object.entries(buttons).map(([label, rating]) => (
					<Button
						key={label}
						type="button"
						variant="outline"
						size="sm"
						className={cn(baseButtonClasses, ratingStyles[rating])}
						disabled={!revealed}
						onClick={() => {
							void rateCard(rating);
							setRevealed(false);
						}}
					>
						<span className="font-medium">{label}</span>
						{schedule && schedule[rating] && <span className="text-[10px] text-muted-foreground">через {schedule[rating]}</span>}
					</Button>
				))}
			</div>
		</div>
	);
}
