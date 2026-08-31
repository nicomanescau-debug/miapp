import { Router } from "express";
import {
  listBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
} from "../controllers/budgetController";

const router = Router();

router.get("/", listBudgets);
router.get("/:id", getBudget);
router.post("/", createBudget);
router.put("/:id", updateBudget);
router.delete("/:id", deleteBudget);

export default router;
