import type { Account, AccountType, Budget, Category, RecurrenceFrequency, RecurringTransaction, Transaction } from "../types";

const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status} en ${path}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch("/health");
  if (!res.ok) throw new Error(`Error ${res.status} en /health`);
  return res.json();
}

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
