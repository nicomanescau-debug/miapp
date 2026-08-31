import { useEffect, useState } from "react";
import type { Account, Category, Transaction, TransactionType } from "../types";
import { IconClose } from "./icons";

function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export interface TransactionFormValues {
  amount: number;
  type: TransactionType;
  accountId: string;
  categoryId: string;
  date: string;
  description?: string;
}

interface TransactionFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  accounts: Account[];
  categories: Category[];
  initial: Transaction | null;
  submitting: boolean;
  error: string | null;
  onSubmit: (values: TransactionFormValues) => void;
  onClose: () => void;
  onCreateCategory: (name: string, type: TransactionType) => Promise<Category>;
}

export default function TransactionFormModal({
  open,
  mode,
  accounts,
  categories,
  initial,
  submitting,
  error,
  onSubmit,
  onClose,
  onCreateCategory,
}: TransactionFormModalProps) {
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValidationError(null);
    setNewCategoryName("");
    setCategoryError(null);
    if (initial) {
      setType(initial.type);
      setAmount(String(initial.amount));
      setCategoryId(initial.categoryId);
      setAccountId(initial.accountId);
      setDate(initial.date.slice(0, 10));
      setDescription(initial.description ?? "");
    } else {
      setType("EXPENSE");
      setAmount("");
      setDate(todayIso());
      setDescription("");
      setCategoryId(categories.find((c) => c.type === "EXPENSE")?.id ?? "");
      setAccountId(accounts[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const categoryOptions = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (!open) return;
    if (!categoryOptions.some((c) => c.id === categoryId)) {
      setCategoryId(categoryOptions[0]?.id ?? "");
    }
    setNewCategoryName("");
    setCategoryError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, open]);

  if (!open) return null;

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    setCategoryError(null);
    try {
      const category = await onCreateCategory(newCategoryName.trim(), type);
      setCategoryId(category.id);
      setNewCategoryName("");
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Error al crear la categoría");
    } finally {
      setCreatingCategory(false);
    }
  }

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setValidationError("Ingresá una cantidad válida mayor a 0");
      return;
    }
    if (!accountId || !categoryId) {
      setValidationError("Elegí una cuenta y una categoría");
      return;
    }
    setValidationError(null);
    onSubmit({
      amount: parsedAmount,
      type,
      accountId,
      categoryId,
      date,
      description: description.trim() || undefined,
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === "create" ? "Nueva transacción" : "Editar transacción"}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <IconClose />
          </button>
        </div>

        {(error || validationError || categoryError) && (
          <div className="error-banner">{error ?? validationError ?? categoryError}</div>
        )}

        <form className="stacked-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Tipo
              <select value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
                <option value="EXPENSE">Gasto</option>
                <option value="INCOME">Ingreso</option>
              </select>
            </label>
            <label>
              Cantidad
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </label>
          </div>

          <label>
            Fecha
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <div className="form-row">
            <label>
              Categoría
              {categoryOptions.length === 0 ? (
                <div className="inline-create-category">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder={type === "INCOME" ? "ej. Nómina" : "ej. Transporte"}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCreateCategory}
                    disabled={creatingCategory || !newCategoryName.trim()}
                  >
                    {creatingCategory ? "..." : "Crear"}
                  </button>
                </div>
              ) : (
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              {categoryOptions.length === 0 && (
                <span className="field-hint">
                  Todavía no tenés categorías de {type === "INCOME" ? "Ingreso" : "Gasto"}. Creá una para continuar.
                </span>
              )}
            </label>
            <label>
              Cuenta
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={accounts.length === 0}
              >
                {accounts.length === 0 && <option value="">Sin cuentas</option>}
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Descripción
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || accounts.length === 0 || categoryOptions.length === 0}
            >
              {submitting ? "Guardando..." : mode === "create" ? "Añadir" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
