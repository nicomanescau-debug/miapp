export type TransactionType = "INCOME" | "EXPENSE";
export type AccountType = "BANK" | "CASH" | "CARD" | "OTHER";
export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  date: string;
  accountId: string;
  categoryId: string;
  createdAt: string;
  account?: Account;
  category?: Category;
}

export interface RecurringTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  accountId: string;
  categoryId: string;
  frequency: RecurrenceFrequency;
  interval: number;
  startDate: string;
  endDate: string | null;
  nextRunDate: string;
  active: boolean;
  createdAt: string;
  account?: Account;
  category?: Category;
}

export interface Budget {
  id: string;
  amount: number;
  month: number;
  year: number;
  categoryId: string;
  category?: Category;
}
