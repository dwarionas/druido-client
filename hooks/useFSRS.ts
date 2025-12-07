"use client";

import React from "react";
import { createEmptyCard, formatDate, fsrs, generatorParameters, Rating, Card, IPreview } from "ts-fsrs";

import humanize from "@/lib/time-converter";
import { cardsApi, Card as ApiCard } from "@/lib/decks-api";

interface CardState extends Card {
	backendId: string;
	question: string;
	answer: string;
}

export type Schedule = Partial<Record<Rating, string>>;

const FSRS_PARAMS = generatorParameters({
	request_retention: 0.9,
	maximum_interval: 420,
	w: [1, 1, 1, 1, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 4.2, 0.2, 1.41, 1.45, 0.5],
	enable_fuzz: false,
	enable_short_term: true,
});

const f = fsrs(FSRS_PARAMS);

const convertTime = (date: string | Date): string => {
	const seconds = (new Date(date).getTime() - Date.now()) / 1000;
	return humanize(Math.ceil(seconds));
};

function mapApiCardToState(apiCard: ApiCard): CardState {
	if (apiCard.fsrsState) {
		const base = createEmptyCard(Date.now());
		return {
			...base,
			...apiCard.fsrsState,
			backendId: apiCard.id,
			question: apiCard.question,
			answer: apiCard.answer,
			due: new Date(apiCard.fsrsState.due),
		};
	}

	const base = createEmptyCard(Date.now());
	return {
		...base,
		backendId: apiCard.id,
		question: apiCard.question,
		answer: apiCard.answer,
	};
}

export function useFSRS(deckId: string | undefined, version: number = 0) {
	const [currentCardIndex, setCurrentCardIndex] = React.useState(0);
	const [cards, setCards] = React.useState<CardState[]>([]);
	const [schedule, setSchedule] = React.useState<Schedule>({});
	const [loading, setLoading] = React.useState(false);

	React.useEffect(() => {
		if (!deckId) return;

		async function load() {
			setLoading(true);
			try {
				const apiCards = await cardsApi.list({ deckId });
				setCards(apiCards.map(mapApiCardToState));
				setCurrentCardIndex(0);
			} finally {
				setLoading(false);
			}
		}

		void load();
	}, [deckId, version]);

	const computeSchedule = (preview: IPreview) => {
		const newSchedule: Schedule = {};

		(Object.keys(Rating) as Array<keyof typeof Rating>).forEach((key) => {
			const rating = Rating[key];
			const entry = preview[rating];
			if (entry) {
				const dueDate = new Date(entry.card.due);
				newSchedule[rating] = convertTime(dueDate);
			}
		});

		setSchedule(newSchedule);
	};

	const updateCard = (card: CardState, rating: Rating) => {
		const scheduleDate = formatDate(new Date(card.due));
		const newState = f.repeat(card, scheduleDate);

		return { ...card, ...newState[rating].card };
	};

	const rateCard = async (rating: Rating) => {
		if (!cards.length) return;

		const currentCard = cards[currentCardIndex];
		const updatedCard = updateCard(currentCard, rating);

		setCards((prev) => {
			const copy = [...prev];
			copy[currentCardIndex] = updatedCard;
			return copy;
		});

		// Persist FSRS state to backend.
		// If there is no backend id (e.g. seed/sample cards), skip persistence.
		if (currentCard.backendId) {
			// If the API is unavailable, swallow the error so the learning UI still works.
			try {
				await cardsApi.update(currentCard.backendId, {
					fsrsState: {
						stability: updatedCard.stability,
						difficulty: updatedCard.difficulty,
						elapsed_days: updatedCard.elapsed_days,
						scheduled_days: updatedCard.scheduled_days,
						reps: updatedCard.reps,
						lapses: updatedCard.lapses,
						state: String(updatedCard.state),
						due: updatedCard.due,
						lastReviewedAt: new Date(),
					},
				});
			} catch (error) {
				console.error("Failed to persist FSRS state", error);
			}
		}

		setCurrentCardIndex((prevIndex) => {
			const next = prevIndex + 1;
			return next >= cards.length ? 0 : next;
		});
	};

	React.useEffect(() => {
		if (!cards.length) return;
		const currentCard = cards[currentCardIndex];
		const preview = f.repeat(currentCard, new Date());
		computeSchedule(preview);
	}, [cards, currentCardIndex]);

	return {
		loading,
		hasCards: cards.length > 0,
		currentCard: cards[currentCardIndex],
		totalCards: cards.length,
		currentIndex: currentCardIndex,
		rateCard,
		schedule,
	};
}
