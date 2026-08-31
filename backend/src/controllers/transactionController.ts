import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export async function listTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId, categoryId, month, year } = req.query;

    const where: Record<string, unknown> = {};
    if (accountId) where.accountId = String(accountId);
    if (categoryId) where.categoryId = String(categoryId);

    if (month && year) {
      const m = Number(month);
      const y = Number(year);
      where.date = {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1),
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { account: true, category: true },
      orderBy: { date: "desc" },
    });
    res.json(transactions);
  } catch (err) {
    next(err);
  }
}

export async function getTransaction(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: { account: true, category: true },
    });
    if (!transaction) return res.status(404).json({ error: "Transacción no encontrada" });
    res.json(transaction);
  } catch (err) {
    next(err);
  }
}

export async function createTransaction(req: Request, res: Response, next: NextFunction) {
  try {
    const { amount, type, description, date, accountId, categoryId } = req.body;
    if (amount === undefined || !type || !accountId || !categoryId) {
      return res
        .status(400)
        .json({ error: "amount, type, accountId y categoryId son requeridos" });
    }
    if (type !== "INCOME" && type !== "EXPENSE") {
      return res.status(400).json({ error: "type debe ser INCOME o EXPENSE" });
    }
    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type,
        description,
        date: date ? new Date(date) : undefined,
        accountId,
        categoryId,
      },
    });
    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
}

export async function updateTransaction(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const { amount, type, description, date, accountId, categoryId } = req.body;
    if (type && type !== "INCOME" && type !== "EXPENSE") {
      return res.status(400).json({ error: "type debe ser INCOME o EXPENSE" });
    }
    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: {
        amount,
        type,
        description,
        date: date ? new Date(date) : undefined,
        accountId,
        categoryId,
      },
    });
    res.json(transaction);
  } catch (err) {
    next(err);
  }
}

export async function deleteTransaction(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
