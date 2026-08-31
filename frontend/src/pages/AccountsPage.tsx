import { useEffect, useState } from "react";
import AccountFormModal, { type AccountFormValues } from "../components/AccountFormModal";
import { IconEdit, IconPlus, IconTrash } from "../components/icons";
import { accountsApi, transactionsApi } from "../services/api";
import type { Account, Transaction } from "../types";
import { ACCOUNT_TYPE_META } from "../utils/accountTypes";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    try {
      const [acc, tx] = await Promise.all([accountsApi.list(), transactionsApi.list()]);
      setAccounts(acc);
      setTransactions(tx);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar cuentas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function balanceFor(accountId: string, initialBalance: number) {
    const net = transactions
      .filter((t) => t.accountId === accountId)
      .reduce((sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount), 0);
    return initialBalance + net;
  }

  const totalBalance = accounts.reduce((sum, a) => sum + balanceFor(a.id, a.initialBalance), 0);

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(a: Account) {
    setConfirmingId(null);
    setEditing(a);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(values: AccountFormValues) {
    setSubmitting(true);
    try {
      if (editing) {
        await accountsApi.update(editing.id, values);
      } else {
        await accountsApi.create(values);
      }
      await load();
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar la cuenta");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await accountsApi.remove(id);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(
        message.includes("Referencia inválida")
          ? "No podés eliminar una cuenta que tiene transacciones asociadas. Eliminá o reasigná esas transacciones primero."
          : message || "Error al eliminar la cuenta"
      );
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Cuentas</h1>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <IconPlus className="btn-icon" />
          Añadir
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!loading && accounts.length > 0 && (
        <div className="total-balance-card">
          <div className="card-label">Saldo total</div>
          <div className="total-balance-value">{totalBalance.toFixed(2)} €</div>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Cargando...</div>
      ) : accounts.length === 0 ? (
        <div className="empty-state">Todavía no hay cuentas cargadas.</div>
      ) : (
        <ul className="item-list account-list">
          {accounts.map((a) => {
            const meta = ACCOUNT_TYPE_META[a.type];
            const balance = balanceFor(a.id, a.initialBalance);
            return (
              <li key={a.id} className="account-item">
                <div className="account-icon">
                  <meta.Icon />
                </div>
                <div className="account-info">
                  <span className="account-name">{a.name}</span>
                  <span className="account-type">{meta.label}</span>
                </div>
                <span className={`amount account-balance ${balance < 0 ? "amount-expense" : ""}`}>
                  {balance.toFixed(2)} €
                </span>

                {confirmingId === a.id ? (
                  <div className="confirm-inline">
                    <button
                      type="button"
                      className="btn-danger-sm"
                      onClick={() => handleDelete(a.id)}
                      disabled={deletingId === a.id}
                    >
                      {deletingId === a.id ? "..." : "Sí"}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost-sm"
                      onClick={() => setConfirmingId(null)}
                      disabled={deletingId === a.id}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="row-actions">
                    <button type="button" className="icon-btn" aria-label="Editar cuenta" onClick={() => openEdit(a)}>
                      <IconEdit />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      aria-label="Eliminar cuenta"
                      onClick={() => setConfirmingId(a.id)}
                    >
                      <IconTrash />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" className="fab" onClick={openCreate} aria-label="Añadir cuenta">
        <IconPlus />
      </button>

      <AccountFormModal
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
