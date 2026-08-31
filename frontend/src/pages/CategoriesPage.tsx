import { useEffect, useState } from "react";
import CategoryFormModal, { type CategoryFormValues } from "../components/CategoryFormModal";
import { IconEdit, IconPlus, IconTrash } from "../components/icons";
import { categoriesApi } from "../services/api";
import type { Category } from "../types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    try {
      setCategories(await categoriesApi.list());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(c: Category) {
    setConfirmingId(null);
    setEditing(c);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(values: CategoryFormValues) {
    setSubmitting(true);
    try {
      if (editing) {
        await categoriesApi.update(editing.id, values);
      } else {
        await categoriesApi.create(values);
      }
      await load();
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar la categoría");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await categoriesApi.remove(id);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(
        message.includes("Referencia inválida")
          ? "No podés eliminar una categoría que tiene transacciones o presupuestos asociados."
          : message || "Error al eliminar la categoría"
      );
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Categorías</h1>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <IconPlus className="btn-icon" />
          Añadir
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="empty-state">Cargando...</div>
      ) : categories.length === 0 ? (
        <div className="empty-state">Todavía no hay categorías cargadas.</div>
      ) : (
        <ul className="item-list">
          {categories.map((c) => (
            <li key={c.id}>
              <div className="transaction-info">
                <span className="transaction-category">{c.name}</span>
                <span className="transaction-meta">{c.type === "INCOME" ? "Ingreso" : "Gasto"}</span>
              </div>

              {confirmingId === c.id ? (
                <div className="confirm-inline">
                  <button
                    type="button"
                    className="btn-danger-sm"
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                  >
                    {deletingId === c.id ? "..." : "Sí"}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost-sm"
                    onClick={() => setConfirmingId(null)}
                    disabled={deletingId === c.id}
                  >
                    No
                  </button>
                </div>
              ) : (
                <div className="row-actions">
                  <button type="button" className="icon-btn" aria-label="Editar categoría" onClick={() => openEdit(c)}>
                    <IconEdit />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn-danger"
                    aria-label="Eliminar categoría"
                    onClick={() => setConfirmingId(c.id)}
                  >
                    <IconTrash />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="fab" onClick={openCreate} aria-label="Añadir categoría">
        <IconPlus />
      </button>

      <CategoryFormModal
        open={modalOpen}
        mode={editing ? "edit" : "create"}
        initial={editing}
        submitting={submitting}
        error={formError}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />
    </div>
  );
}
