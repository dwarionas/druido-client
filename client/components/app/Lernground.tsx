"use client";

import React from "react";
import { useFSRS } from "@/hooks/useFSRS";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { CheckCircle2 } from "lucide-react";

interface Props {
	deckId?: string;
	version?: number;
}

const RATING_BUTTONS = [
	{ labelKey: "deck.review.again", rating: 1 },
	{ labelKey: "deck.review.hard", rating: 2 },
	{ labelKey: "deck.review.good", rating: 3 },
	{ labelKey: "deck.review.easy", rating: 4 },
] as const;

const ratingStyles: Record<number, string> = {
	1: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50",
	2: "border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-orange-900/50",
	3: "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-900/50",
	4: "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-900/50",
};

const baseButtonClasses =
	"flex flex-col items-center justify-center gap-0.5 py-3 h-auto text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export default function Lernground({ deckId, version }: Props) {
	const [flipped, setFlipped] = React.useState(false);
	const [rating, setRating] = React.useState(false);
	const { currentCard, rateCard, schedule, loading, finished, totalCards, currentIndex } = useFSRS(deckId, version);
	const { t } = useI18n();

	// reset flip when card changes
	React.useEffect(() => {
		setFlipped(false);
	}, [currentCard?.id]);

	if (loading) {
		return (
			<div className="space-y-3 animate-pulse">
				<div className="h-4 w-32 bg-muted rounded-md" />
				<div className="h-24 bg-muted rounded-xl" />
				<div className="h-20 bg-muted rounded-xl" />
			</div>
		);
	}

	if (finished || !currentCard) {
		return (
			<div className="text-center space-y-3 py-16">
				<CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
				<h2 className="text-xl font-bold tracking-tight">{t("deck.review.done_title")}</h2>
				<p className="text-sm text-muted-foreground px-4">{t("deck.review.empty")}</p>
			</div>
		);
	}

	const currentNumber = currentIndex + 1;
	const progress = totalCards > 0 ? (currentNumber / totalCards) * 100 : 0;

	async function handleRate(r: number) {
		setRating(true);
		try {
			await rateCard(r);
		} finally {
			setRating(false);
		}
	}

	return (
		<div className="space-y-5">
			{/* progress */}
			<div className="space-y-2">
				<div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
					<span>{currentNumber} / {totalCards}</span>
					<span className="hidden sm:inline">{t("deck.review.hint")}</span>
				</div>
				<div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
					<div
						className="h-full bg-primary transition-all duration-500 rounded-full"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</div>

			{/* card with flip */}
			<div
				className="w-full relative cursor-pointer h-[280px] md:h-[360px]"
				style={{ perspective: "1000px" }}
				onClick={() => setFlipped(!flipped)}
			>
				<div
					className={cn(
						"absolute inset-0 w-full h-full transition-all duration-500",
						flipped ? "[transform:rotateY(180deg)]" : ""
					)}
					style={{ transformStyle: "preserve-3d" }}
				>
					{/* front */}
					<div
						className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-center bg-card border border-border rounded-xl p-6 md:p-10"
						style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
					>
						<div className="absolute top-5 left-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("deck.detail.question")}</div>
						<div className="text-2xl md:text-3xl font-semibold leading-tight max-w-2xl">{currentCard.question}</div>
						<p className="absolute bottom-5 text-xs text-muted-foreground">{t("deck.review.flip")}</p>
					</div>

					{/* back */}
					<div
						className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-center bg-muted border border-border rounded-xl p-6 md:p-10"
						style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
					>
						<div className="absolute top-5 left-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("deck.detail.answer")}</div>
						<div className="text-xl md:text-2xl font-medium leading-relaxed max-w-2xl">{currentCard.answer}</div>
					</div>
				</div>
			</div>

			{/* rating buttons */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
				{RATING_BUTTONS.map(({ labelKey, rating: r }) => (
					<Button
						key={r}
						type="button"
						variant="ghost"
						className={cn(baseButtonClasses, ratingStyles[r])}
						disabled={!flipped || rating}
						onClick={() => handleRate(r)}
					>
						<span className="font-semibold text-sm">{t(labelKey)}</span>
						{schedule[r] && <span className="text-xs font-medium opacity-80">{schedule[r]}</span>}
					</Button>
				))}
			</div>
		</div>
	);
}
