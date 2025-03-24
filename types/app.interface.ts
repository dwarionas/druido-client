

interface Card {
    id: string;
    question: string;
    answer: string;
    ef: number;  // easiness factor
    interval: number; // interval in days
    nextReview: Date; // next repetition date
    repCount: number;
}