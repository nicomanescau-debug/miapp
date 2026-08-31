import { useEffect, useState } from "react";
import RecurringTransactionFormModal, {
  type RecurringTransactionFormValues,
} from "../components/RecurringTransactionFormModal";
import { IconEdit, IconPlus, IconTrash } from "../components/icons";
import { accountsApi, categoriesApi, recurringTransactionsApi } from "../services/api";
import type { Account, Category, RecurrenceFrequency, RecurringTransaction, TransactionType } from "../types";

const FREQUENCY_LABELS: Record<RecurrenceFrequency, { one: string; many: string }> = {
  DAILY: { one: "día", many: "días" },
  WEEKLY: { one: "semana", many: "semanas" },
  MONTHLY: { one: "mes", many: "meses" },
  YEARLY: { one: "año", many: "años" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { timeZone: "UTC" });
}

function formatFrequency(r: RecurringTransaction) {
  const labels = FREQUENCY_LABELS[r.frequency];
  return r.interval === 1 ? `Cada ${labels.one}` : `Cada ${r.interval} ${labels.many}`;
}

export default function RecurringTransactionsPage() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    try {
      const [rec, acc, cat] = await Promise.all([
        recurringTransactionsApi.list(),
        accountsApi.list(),
        categoriesApi.list(),
      ]);
      setRecurring(rec);
      setAccounts(acc);
      setCategories(cat);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar movimientos recurrentes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const missingSetup = !loading && (accounts.length === 0 || categories.length === 0);

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(r: RecurringTransaction) {
    setConfirmingId(null);
    setEditing(r);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(values: RecurringTransactionFormValues) {
    setSubmitting(true);
    try {
      if (editing) {
        await recurringTransactionsApi.update(editing.id, values);
      } else {
        await recurringTransactionsApi.create(values);
      }
      await load();
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar el movimiento recurrente");
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
      await recurringTransactionsApi.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el movimiento recurrente");
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Recurrentes</h1>
        <button type="button" className="btn-primary" onClick={openCreate} disabled={missingSetup}>
          <IconPlus className="btn-icon" />
          Añadir
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {missingSetup && (
        <div className="empty-state">
          Necesitás al menos una cuenta y una categoría antes de crear movimientos recurrentes. Creálas en
          las secciones Cuentas y Categorías.
        </div>
      )}

      {loading ? (
        <div className="empty-state">Cargando...</div>
      ) : recurring.length === 0 ? (
        <div className="empty-state">Todavía no hay movimientos recurrentes.</div>
      ) : (
        <ul className="item-list transaction-list">
          {recurring.map((r) => (
            <li key={r.id} className="transaction-item">
              <div className="transaction-info">
                <span className="transaction-category">
                  {r.category?.name ?? "—"}
                  {!r.active && " · Pausada"}
                </span>
                <span className="transaction-meta">
                  {r.account?.name ?? "—"} · {formatFrequency(r)} · Próxima: {formatDate(r.nextRunDate)}
                  {r.description ? ` · ${r.description}` : ""}
                </span>
              </div>

              <span className={r.type === "INCOME" ? "amount amount-income" : "amount amount-expense"}>
                {r.type === "INCOME" ? "+" : "-"}
                {r.amount.toFixed(2)} €
              </span>

              {confirmingId === r.id ? (
                <div className="confirm-inline">
                  <button
                    type="button"
                    className="btn-danger-sm"
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                  >
                    {deletingId === r.id ? "..." : "Sí"}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost-sm"
                    onClick={() => setConfirmingId(null)}
                    disabled={deletingId === r.id}
                  >
                    No
                  </button>
                </div>
              ) : (
                <div className="row-actions">
                  <button type="button" className="icon-btn" aria-label="Editar movimiento recurrente" onClick={() => openEdit(r)}>
                    <IconEdit />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn-danger"
                    aria-label="Eliminar movimiento recurrente"
                    onClick={() => setConfirmingId(r.id)}
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
        aria-label="Añadir movimiento recurrente"
      >
        <IconPlus />
      </button>

      <RecurringTransactionFormModal
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
