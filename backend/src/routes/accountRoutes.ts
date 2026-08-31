import { Router } from "express";
import {
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
} from "../controllers/accountController";

const router = Router();

router.get("/", listAccounts);
router.get("/:id", getAccount);
router.post("/", createAccount);
router.put("/:id", updateAccount);
router.delete("/:id", deleteAccount);

export default router;
