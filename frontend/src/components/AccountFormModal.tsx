import { useEffect, useState } from "react";
import type { Account, AccountType } from "../types";
import { ACCOUNT_TYPE_META, ACCOUNT_TYPE_OPTIONS } from "../utils/accountTypes";
import { IconClose } from "./icons";

export interface AccountFormValues {
  name: string;
  type: AccountType;
  initialBalance: number;
}

interface AccountFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initial: Account | null;
  submitting: boolean;
  error: string | null;
  onSubmit: (values: AccountFormValues) => void;
  onClose: () => void;
}

export default function AccountFormModal({
  open,
  mode,
  initial,
  submitting,
  error,
  onSubmit,
  onClose,
}: AccountFormModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("BANK");
  const [initialBalance, setInitialBalance] = useState("0");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValidationError(null);
    if (initial) {
      setName(initial.name);
      setType(initial.type);
      setInitialBalance(String(initial.initialBalance));
    } else {
      setName("");
      setType("BANK");
      setInitialBalance("0");
    }
  }, [open, initial]);

  if (!open) return null;

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError("Ingresá un nombre para la cuenta");
      return;
    }
    setValidationError(null);
    onSubmit({
      name: name.trim(),
      type,
      initialBalance: Number(initialBalance) || 0,
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === "create" ? "Nueva cuenta" : "Editar cuenta"}</h2>
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
              placeholder="ej. Cuenta corriente"
              autoFocus
            />
          </label>

          <label>
            Tipo
            <div className="type-picker">
              {ACCOUNT_TYPE_OPTIONS.map((opt) => {
                const meta = ACCOUNT_TYPE_META[opt];
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`type-option ${type === opt ? "selected" : ""}`}
                    onClick={() => setType(opt)}
                  >
                    <meta.Icon className="type-option-icon" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </label>

          <label>
            Saldo inicial
            <input
              type="number"
              step="0.01"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0.00"
            />
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
