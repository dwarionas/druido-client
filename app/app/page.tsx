"use client";

import React from "react";
import convert from "@/lib/time-converter";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button"

import * as json from '@/sample.json'

const cardClasses = "bg-muted/50 aspect-video rounded-xl";
const buttonClasses = "h-full w-full cursor-pointer";

export default function AppPage() {
    const initialButtonsValue = {"Знову": 60, "Тяжко": 6*60, "Добре": 10*60, "Легко": 24*60*60*4}
    const [buttons, setButtons] = React.useState<Record<string, number>>(initialButtonsValue)

    const [resultOpen, setResultOpen] = React.useState<boolean>(false)
    const [cards, setCards] = React.useState(json.cards);
    const [currentCardID, setCurrentCard] = React.useState<number>(0);

    const updateButtons = (newInterval: number) => {


        setButtons({
            "Знову": 60, // Завжди 60 сек
            "Тяжко": Math.round(newInterval * 0.5),
            "Добре": Math.round(newInterval * 1.2),
            "Легко": Math.round(newInterval * 2.5),
        });
    };

    const changeCardState = (ans: [string, number]) => {
        const ratingMap: Record<string, number> = {
            "Знову": 0,
            "Тяжко": 2,
            "Добре": 4,
            "Легко": 5
        };

        const rating = ratingMap[ans[0]];

        let newInterval: number;

        if (!cards[currentCardID].interval) { // checking for the first repetition
            newInterval = ans[1];

            cards[currentCardID] = {
                ...cards[currentCardID],
                interval: newInterval,
            };
        } else {
            const prevEf = cards[currentCardID].ef;
            const prevInterval = cards[currentCardID].interval;
            const newEf = Math.max(1.3, prevEf + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)));
            newInterval = prevInterval * newEf;

            cards[currentCardID] = {
                ...cards[currentCardID],
                ef: newEf,
                interval: newInterval,
            };
        }


        updateButtons(newInterval);
        // setCurrentCard(prev => prev + 1);
        // setButtons(initialButtonsValue)
    }

    return (
        <SidebarInset className="bg-background h-full rounded-xl">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4"
                />

                <p className="text-gray-600 leading-tight">Current Deck</p>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <div className="text-center bg-muted/50 min-h-[50vh] flex-1 rounded-xl md:min-h-min">
                    {cards[currentCardID].question}
                </div>
                <div className="text-center bg-muted/50 min-h-[50vh] flex-1 rounded-xl md:min-h-min">
                    {resultOpen ?
                    cards[currentCardID].answer :
                        <Button
                            variant="default"
                            className={ buttonClasses }
                            onClick={() => setResultOpen(true)}
                        >
                            Показати
                        </Button>}
                </div>

                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                    { Object.entries(buttons).map((element) => (
                        <div key={ element[0] } className={ cardClasses }>
                            <Button
                                variant="ghost"
                                className={ buttonClasses }
                                onClick={() => changeCardState(element)}
                            >
                                { element[0] }
                                <br/>
                                { convert(element[1]) }
                            </Button>
                        </div>
                  )) }
              </div>
            </div>
        </SidebarInset>
    )
}