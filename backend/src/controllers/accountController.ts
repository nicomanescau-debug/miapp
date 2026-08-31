import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export async function listAccounts(_req: Request, res: Response, next: NextFunction) {
  try {
    const accounts = await prisma.account.findMany({ orderBy: { name: "asc" } });
    res.json(accounts);
  } catch (err) {
    next(err);
  }
}

export async function getAccount(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const account = await prisma.account.findUnique({ where: { id: req.params.id } });
    if (!account) return res.status(404).json({ error: "Cuenta no encontrada" });
    res.json(account);
  } catch (err) {
    next(err);
  }
}

const ACCOUNT_TYPES = ["BANK", "CASH", "CARD", "OTHER"];

export async function createAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, type, initialBalance } = req.body;
    if (!name) {
      return res.status(400).json({ error: "name es requerido" });
    }
    if (type && !ACCOUNT_TYPES.includes(type)) {
      return res.status(400).json({ error: "type debe ser BANK, CASH, CARD u OTHER" });
    }
    const account = await prisma.account.create({
      data: { name, type: type ?? "OTHER", initialBalance: initialBalance ?? 0 },
    });
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
}

export async function updateAccount(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const { name, type, initialBalance } = req.body;
    if (type && !ACCOUNT_TYPES.includes(type)) {
      return res.status(400).json({ error: "type debe ser BANK, CASH, CARD u OTHER" });
    }
    const account = await prisma.account.update({
      where: { id: req.params.id },
      data: { name, type, initialBalance },
    });
    res.json(account);
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    await prisma.account.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
