"use client";

import React from "react";
import { apiClient, ApiError } from "@/lib/api-client";

export interface AuthUser {
	id: string;
	email: string;
	name?: string;
	token?: string;
}

interface AuthContextValue {
	user: AuthUser | null;
	loading: boolean;
	error: string | null;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string, name?: string) => Promise<void>;
	logout: () => Promise<void>;
	refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = React.useState<AuthUser | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	const fetchMe = React.useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await apiClient.get<AuthUser>("/auth/me");
			setUser(data);
		} catch (err) {
			setUser(null);
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		void fetchMe();
	}, [fetchMe]);

	const login = React.useCallback(async (email: string, password: string) => {
		setError(null);
		try {
			const data = await apiClient.post<AuthUser>("/auth/login", { email, password });
			if (data.token) {
				if (typeof window !== "undefined") {
					window.localStorage.setItem("druido_token", data.token);
				}
			}
			setUser(data);
		} catch (err) {
			const e = err as ApiError;
			setError(e.message || "Login failed");
			throw err;
		}
	}, []);

	const register = React.useCallback(async (email: string, password: string, name?: string) => {
		setError(null);
		try {
			const data = await apiClient.post<AuthUser>("/auth/register", { email, password, name });
			if (data.token) {
				if (typeof window !== "undefined") {
					window.localStorage.setItem("druido_token", data.token);
				}
			}
			setUser(data);
		} catch (err) {
			const e = err as ApiError;
			setError(e.message || "Registration failed");
			throw err;
		}
	}, []);

	const logout = React.useCallback(async () => {
		setError(null);
		try {
			await apiClient.post<unknown>("/auth/logout", {});
		} catch (err) {
			const e = err as ApiError;
			setError(e.message || "Logout failed");
			// Навіть якщо бекенд не зміг логаутнути, на клієнті все одно чистимо стан
		} finally {
			if (typeof window !== "undefined") {
				window.localStorage.removeItem("druido_token");
			}
			setUser(null);
		}
	}, []);

	const refreshUser = React.useCallback(fetchMe, [fetchMe]);

	const value: AuthContextValue = {
		user,
		loading,
		error,
		login,
		register,
		logout,
		refreshUser,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const ctx = React.useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return ctx;
}
