import { useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import TransactionFormModal, { type TransactionFormValues } from "../components/TransactionFormModal";
import { IconEdit, IconPlus, IconTrash } from "../components/icons";
import { accountsApi, categoriesApi, transactionsApi } from "../services/api";
import type { Account, Category, Transaction, TransactionType } from "../types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { timeZone: "UTC" });
}

type TypeFilter = "ALL" | TransactionType;
type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const SORT_LABELS: Record<SortOption, string> = {
  "date-desc": "Fecha (más reciente)",
  "date-asc": "Fecha (más antigua)",
  "amount-desc": "Importe (mayor a menor)",
  "amount-asc": "Importe (menor a mayor)",
};

// UTF-8 BOM so Excel opens the file with the right encoding (accents, ñ).
const BOM = String.fromCharCode(0xfeff);

function csvField(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function transactionsToCsv(rows: Transaction[]) {
  const header = ["Fecha", "Descripción", "Categoría", "Cuenta", "Tipo", "Importe"];
  const lines = [header.map(csvField).join(",")];
  for (const t of rows) {
    lines.push(
      [
        t.date.slice(0, 10),
        t.description ?? "",
        t.category?.name ?? "",
        t.account?.name ?? "",
        t.type === "INCOME" ? "Ingreso" : "Gasto",
        t.amount.toFixed(2),
      ]
        .map((v) => csvField(String(v)))
        .join(",")
    );
  }
  return BOM + lines.join("\r\n");
}

function csvFileName() {
  return `transacciones-${new Date().toISOString().slice(0, 10)}.csv`;
}

// Browser: trigger a normal file download.
function downloadCsvInBrowser(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Android/iOS (Capacitor): write the file to the app cache and open the share sheet
// so the user can save it or send it wherever they want.
async function exportCsvOnNative(csv: string, filename: string) {
  const { uri } = await Filesystem.writeFile({
    path: filename,
    data: csv,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  await Share.share({
    title: "Transacciones",
    url: uri,
    dialogTitle: "Exportar transacciones",
  });
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  async function load() {
    try {
      const [tx, acc, cat] = await Promise.all([
        transactionsApi.list(),
        accountsApi.list(),
        categoriesApi.list(),
      ]);
      setTransactions(tx);
      setAccounts(acc);
      setCategories(cat);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar transacciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const missingSetup = !loading && (accounts.length === 0 || categories.length === 0);

  const hasActiveFilters =
    search.trim() !== "" ||
    categoryFilter !== "" ||
    typeFilter !== "ALL" ||
    fromDate !== "" ||
    toDate !== "";

  const visibleTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = transactions.filter((t) => {
      if (q) {
        const haystack = `${t.description ?? ""} ${t.category?.name ?? ""} ${t.account?.name ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (categoryFilter && t.categoryId !== categoryFilter) return false;
      if (typeFilter !== "ALL" && t.type !== typeFilter) return false;
      const day = t.date.slice(0, 10);
      if (fromDate && day < fromDate) return false;
      if (toDate && day > toDate) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return a.date.localeCompare(b.date);
        case "date-desc":
          return b.date.localeCompare(a.date);
        case "amount-asc":
          return a.amount - b.amount;
        case "amount-desc":
          return b.amount - a.amount;
        default:
          return 0;
      }
    });

    return sorted;
  }, [transactions, search, categoryFilter, typeFilter, fromDate, toDate, sortBy]);

  function clearFilters() {
    setSearch("");
    setCategoryFilter("");
    setTypeFilter("ALL");
    setFromDate("");
    setToDate("");
  }

  async function handleExportCsv() {
    if (visibleTransactions.length === 0) return;
    const csv = transactionsToCsv(visibleTransactions);
    const filename = csvFileName();
    try {
      if (Capacitor.isNativePlatform()) {
        await exportCsvOnNative(csv, filename);
      } else {
        downloadCsvInBrowser(csv, filename);
      }
    } catch (err) {
      // The user dismissing the share sheet also lands here; ignore that case.
      const message = err instanceof Error ? err.message : String(err);
      if (/cancel/i.test(message)) return;
      setError("No se pudo exportar el CSV");
    }
  }

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(t: Transaction) {
    setConfirmingId(null);
    setEditing(t);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(values: TransactionFormValues) {
    setSubmitting(true);
    try {
      if (editing) {
        await transactionsApi.update(editing.id, values);
      } else {
        await transactionsApi.create(values);
      }
      await load();
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar la transacción");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateCategory(name: string, type: TransactionType) {
    const category = await categoriesApi.create({ name, type });
    setCategories((prev) => [...prev, category]);
    return category;
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await transactionsApi.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar la transacción");
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Transacciones</h1>
        <button type="button" className="btn-primary" onClick={openCreate} disabled={missingSetup}>
          <IconPlus className="btn-icon" />
          Añadir
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {missingSetup && (
        <div className="empty-state">
          Necesitás al menos una cuenta y una categoría antes de cargar transacciones. Creálas en
          las secciones Cuentas y Categorías.
        </div>
      )}

      {!loading && !missingSetup && transactions.length > 0 && (
        <div className="filter-bar">
          <div className="filter-bar-row">
            <label className="filter-field filter-field-grow">
              <span>Buscar</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Descripción, categoría o cuenta"
              />
            </label>
            <label className="filter-field">
              <span>Ordenar por</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
                {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                  <option key={option} value={option}>
                    {SORT_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="filter-bar-row">
            <label className="filter-field">
              <span>Categoría</span>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-field">
              <span>Tipo</span>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}>
                <option value="ALL">Todos</option>
                <option value="INCOME">Ingresos</option>
                <option value="EXPENSE">Gastos</option>
              </select>
            </label>
            <label className="filter-field">
              <span>Desde</span>
              <input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} />
            </label>
            <label className="filter-field">
              <span>Hasta</span>
              <input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} />
            </label>
          </div>

          <div className="filter-bar-footer">
            <span className="filter-count">
              {visibleTransactions.length}{" "}
              {visibleTransactions.length === 1 ? "transacción" : "transacciones"}
              {hasActiveFilters ? ` de ${transactions.length}` : ""}
            </span>
            <div className="filter-bar-actions">
              <button
                type="button"
                className="btn-ghost-sm"
                onClick={handleExportCsv}
                disabled={visibleTransactions.length === 0}
              >
                Exportar CSV
              </button>
              {hasActiveFilters && (
                <button type="button" className="btn-ghost-sm" onClick={clearFilters}>
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Cargando...</div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">Todavía no hay transacciones cargadas.</div>
      ) : visibleTransactions.length === 0 ? (
        <div className="empty-state">Ninguna transacción coincide con los filtros.</div>
      ) : (
        <ul className="item-list transaction-list">
          {visibleTransactions.map((t) => (
            <li key={t.id} className="transaction-item">
              <div className="transaction-info">
                <span className="transaction-category">{t.category?.name ?? "—"}</span>
                <span className="transaction-meta">
                  {t.account?.name ?? "—"} · {formatDate(t.date)}
                  {t.description ? ` · ${t.description}` : ""}
                </span>
              </div>

              <span className={t.type === "INCOME" ? "amount amount-income" : "amount amount-expense"}>
                {t.type === "INCOME" ? "+" : "-"}
                {t.amount.toFixed(2)} €
              </span>

              {confirmingId === t.id ? (
                <div className="confirm-inline">
                  <button
                    type="button"
                    className="btn-danger-sm"
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                  >
                    {deletingId === t.id ? "..." : "Sí"}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost-sm"
                    onClick={() => setConfirmingId(null)}
                    disabled={deletingId === t.id}
                  >
                    No
                  </button>
                </div>
              ) : (
                <div className="row-actions">
                  <button type="button" className="icon-btn" aria-label="Editar transacción" onClick={() => openEdit(t)}>
                    <IconEdit />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn-danger"
                    aria-label="Eliminar transacción"
                    onClick={() => setConfirmingId(t.id)}
                  >
                    <IconTrash />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="fab"
        onClick={openCreate}
        disabled={missingSetup}
        aria-label="Añadir transacción"
      >
        <IconPlus />
      </button>

      <TransactionFormModal
        open={modalOpen}
        mode={editing ? "edit" : "create"}
        accounts={accounts}
        categories={categories}
        initial={editing}
        submitting={submitting}
        error={formError}
        onSubmit={handleSubmit}
        onClose={closeModal}
        onCreateCategory={handleCreateCategory}
      />
    </div>
  );
}
