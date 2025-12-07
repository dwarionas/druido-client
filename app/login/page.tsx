"use client";

import { GalleryVerticalEnd } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import { LanguageSwitcher, useI18n } from "@/lib/i18n";

function LoginHeader() {
	const { t } = useI18n();
	return (
		<div className="flex flex-col gap-2">
			<a href="#" className="flex items-center gap-2 font-medium">
				<div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
					<GalleryVerticalEnd className="size-4" />
				</div>
				<span>Druido</span>
			</a>
			<p className="text-xs text-muted-foreground">{t("login.subtitle")}</p>
		</div>
	);
}

export default function LoginPage() {
	return (
		<div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<div className="flex items-center justify-between">
					<LoginHeader />
					<LanguageSwitcher />
				</div>
				<LoginForm />
			</div>
		</div>
	);
}
