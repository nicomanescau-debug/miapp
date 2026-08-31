import { Router } from "express";
import {
  listRecurringTransactions,
  getRecurringTransaction,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from "../controllers/recurringTransactionController";

const router = Router();

router.get("/", listRecurringTransactions);
router.get("/:id", getRecurringTransaction);
router.post("/", createRecurringTransaction);
router.put("/:id", updateRecurringTransaction);
router.delete("/:id", deleteRecurringTransaction);

export default router;
