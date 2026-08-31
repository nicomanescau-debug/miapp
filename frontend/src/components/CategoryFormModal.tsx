import { useEffect, useState } from "react";
import type { Category, TransactionType } from "../types";
import { IconClose } from "./icons";

export interface CategoryFormValues {
  name: string;
  type: TransactionType;
}

interface CategoryFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initial: Category | null;
  submitting: boolean;
  error: string | null;
  onSubmit: (values: CategoryFormValues) => void;
  onClose: () => void;
}

export default function CategoryFormModal({
  open,
  mode,
  initial,
  submitting,
  error,
  onSubmit,
  onClose,
}: CategoryFormModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValidationError(null);
    if (initial) {
      setName(initial.name);
      setType(initial.type);
    } else {
      setName("");
      setType("EXPENSE");
    }
  }, [open, initial]);

  if (!open) return null;

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError("Ingresá un nombre para la categoría");
      return;
    }
    setValidationError(null);
    onSubmit({ name: name.trim(), type });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === "create" ? "Nueva categoría" : "Editar categoría"}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <IconClose />
          </button>
        </div>

        {(error || validationError) && <div className="error-banner">{error ?? validationError}</div>}

        <form className="stacked-form" onSubmit={handleSubmit}>
          <label>
            Nombre
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. Comida"
              autoFocus
            />
          </label>

          <label>
            Tipo
            <select value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
              <option value="EXPENSE">Gasto</option>
              <option value="INCOME">Ingreso</option>
            </select>
          </label>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : mode === "create" ? "Añadir" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
