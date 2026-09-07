import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleMode() {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "login") {
        await authApi.login(username, password);
      } else {
        await authApi.register(username, password);
      }
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la operación");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card stacked-form" onSubmit={handleSubmit}>
        <div className="brand">MiApp</div>
        <h1>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h1>
        {error && <div className="error-banner">{error}</div>}
        <label>
          <span>Usuario</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </label>
        <label>
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
          {mode === "register" && <span className="field-hint">Mínimo 6 caracteres</span>}
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Procesando..." : mode === "login" ? "Ingresar" : "Crear cuenta"}
        </button>
        <button type="button" className="btn-ghost-sm" onClick={toggleMode}>
          {mode === "login" ? "¿No tenés cuenta? Registrate" : "¿Ya tenés cuenta? Iniciá sesión"}
        </button>
      </form>
    </div>
  );
}
