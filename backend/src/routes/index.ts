import { Router } from "express";
import accountRoutes from "./accountRoutes";
import categoryRoutes from "./categoryRoutes";
import transactionRoutes from "./transactionRoutes";
import budgetRoutes from "./budgetRoutes";
import recurringTransactionRoutes from "./recurringTransactionRoutes";

const router = Router();

router.use("/accounts", accountRoutes);
router.use("/categories", categoryRoutes);
router.use("/transactions", transactionRoutes);
router.use("/budgets", budgetRoutes);
router.use("/recurring-transactions", recurringTransactionRoutes);

export default router;
