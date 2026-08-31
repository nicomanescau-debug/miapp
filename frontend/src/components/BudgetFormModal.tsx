import { useEffect, useState } from "react";
import type { Budget, Category } from "../types";
import { IconClose } from "./icons";

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

export interface BudgetFormValues {
  amount: number;
  month: number;
  year: number;
  categoryId: string;
}

interface BudgetFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  categories: Category[];
  initial: Budget | null;
  submitting: boolean;
  error: string | null;
  onSubmit: (values: BudgetFormValues) => void;
  onClose: () => void;
}

export default function BudgetFormModal({
  open,
  mode,
  categories,
  initial,
  submitting,
  error,
  onSubmit,
  onClose,
}: BudgetFormModalProps) {
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [year, setYear] = useState(currentYear());
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValidationError(null);
    if (initial) {
      setCategoryId(initial.categoryId);
      setAmount(String(initial.amount));
      setMonth(initial.month);
      setYear(initial.year);
    } else {
      setCategoryId(categories[0]?.id ?? "");
      setAmount("");
      setMonth(currentMonth());
      setYear(currentYear());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  if (!open) return null;

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setValidationError("Ingresá una cantidad válida mayor a 0");
      return;
    }
    if (!categoryId) {
      setValidationError("Elegí una categoría");
      return;
    }
    setValidationError(null);
    onSubmit({ amount: parsedAmount, month, year, categoryId });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === "create" ? "Nuevo presupuesto" : "Editar presupuesto"}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <IconClose />
          </button>
        </div>

        {(error || validationError) && <div className="error-banner">{error ?? validationError}</div>}

        <form className="stacked-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Categoría
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={categories.length === 0}
                autoFocus
              >
                {categories.length === 0 && <option value="">Sin categorías</option>}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
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
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Mes
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Año
              <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting || categories.length === 0}>
              {submitting ? "Guardando..." : mode === "create" ? "Añadir" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
