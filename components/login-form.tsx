"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
	const { login, register, error } = useAuth();
	const router = useRouter();
	const [mode, setMode] = React.useState<"login" | "register">("login");
	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [name, setName] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);
	const [formError, setFormError] = React.useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		setFormError(null);
		try {
			if (mode === "login") {
				await login(email, password);
			} else {
				await register(email, password, name || undefined);
			}

			const targetApp = typeof window !== "undefined" && window.location.hostname.endsWith("localhost") ? "/app" : "https://app.druido.com";

			router.push(targetApp);
		} catch (err) {
			setFormError("Authentication failed");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-xl">{mode === "login" ? "Welcome back" : "Create your Druido account"}</CardTitle>
					<CardDescription>
						{mode === "login" ? "Log in to continue your learning" : "Register with email and password to start using Druido"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="grid gap-6">
						<div className="grid gap-4">
							{mode === "register" && (
								<div className="grid gap-3">
									<Label htmlFor="name">Name</Label>
									<Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
								</div>
							)}
							<div className="grid gap-3">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="m@example.com"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
								/>
							</div>
							<div className="grid gap-3">
								<div className="flex items-center">
									<Label htmlFor="password">Password</Label>
								</div>
								<Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
							</div>
						</div>
						{(formError || error) && <p className="text-destructive text-sm">{formError || error}</p>}
						<Button type="submit" className="w-full" disabled={submitting}>
							{submitting ? (mode === "login" ? "Logging in..." : "Creating account...") : mode === "login" ? "Login" : "Sign up"}
						</Button>
						<div className="text-center text-sm">
							{mode === "login" ? "Don't have an account? " : "Already have an account? "}
							<button
								type="button"
								className="underline underline-offset-4"
								onClick={() => setMode(mode === "login" ? "register" : "login")}
							>
								{mode === "login" ? "Sign up" : "Log in"}
							</button>
						</div>
					</form>
				</CardContent>
			</Card>
			<div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
				By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
			</div>
		</div>
	);
}
