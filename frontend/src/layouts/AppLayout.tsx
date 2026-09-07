import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { authApi, checkHealth } from "../services/api";

type IconProps = { className?: string };

function IconHome({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function IconTransactions({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h13l-3-3" />
      <path d="M20 17H7l3 3" />
    </svg>
  );
}

function IconTag({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.6 3H5a1 1 0 0 0-1 1v7.6c0 .27.1.52.3.7l9.4 9.4c.4.4 1 .4 1.4 0l7-7c.4-.4.4-1 0-1.4L12.7 3.3a1 1 0 0 0-.7-.3Z" />
      <circle cx="8.5" cy="8.5" r="1.5" />
    </svg>
  );
}

function IconWallet({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3" />
      <path d="M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-4" />
      <path d="M15 13h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a2 2 0 0 1 0-4Z" />
    </svg>
  );
}

function IconTarget({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function IconRepeat({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2 21 6l-4 4" />
      <path d="M3 12v-2a4 4 0 0 1 4-4h14" />
      <path d="M7 22 3 18l4-4" />
      <path d="M21 12v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true, Icon: IconHome },
  { to: "/transacciones", label: "Transacciones", Icon: IconTransactions },
  { to: "/recurrentes", label: "Recurrentes", Icon: IconRepeat },
  { to: "/categorias", label: "Categorías", Icon: IconTag },
  { to: "/cuentas", label: "Cuentas", Icon: IconWallet },
  { to: "/presupuestos", label: "Presupuestos", Icon: IconTarget },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState<"checking" | "ok" | "error">("checking");

  function handleLogout() {
    authApi.logout();
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    let cancelled = false;
    const MAX_ATTEMPTS = 15;
    const RETRY_DELAY_MS = 4000;

    async function pingBackend() {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          await checkHealth();
          if (!cancelled) setBackendStatus("ok");
          return;
        } catch {
          if (attempt === MAX_ATTEMPTS) {
            if (!cancelled) setBackendStatus("error");
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
    }

    pingBackend();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusLabel =
    backendStatus === "checking"
      ? "Verificando backend..."
      : backendStatus === "ok"
        ? "Backend conectado"
        : "Backend sin conexión";

  return (
    <div className="app-shell">
      <header className="mobile-topbar">
        <div className="brand">MiApp</div>
        <div className="topbar-right">
          <div className="backend-status">
            <span className={`status-dot ${backendStatus}`} />
            {statusLabel}
          </div>
          <button type="button" className="btn-ghost-sm" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </header>

      <aside className="sidebar">
        <div className="brand">MiApp</div>
        <ul className="nav-links">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="backend-status">
          <span className={`status-dot ${backendStatus}`} />
          {statusLabel}
        </div>
        <button type="button" className="btn-ghost-sm" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </aside>

      <main className="content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            <item.Icon className="bottom-nav-icon" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
