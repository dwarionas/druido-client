"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import React from "react";

interface Props {
    size?: "default" | "lg";
    className?: string;
}

export function CallToActionButton({ size = "default", className }: Props) {
    const { user, loading, refreshUser } = useAuth();
    const { t } = useI18n();
    const router = useRouter();
    const [starting, setStarting] = React.useState(false);

    async function handleTryDemo() {
        setStarting(true);
        try {
            await api.post("/auth/demo");
            await refreshUser();
            router.push("/app");
        } catch {
            setStarting(false);
        }
    }

    if (!loading && user) {
        return (
            <Button size={size} className={className} asChild>
                <Link href="/app">{t("header.app")}</Link>
            </Button>
        );
    }

    return (
        <Button size={size} className={className} onClick={handleTryDemo} disabled={starting || loading}>
            {starting ? t("demo.loading") : t("landing.cta")}
        </Button>
    );
}
