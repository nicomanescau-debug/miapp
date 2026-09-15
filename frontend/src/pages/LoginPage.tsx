import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const passwordReset = Boolean((location.state as { passwordReset?: boolean } | null)?.passwordReset);

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
        await authApi.register(username, email, password);
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
        {!error && passwordReset && mode === "login" && (
          <div className="success-banner">Contraseña actualizada, ya podés iniciar sesión</div>
        )}
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
        {mode === "register" && (
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <span className="field-hint">Lo usamos solo para recuperar tu cuenta si olvidás la contraseña</span>
          </label>
        )}
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
        {mode === "login" && (
          <Link to="/recuperar" className="btn-ghost-sm">
            ¿Olvidaste tu usuario o contraseña?
          </Link>
        )}
        <button type="button" className="btn-ghost-sm" onClick={toggleMode}>
          {mode === "login" ? "¿No tenés cuenta? Registrate" : "¿Ya tenés cuenta? Iniciá sesión"}
        </button>
      </form>
    </div>
  );
}
