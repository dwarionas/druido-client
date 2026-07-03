"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
    const { t } = useI18n();

    return (
        <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 bg-background text-center">
            <div className="animate-fade-in-up">
                <p className="text-6xl font-bold text-primary mb-6">404</p>
                <h1 className="text-2xl font-semibold text-foreground mb-3">{t("404.title")}</h1>
                <p className="text-muted-foreground mb-8 max-w-md">{t("404.desc")}</p>
                <Link
                    href="/"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium px-6 py-2.5 transition-colors inline-flex items-center"
                >
                    {t("404.back")}
                </Link>
            </div>
        </div>
    );
}
