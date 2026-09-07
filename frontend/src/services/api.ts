import type { Account, AccountType, Budget, Category, RecurrenceFrequency, RecurringTransaction, Transaction } from "../types";

const API_ROOT = import.meta.env.VITE_API_URL ?? "";
const BASE_URL = `${API_ROOT}/api`;
const TOKEN_KEY = "miapp_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage may be unavailable (private mode, etc.) — session just won't persist.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // no-op
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("miapp:unauthorized"));
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status} en ${path}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_ROOT}/health`);
  if (!res.ok) throw new Error(`Error ${res.status} en /health`);
  return res.json();
}

export const authApi = {
  login: async (username: string, password: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "No se pudo iniciar sesión");
    setToken(body.token);
  },
  logout: () => clearToken(),
};

export const accountsApi = {
  list: () => request<Account[]>("/accounts"),
  create: (data: { name: string; type: AccountType; initialBalance?: number }) =>
    request<Account>("/accounts", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name: string; type: AccountType; initialBalance?: number }) =>
    request<Account>(`/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/accounts/${id}`, { method: "DELETE" }),
};

export const categoriesApi = {
  list: () => request<Category[]>("/categories"),
  create: (data: { name: string; type: "INCOME" | "EXPENSE" }) =>
    request<Category>("/categories", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name: string; type: "INCOME" | "EXPENSE" }) =>
    request<Category>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/categories/${id}`, { method: "DELETE" }),
};

export const transactionsApi = {
  list: (params?: { accountId?: string; categoryId?: string; month?: number; year?: number }) => {
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return request<Transaction[]>(`/transactions${qs}`);
  },
  create: (data: {
    amount: number;
    type: "INCOME" | "EXPENSE";
    description?: string;
    date?: string;
    accountId: string;
    categoryId: string;
  }) => request<Transaction>("/transactions", { method: "POST", body: JSON.stringify(data) }),
  update: (
    id: string,
    data: {
      amount: number;
      type: "INCOME" | "EXPENSE";
      description?: string;
      date?: string;
      accountId: string;
      categoryId: string;
    }
  ) => request<Transaction>(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/transactions/${id}`, { method: "DELETE" }),
};

export const recurringTransactionsApi = {
  list: (params?: { accountId?: string; categoryId?: string; active?: boolean }) => {
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return request<RecurringTransaction[]>(`/recurring-transactions${qs}`);
  },
  create: (data: {
    amount: number;
    type: "INCOME" | "EXPENSE";
    description?: string;
    accountId: string;
    categoryId: string;
    frequency: RecurrenceFrequency;
    interval?: number;
    startDate: string;
    endDate?: string;
  }) => request<RecurringTransaction>("/recurring-transactions", { method: "POST", body: JSON.stringify(data) }),
  update: (
    id: string,
    data: {
      amount: number;
      type: "INCOME" | "EXPENSE";
      description?: string;
      accountId: string;
      categoryId: string;
      frequency: RecurrenceFrequency;
      interval?: number;
      startDate?: string;
      endDate?: string | null;
      active?: boolean;
    }
  ) => request<RecurringTransaction>(`/recurring-transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/recurring-transactions/${id}`, { method: "DELETE" }),
};

export const budgetsApi = {
  list: (params?: { month?: number; year?: number }) => {
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return request<Budget[]>(`/budgets${qs}`);
  },
  create: (data: { amount: number; month: number; year: number; categoryId: string }) =>
    request<Budget>("/budgets", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { amount: number; month: number; year: number; categoryId: string }) =>
    request<Budget>(`/budgets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/budgets/${id}`, { method: "DELETE" }),
};
