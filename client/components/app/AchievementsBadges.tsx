"use client";

import React from "react";
import { useI18n } from "@/lib/i18n";
import { Achievement } from "@/lib/achievements";
import { Lock } from "lucide-react";

interface Props {
    achievements: Achievement[];
}

export default function AchievementsBadges({ achievements }: Props) {
    const { t } = useI18n();
    const earned = achievements.filter((a) => a.earned);

    return (
        <div>
            <div className="flex items-center gap-2 mb-6">
                <h2 className="text-base font-semibold">{t("achievements.title")}</h2>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                    {earned.length}/{achievements.length}
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {achievements.map((a) => {
                    const Icon = a.earned ? a.icon : Lock;
                    return (
                        <div
                            key={a.id}
                            className={`flex flex-col items-center justify-center text-center p-4 rounded-xl border ${a.earned
                                ? "bg-card border-border"
                                : "bg-muted/30 border-dashed border-border opacity-60"
                                }`}
                        >
                            <Icon className={`h-6 w-6 mb-2 ${a.earned ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="text-xs font-semibold leading-tight mb-1">{t(a.titleKey)}</span>
                            <span className="text-[10px] text-muted-foreground leading-tight">{t(a.descKey)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
