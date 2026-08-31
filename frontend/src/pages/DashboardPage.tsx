import { useEffect, useState } from "react";
import BarChart from "../components/BarChart";
import DonutChart from "../components/DonutChart";
import { accountsApi, budgetsApi, categoriesApi, transactionsApi } from "../services/api";
import type { Budget, Transaction } from "../types";
import { colorForIndex } from "../utils/chartColors";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function currentMonth() {
  return new Date().getMonth() + 1;
}

function currentYear() {
  return new Date().getFullYear();
}

function DeltaCell({
  current,
  previous,
  higherIsGood,
}: {
  current: number;
  previous: number;
  higherIsGood: boolean;
}) {
  const diff = Math.round((current - previous) * 100) / 100;
  if (diff === 0) {
    return <span className="delta delta-flat">Sin cambios</span>;
  }
  const isUp = diff > 0;
  const sign = isUp ? "+" : "-";
  const pct = previous !== 0 ? Math.round(Math.abs(diff / previous) * 100) : null;
  const good = higherIsGood ? isUp : !isUp;
  return (
    <span className={`delta ${good ? "delta-good" : "delta-bad"}`}>
      {isUp ? "▲" : "▼"} {sign}
      {Math.abs(diff).toFixed(2)} €{pct !== null ? ` (${sign}${pct}%)` : ""}
    </span>
  );
}

export default function DashboardPage() {
  const [accountCount, setAccountCount] = useState<number | null>(null);
  const [categoryCount, setCategoryCount] = useState<number | null>(null);
  const [transactionCount, setTransactionCount] = useState<number | null>(null);
  const [budgets, setBudgets] = useState<Budget[] | null>(null);
  const [monthTransactions, setMonthTransactions] = useState<Transaction[] | null>(null);
  const [prevMonthTransactions, setPrevMonthTransactions] = useState<Transaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const month = currentMonth();
  const year = currentYear();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  useEffect(() => {
    Promise.all([
      accountsApi.list(),
      categoriesApi.list(),
      transactionsApi.list(),
      budgetsApi.list({ month, year }),
      transactionsApi.list({ month, year }),
      transactionsApi.list({ month: prevMonth, year: prevYear }),
    ])
      .then(([accounts, categories, transactions, monthBudgets, txThisMonth, txPrevMonth]) => {
        setAccountCount(accounts.length);
        setCategoryCount(categories.length);
        setTransactionCount(transactions.length);
        setBudgets(monthBudgets);
        setMonthTransactions(txThisMonth);
        setPrevMonthTransactions(txPrevMonth);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar el resumen"));
  }, [month, year, prevMonth, prevYear]);

  const budgetedCategoryIds = new Set((budgets ?? []).map((b) => b.categoryId));
  const totalBudget = (budgets ?? []).reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = (monthTransactions ?? [])
    .filter((t) => t.type === "EXPENSE" && budgetedCategoryIds.has(t.categoryId))
    .reduce((sum, t) => sum + t.amount, 0);
  const available = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const hasBudgets = (budgets?.length ?? 0) > 0;

  const BUDGET_WARN_RATIO = 0.8;
  type AlertStatus = "warn" | "over";

  const overallAlertStatus: AlertStatus | null =
    totalBudget <= 0
      ? null
      : totalSpent / totalBudget >= 1
        ? "over"
        : totalSpent / totalBudget >= BUDGET_WARN_RATIO
          ? "warn"
          : null;

  const categoryBudgetAlerts = (budgets ?? [])
    .map((b) => {
      const spent = (monthTransactions ?? [])
        .filter((t) => t.type === "EXPENSE" && t.categoryId === b.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);
      const ratio = b.amount > 0 ? spent / b.amount : 0;
      const status: AlertStatus | null =
        ratio >= 1 ? "over" : ratio >= BUDGET_WARN_RATIO ? "warn" : null;
      return {
        categoryId: b.categoryId,
        name: b.category?.name ?? "Sin categoría",
        budget: b.amount,
        spent,
        percent: Math.round(ratio * 100),
        status,
      };
    })
    .filter((a): a is typeof a & { status: AlertStatus } => a.status !== null)
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "over" ? -1 : 1;
      return b.percent - a.percent;
    });

  const monthIncome = (monthTransactions ?? [])
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = (monthTransactions ?? [])
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const prevIncome = (prevMonthTransactions ?? [])
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
  const prevExpense = (prevMonthTransactions ?? [])
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);
  const prevMonthName = MONTH_NAMES[prevMonth - 1];

  const expenseByCategory = new Map<string, number>();
  (monthTransactions ?? [])
    .filter((t) => t.type === "EXPENSE")
    .forEach((t) => {
      const label = t.category?.name ?? "Sin categoría";
      expenseByCategory.set(label, (expenseByCategory.get(label) ?? 0) + t.amount);
    });
  const sortedExpenses = [...expenseByCategory.entries()].sort((a, b) => b[1] - a[1]);
  const TOP_CATEGORIES = 6;
  const topExpenses = sortedExpenses.slice(0, TOP_CATEGORIES);
  const otherExpensesTotal = sortedExpenses
    .slice(TOP_CATEGORIES)
    .reduce((sum, [, value]) => sum + value, 0);
  const expenseSegments = [
    ...topExpenses.map(([label, value], i) => ({ label, value, color: colorForIndex(i) })),
    ...(otherExpensesTotal > 0
      ? [{ label: "Otros", value: otherExpensesTotal, color: "var(--border)" }]
      : []),
  ];

  // ── ¿Cómo voy este mes? ──────────────────────────────────────────────
  const monthAvailable = monthIncome - monthExpense;
  const topExpenseCategory = sortedExpenses[0] ?? null;
  const incomeRatio = monthIncome > 0 ? monthExpense / monthIncome : monthExpense > 0 ? Infinity : 0;
  const budgetRatio = totalBudget > 0 ? totalSpent / totalBudget : 0;

  type MonthStatus = "bien" | "justo" | "pasando";
  const monthStatus: MonthStatus =
    monthExpense > monthIncome || budgetRatio >= 1
      ? "pasando"
      : incomeRatio >= 0.85 || budgetRatio >= BUDGET_WARN_RATIO
        ? "justo"
        : "bien";

  const monthStatusInfo: Record<MonthStatus, { icon: string; text: string }> = {
    bien: {
      icon: "✅",
      text: "Vas bien: gastas menos de lo que ingresas y el presupuesto está bajo control.",
    },
    justo: {
      icon: "⚠️",
      text: "Vas justo: cuida los gastos el resto del mes para no pasarte.",
    },
    pasando: {
      icon: "🚨",
      text: "Te estás pasando: los gastos van por encima de lo previsto este mes.",
    },
  };
  const hasMonthActivity = monthIncome > 0 || monthExpense > 0;

  return (
    <div>
      <h1>Dashboard</h1>
      {error && <div className="error-banner">{error}</div>}

      <h2>¿Cómo voy este mes? · {MONTH_NAMES[month - 1]}</h2>
      {monthTransactions === null ? (
        <div className="empty-state">Cargando...</div>
      ) : !hasMonthActivity ? (
        <div className="empty-state">Todavía no hay movimientos registrados este mes.</div>
      ) : (
        <>
          <div className="card-grid">
            <div className="card">
              <div className="card-label">Ingresos</div>
              <div className="card-value">{monthIncome.toFixed(2)} €</div>
            </div>
            <div className="card">
              <div className="card-label">Gastos</div>
              <div className="card-value">{monthExpense.toFixed(2)} €</div>
            </div>
            <div className="card">
              <div className="card-label">Disponible</div>
              <div className={`card-value ${monthAvailable < 0 ? "amount-expense" : ""}`}>
                {monthAvailable.toFixed(2)} €
              </div>
            </div>
            <div className="card">
              <div className="card-label">Presupuesto usado</div>
              <div className="card-value">{hasBudgets ? `${percentUsed}%` : "—"}</div>
            </div>
          </div>
          <div className="month-summary-extra">
            <span className="card-label">Categoría con más gasto</span>
            <strong>
              {topExpenseCategory
                ? `${topExpenseCategory[0]} · ${topExpenseCategory[1].toFixed(2)} €`
                : "Sin gastos este mes"}
            </strong>
          </div>
          <div className={`month-status month-status-${monthStatus}`}>
            <span className="budget-alert-icon" aria-hidden="true">
              {monthStatusInfo[monthStatus].icon}
            </span>
            <span>{monthStatusInfo[monthStatus].text}</span>
          </div>
        </>
      )}

      <div className="card-grid">
        <div className="card">
          <div className="card-label">Cuentas</div>
          <div className="card-value">{accountCount ?? "…"}</div>
        </div>
        <div className="card">
          <div className="card-label">Categorías</div>
          <div className="card-value">{categoryCount ?? "…"}</div>
        </div>
        <div className="card">
          <div className="card-label">Transacciones</div>
          <div className="card-value">{transactionCount ?? "…"}</div>
        </div>
      </div>

      <h2>Presupuesto de {MONTH_NAMES[month - 1]} {year}</h2>
      {budgets === null ? (
        <div className="empty-state">Cargando...</div>
      ) : !hasBudgets ? (
        <div className="empty-state">Todavía no hay presupuestos definidos para este mes.</div>
      ) : (
        <>
          <div className="card-grid">
            <div className="card">
              <div className="card-label">Presupuestado</div>
              <div className="card-value">{totalBudget.toFixed(2)} €</div>
            </div>
            <div className="card">
              <div className="card-label">Gastado</div>
              <div className="card-value">{totalSpent.toFixed(2)} €</div>
            </div>
            <div className="card">
              <div className="card-label">Disponible</div>
              <div className="card-value">{available.toFixed(2)} €</div>
            </div>
            <div className="card">
              <div className="card-label">% utilizado</div>
              <div className="card-value">{percentUsed}%</div>
            </div>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>

          {(overallAlertStatus || categoryBudgetAlerts.length > 0) && (
            <div className="budget-alerts">
              {overallAlertStatus && (
                <div className={`budget-alert budget-alert-${overallAlertStatus}`}>
                  <span className="budget-alert-icon" aria-hidden="true">
                    {overallAlertStatus === "over" ? "🚨" : "⚠️"}
                  </span>
                  <span>
                    {overallAlertStatus === "over"
                      ? `Presupuesto total del mes superado: ${totalSpent.toFixed(2)} € de ${totalBudget.toFixed(2)} € (${percentUsed}%)`
                      : `Llevas el ${percentUsed}% del presupuesto total del mes: ${totalSpent.toFixed(2)} € de ${totalBudget.toFixed(2)} €`}
                  </span>
                </div>
              )}
              {categoryBudgetAlerts.map((a) => (
                <div key={a.categoryId} className={`budget-alert budget-alert-${a.status}`}>
                  <span className="budget-alert-icon" aria-hidden="true">
                    {a.status === "over" ? "🚨" : "⚠️"}
                  </span>
                  <span>
                    <strong>{a.name}</strong>:{" "}
                    {a.status === "over" ? "presupuesto superado" : "cerca del límite (80%)"} —{" "}
                    {a.spent.toFixed(2)} € de {a.budget.toFixed(2)} € ({a.percent}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <h2>Ingresos vs Gastos de {MONTH_NAMES[month - 1]}</h2>
      {monthTransactions === null ? (
        <div className="empty-state">Cargando...</div>
      ) : (
        <div className="chart-card">
          <BarChart
            bars={[
              { label: "Ingresos", value: monthIncome, color: "#22c55e" },
              { label: "Gastos", value: monthExpense, color: "#ef4444" },
            ]}
          />
        </div>
      )}

      <h2>Comparativa: {MONTH_NAMES[month - 1]} vs {prevMonthName}</h2>
      {monthTransactions === null || prevMonthTransactions === null ? (
        <div className="empty-state">Cargando...</div>
      ) : (
        <div className="month-compare">
          <table>
            <thead>
              <tr>
                <th scope="col"></th>
                <th scope="col">{prevMonthName}</th>
                <th scope="col">{MONTH_NAMES[month - 1]}</th>
                <th scope="col">Variación</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Ingresos</th>
                <td>{prevIncome.toFixed(2)} €</td>
                <td>{monthIncome.toFixed(2)} €</td>
                <td><DeltaCell current={monthIncome} previous={prevIncome} higherIsGood /></td>
              </tr>
              <tr>
                <th scope="row">Gastos</th>
                <td>{prevExpense.toFixed(2)} €</td>
                <td>{monthExpense.toFixed(2)} €</td>
                <td><DeltaCell current={monthExpense} previous={prevExpense} higherIsGood={false} /></td>
              </tr>
              <tr>
                <th scope="row">Balance</th>
                <td>{(prevIncome - prevExpense).toFixed(2)} €</td>
                <td>{(monthIncome - monthExpense).toFixed(2)} €</td>
                <td>
                  <DeltaCell
                    current={monthIncome - monthExpense}
                    previous={prevIncome - prevExpense}
                    higherIsGood
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <h2>Gastos por categoría de {MONTH_NAMES[month - 1]}</h2>
      {monthTransactions === null ? (
        <div className="empty-state">Cargando...</div>
      ) : expenseSegments.length === 0 ? (
        <div className="empty-state">Todavía no hay gastos registrados este mes.</div>
      ) : (
        <div className="chart-card">
          <DonutChart segments={expenseSegments} />
        </div>
      )}
    </div>
  );
}
