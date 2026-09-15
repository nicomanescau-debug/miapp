import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRequestCode(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await authApi.forgotPassword(email);
      setInfo("Si el email está registrado, te llegó un correo con tu usuario y un código de 6 dígitos.");
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la operación");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword(email, code, password);
      navigate("/login", { replace: true, state: { passwordReset: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la operación");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <form
        className="login-card stacked-form"
        onSubmit={step === "request" ? handleRequestCode : handleReset}
      >
        <div className="brand">MiApp</div>
        <h1>Recuperar cuenta</h1>
        {error && <div className="error-banner">{error}</div>}
        {info && <div className="success-banner">{info}</div>}

        {step === "request" ? (
          <label>
            <span>Email de tu cuenta</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
            />
            <span className="field-hint">Te enviamos tu usuario y un código para elegir una nueva contraseña</span>
          </label>
        ) : (
          <>
            <label>
              <span>Código de 6 dígitos</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                autoFocus
                required
              />
            </label>
            <label>
              <span>Nueva contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <span className="field-hint">Mínimo 6 caracteres</span>
            </label>
            <label>
              <span>Confirmar contraseña</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
          </>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Procesando..." : step === "request" ? "Enviar código" : "Restablecer contraseña"}
        </button>
        {step === "reset" && (
          <button type="button" className="btn-ghost-sm" onClick={() => setStep("request")}>
            ¿No te llegó? Pedir otro código
          </button>
        )}
        <Link to="/login" className="btn-ghost-sm">
          Volver a iniciar sesión
        </Link>
      </form>
    </div>
  );
}
