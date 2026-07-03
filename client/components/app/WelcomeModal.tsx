"use client";

import React from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { FolderPlus, Layers, Brain } from "lucide-react";

interface Props {
    onDismiss: () => void;
}

const STEPS = [
    { icon: FolderPlus, titleKey: "onboarding.step1.title", descKey: "onboarding.step1.desc" },
    { icon: Layers, titleKey: "onboarding.step2.title", descKey: "onboarding.step2.desc" },
    { icon: Brain, titleKey: "onboarding.step3.title", descKey: "onboarding.step3.desc" },
];

export default function WelcomeModal({ onDismiss }: Props) {
    const { t } = useI18n();
    const [step, setStep] = React.useState(0);

    const current = STEPS[step];
    const Icon = current.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-xl shadow-lg max-w-md w-full p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-6">
                    <Icon className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold tracking-tight mb-3">{t(current.titleKey)}</h2>
                <p className="text-sm text-muted-foreground mb-8">{t(current.descKey)}</p>

                {/* Step indicators */}
                <div className="flex justify-center gap-2 mb-8">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"}`}
                        />
                    ))}
                </div>

                <div className="flex gap-3 justify-center">
                    {step < STEPS.length - 1 ? (
                        <>
                            <Button variant="outline" onClick={onDismiss}>
                                {t("onboarding.skip")}
                            </Button>
                            <Button onClick={() => setStep(step + 1)}>
                                {t("onboarding.next")}
                            </Button>
                        </>
                    ) : (
                        <Button className="px-8" onClick={onDismiss}>
                            {t("onboarding.start")}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
