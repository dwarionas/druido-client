"use client"

import React from "react";
import {
    createEmptyCard,
    formatDate,
    fsrs,
    generatorParameters,
    Rating,
    Card,
    IPreview
} from 'ts-fsrs';

import * as json from '@/sample.json'
import humanize from "@/lib/time-converter";

interface CardState extends Card {
    id: number;
    question: string;
    answer: string;
}

type Schedule = Partial<Record<Rating, string>>;

const FSRS_PARAMS = generatorParameters({
    request_retention: 0.9,
    maximum_interval: 420,
    w: [
        1, 1, 1, 1, 4.93,
        0.94, 0.86, 0.01, 1.49, 0.14,
        0.94, 2.18, 0.05, 0.34, 4.2,
        0.2, 1.41, 1.45, 0.5
    ],
    enable_fuzz: false,
    enable_short_term: true,
});

const f = fsrs(FSRS_PARAMS);

const convertTime = (date: string | Date): string => {
    const seconds = (new Date(date).getTime() - Date.now()) / 1000;
    return humanize(Math.ceil(seconds));
};

const createInitialCards = (): CardState[] => {
    return json.cards.map((card, index) => ({
        ...createEmptyCard(Date.now()),
        id: index,
        question: card.question,
        answer: card.answer,
    }));
};

export function useFSRS() {
    const [currentCardIndex, setCurrentCardIndex] = React.useState(0);
    const [cards, setCards] = React.useState<CardState[]>(createInitialCards());
    const [schedule, setSchedule] = React.useState<Schedule>({});

    const computeSchedule = (preview: IPreview) => {
        const newSchedule: Schedule = {};

        (Object.keys(Rating) as Array<keyof typeof Rating>).forEach((key) => {
            const rating = Rating[key];
            if (preview[rating]) {
                const dueDate = new Date(preview[rating].card.due);
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

    const rateCard = (rating: Rating) => {
        setCards(prevCards => {
            const state = [...prevCards];

            const currentCard = state[currentCardIndex];
            
            console.log('Previous interval:', currentCard.elapsed_days);
            
            const updatedCard = updateCard(currentCard, rating);
            
            console.log('New interval:', updatedCard.elapsed_days);
            console.log('New due date:', new Date(updatedCard.due).toLocaleString());
            
            state[currentCardIndex] = updatedCard;

            setCurrentCardIndex(prevIndex => {
                const nextIndex = prevIndex + 1;
                return nextIndex >= state.length ? 0 : nextIndex;
            });

            return state;
        });
    };

    React.useEffect(() => {
        const currentCard = cards[currentCardIndex];
        const preview = f.repeat(currentCard, new Date());
        computeSchedule(preview);
    }, [cards, currentCardIndex]);

    return {
        currentCard: cards[currentCardIndex],
        rateCard,
        schedule,
    };
}