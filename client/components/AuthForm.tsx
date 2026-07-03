"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
	mode: "login" | "register";
}

export function AuthForm({ mode }: Props) {
	const { login, register, user, loading, refreshUser } = useAuth();
	const { t } = useI18n();
	const router = useRouter();

	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [name, setName] = React.useState("");
	const [error, setError] = React.useState<string | null>(null);
	const [submitting, setSubmitting] = React.useState(false);
	const [startingDemo, setStartingDemo] = React.useState(false);

	// already logged in — go straight to the app (demo users may want a real account)
	React.useEffect(() => {
		if (!loading && user && !user.isDemo) router.replace("/app");
	}, [loading, user, router]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSubmitting(true);
		try {
			if (mode === "login") {
				await login(email, password);
			} else {
				await register(email, password, name.trim() || undefined);
			}
			router.push("/app");
		} catch {
			setError(mode === "login" ? t("login.error") : t("register.error"));
			setSubmitting(false);
		}
	}

	async function handleTryDemo() {
		setStartingDemo(true);
		try {
			await api.post("/auth/demo");
			await refreshUser();
			router.push("/app");
		} catch {
			setStartingDemo(false);
		}
	}

	const isLogin = mode === "login";

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
			<Link href="/" className="flex items-center gap-2 font-semibold mb-8">
				<div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
					D
				</div>
				<span className="text-lg tracking-tight">Druido</span>
			</Link>

			<div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8">
				<h1 className="text-xl font-semibold tracking-tight mb-1">
					{isLogin ? t("login.title") : t("register.title")}
				</h1>
				<p className="text-sm text-muted-foreground mb-6">
					{isLogin ? t("login.subtitle") : t("register.subtitle")}
				</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					{!isLogin && (
						<div className="space-y-2">
							<Label htmlFor="name">{t("profile.name")}</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								autoComplete="name"
								maxLength={100}
							/>
						</div>
					)}
					<div className="space-y-2">
						<Label htmlFor="email">{t("login.email")}</Label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							autoComplete="email"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">{t("login.password")}</Label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete={isLogin ? "current-password" : "new-password"}
							minLength={isLogin ? 1 : 6}
							maxLength={72}
							required
						/>
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}

					<Button type="submit" className="w-full" disabled={submitting}>
						{submitting ? "..." : isLogin ? t("login.action.login") : t("login.action.register")}
					</Button>
				</form>

				<div className="flex items-center gap-3 my-5">
					<div className="h-px flex-1 bg-border" />
					<span className="text-xs text-muted-foreground">{t("login.or")}</span>
					<div className="h-px flex-1 bg-border" />
				</div>

				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={handleTryDemo}
					disabled={startingDemo}
				>
					{startingDemo ? t("demo.loading") : t("landing.cta")}
				</Button>
			</div>

			<Link
				href={isLogin ? "/register" : "/login"}
				className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
			>
				{isLogin ? t("login.switch.register") : t("login.switch.login")}
			</Link>
		</div>
	);
}
