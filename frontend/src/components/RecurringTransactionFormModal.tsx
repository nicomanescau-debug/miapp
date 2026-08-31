import { useEffect, useState } from "react";
import type { Account, Category, RecurrenceFrequency, RecurringTransaction, TransactionType } from "../types";
import { IconClose } from "./icons";

function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  DAILY: "Día(s)",
  WEEKLY: "Semana(s)",
  MONTHLY: "Mes(es)",
  YEARLY: "Año(s)",
};

export interface RecurringTransactionFormValues {
  amount: number;
  type: TransactionType;
  accountId: string;
  categoryId: string;
  frequency: RecurrenceFrequency;
  interval: number;
  startDate: string;
  endDate?: string;
  description?: string;
  active?: boolean;
}

interface RecurringTransactionFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  accounts: Account[];
  categories: Category[];
  initial: RecurringTransaction | null;
  submitting: boolean;
  error: string | null;
  onSubmit: (values: RecurringTransactionFormValues) => void;
  onClose: () => void;
  onCreateCategory: (name: string, type: TransactionType) => Promise<Category>;
}

export default function RecurringTransactionFormModal({
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
}: RecurringTransactionFormModalProps) {
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("MONTHLY");
  const [interval, setInterval] = useState("1");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
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
      setFrequency(initial.frequency);
      setInterval(String(initial.interval));
      setStartDate(initial.startDate.slice(0, 10));
      setEndDate(initial.endDate ? initial.endDate.slice(0, 10) : "");
      setDescription(initial.description ?? "");
      setActive(initial.active);
    } else {
      setType("EXPENSE");
      setAmount("");
      setFrequency("MONTHLY");
      setInterval("1");
      setStartDate(todayIso());
      setEndDate("");
      setDescription("");
      setActive(true);
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
    const parsedInterval = Number(interval);
    if (!parsedInterval || parsedInterval <= 0) {
      setValidationError("El intervalo debe ser mayor a 0");
      return;
    }
    if (!startDate) {
      setValidationError("Elegí una fecha de inicio");
      return;
    }
    if (endDate && endDate < startDate) {
      setValidationError("La fecha de fin no puede ser anterior a la de inicio");
      return;
    }
    setValidationError(null);
    onSubmit({
      amount: parsedAmount,
      type,
      accountId,
      categoryId,
      frequency,
      interval: parsedInterval,
      startDate,
      endDate: endDate || undefined,
      description: description.trim() || undefined,
      ...(mode === "edit" ? { active } : {}),
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === "create" ? "Nuevo movimiento recurrente" : "Editar movimiento recurrente"}</h2>
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

          <div className="form-row">
            <label>
              Repetir cada
              <input
                type="number"
                min="1"
                step="1"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
              />
            </label>
            <label>
              Frecuencia
              <select value={frequency} onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}>
                {(Object.keys(FREQUENCY_LABELS) as RecurrenceFrequency[]).map((f) => (
                  <option key={f} value={f}>
                    {FREQUENCY_LABELS[f]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Fecha de inicio
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label>
              Fecha de fin
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Opcional"
              />
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

          {mode === "edit" && (
            <label className="checkbox-row">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Activa
            </label>
          )}

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
