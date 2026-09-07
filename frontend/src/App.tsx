import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import AppLayout from "./layouts/AppLayout";
import RequireAuth from "./components/RequireAuth";
import AccountsPage from "./pages/AccountsPage";
import BudgetsPage from "./pages/BudgetsPage";
import CategoriesPage from "./pages/CategoriesPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RecurringTransactionsPage from "./pages/RecurringTransactionsPage";
import TransactionsPage from "./pages/TransactionsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="transacciones" element={<TransactionsPage />} />
            <Route path="recurrentes" element={<RecurringTransactionsPage />} />
            <Route path="categorias" element={<CategoriesPage />} />
            <Route path="cuentas" element={<AccountsPage />} />
            <Route path="presupuestos" element={<BudgetsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
