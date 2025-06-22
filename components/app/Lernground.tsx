"use client";

import React from "react";
import { Rating } from "ts-fsrs";
import { useFSRS } from "@/hooks/useFSRS";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const cardClasses = "bg-muted/50 aspect-video rounded-xl";
const buttonClasses = "h-full w-full cursor-pointer";

export default function Lernground() {
    const [buttons, setButtons] = React.useState<Record<string, number>>({ "Знову": Rating.Again, "Тяжко": Rating.Hard, "Добре": Rating.Good, "Легко": Rating.Easy });
    const [resultOpen, setResultOpen] = React.useState(false);
    const { currentCard, rateCard, schedule } = useFSRS();
    
    React.useEffect(() => {
        // console.log(schedule);
    }, [schedule]);

    return (
        <div className="bg-background h-full">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />

                    <p className="text-gray-600 leading-tight">Current Deck</p>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <div className="text-center bg-muted/50 min-h-[50vh] flex-1 rounded-xl md:min-h-min">
                    {currentCard.question}
                </div>
                <div className="text-center bg-muted/50 min-h-[50vh] flex-1 rounded-xl md:min-h-min">
                    {resultOpen ?
                        currentCard.answer :
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
                                onClick={() => {
                                    rateCard(element[1]);
                                    setResultOpen(false);
                                }}
                            >
                                { element[0] }
                                <br/>
                                { schedule ? schedule[element[1]] : 0 }
                            </Button>
                        </div>
                    )) }
                </div>
            </div>
        </div>
    )
}