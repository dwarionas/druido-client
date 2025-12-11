function getApiBaseUrl(): string {
	if (typeof window !== "undefined" && window.location.hostname === "localhost") {
		return "http://localhost:4000";
	}
	return process.env.NEXT_PUBLIC_API_URL || "https://druido-server.vercel.app";
}

export interface ApiError {
	message: string;
	status: number;
	errors?: unknown;
}

async function request<T>(path: string, options: RequestInit & { parseJson?: boolean } = {}): Promise<T> {
	const { parseJson = true, ...init } = options;

	const token = typeof window !== "undefined" ? window.localStorage.getItem("druido_token") : null;

	const res = await fetch(`${getApiBaseUrl()}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...(init.headers || {}),
		},
		credentials: "include",
	});

	if (!parseJson) {
		return res as T;
	}

	const data = await res.json().catch(() => null);

	if (!res.ok) {
		const error: ApiError = {
			message: (data && (data.message as string)) || "Request failed",
			status: res.status,
			errors: data?.errors,
		};
		throw error;
	}

	return data as T;
}

export const apiClient = {
	get: <T>(path: string) => request<T>(path, { method: "GET" }),
	post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
	patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
	delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
