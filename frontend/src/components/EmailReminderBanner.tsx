import { useEffect, useState, type FormEvent } from "react";
import { authApi } from "../services/api";

export default function EmailReminderBanner() {
  const [missingEmail, setMissingEmail] = useState(false);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((user) => {
        if (!cancelled) setMissingEmail(!user.email);
      })
      .catch(() => {
        // If this fails silently we just don't show the reminder this session.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await authApi.setEmail(email);
      setMissingEmail(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el email");
    } finally {
      setSubmitting(false);
    }
  }

  if (!missingEmail) return null;

  return (
    <div className="banner banner-warning">
      {editing ? (
        <form className="banner-inline-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" className="btn-ghost-sm" onClick={() => setEditing(false)}>
            Cancelar
          </button>
          {error && <span className="banner-error">{error}</span>}
        </form>
      ) : (
        <>
          <span>Agregá tu email para poder recuperar tu cuenta si olvidás la contraseña.</span>
          <button type="button" className="btn-ghost-sm" onClick={() => setEditing(true)}>
            Agregar email
          </button>
        </>
      )}
    </div>
  );
}
