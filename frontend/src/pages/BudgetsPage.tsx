import { useEffect, useState } from "react";
import BudgetFormModal, { type BudgetFormValues } from "../components/BudgetFormModal";
import { IconEdit, IconPlus, IconTrash } from "../components/icons";
import { budgetsApi, categoriesApi } from "../services/api";
import type { Budget, Category } from "../types";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    try {
      const [bud, cat] = await Promise.all([budgetsApi.list(), categoriesApi.list()]);
      setBudgets(bud);
      setCategories(cat);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar presupuestos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const noCategories = !loading && categories.length === 0;

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(b: Budget) {
    setConfirmingId(null);
    setEditing(b);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(values: BudgetFormValues) {
    setSubmitting(true);
    try {
      if (editing) {
        await budgetsApi.update(editing.id, values);
      } else {
        await budgetsApi.create(values);
      }
      await load();
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar el presupuesto");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await budgetsApi.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el presupuesto");
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Presupuestos</h1>
        <button type="button" className="btn-primary" onClick={openCreate} disabled={noCategories}>
          <IconPlus className="btn-icon" />
          Añadir
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {noCategories && (
        <div className="empty-state">
          Necesitás al menos una categoría antes de definir presupuestos. Creála en la sección
          Categorías.
        </div>
      )}

      {loading ? (
        <div className="empty-state">Cargando...</div>
      ) : budgets.length === 0 ? (
        <div className="empty-state">Todavía no hay presupuestos cargados.</div>
      ) : (
        <ul className="item-list">
          {budgets.map((b) => (
            <li key={b.id}>
              <div className="transaction-info">
                <span className="transaction-category">{b.category?.name ?? "—"}</span>
                <span className="transaction-meta">
                  {MONTH_NAMES[b.month - 1]} {b.year}
                </span>
              </div>

              {confirmingId === b.id ? (
                <div className="confirm-inline">
                  <button
                    type="button"
                    className="btn-danger-sm"
                    onClick={() => handleDelete(b.id)}
                    disabled={deletingId === b.id}
                  >
                    {deletingId === b.id ? "..." : "Sí"}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost-sm"
                    onClick={() => setConfirmingId(null)}
                    disabled={deletingId === b.id}
                  >
                    No
                  </button>
                </div>
              ) : (
                <>
                  <span className="amount">{b.amount.toFixed(2)} €</span>
                  <div className="row-actions">
                    <button type="button" className="icon-btn" aria-label="Editar presupuesto" onClick={() => openEdit(b)}>
                      <IconEdit />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      aria-label="Eliminar presupuesto"
                      onClick={() => setConfirmingId(b.id)}
                    >
                      <IconTrash />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="fab" onClick={openCreate} disabled={noCategories} aria-label="Añadir presupuesto">
        <IconPlus />
      </button>

      <BudgetFormModal
        open={modalOpen}
        mode={editing ? "edit" : "create"}
        categories={categories}
        initial={editing}
        submitting={submitting}
        error={formError}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />
    </div>
  );
}
