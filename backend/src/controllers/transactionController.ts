import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export async function listTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId, categoryId, month, year } = req.query;

    const where: Record<string, unknown> = { userId: req.userId };
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
    const transaction = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { account: true, category: true },
    });
    if (!transaction) return res.status(404).json({ error: "Transacción no encontrada" });
    res.json(transaction);
  } catch (err) {
    next(err);
  }
}

async function ownsAccountAndCategory(userId: string, accountId: string, categoryId: string): Promise<boolean> {
  const [account, category] = await Promise.all([
    prisma.account.findFirst({ where: { id: accountId, userId } }),
    prisma.category.findFirst({ where: { id: categoryId, userId } }),
  ]);
  return !!account && !!category;
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
    if (!(await ownsAccountAndCategory(req.userId!, accountId, categoryId))) {
      return res.status(404).json({ error: "Cuenta o categoría no encontrada" });
    }
    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type,
        description,
        date: date ? new Date(date) : undefined,
        accountId,
        categoryId,
        userId: req.userId!,
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
    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Transacción no encontrada" });

    if (accountId || categoryId) {
      const ok = await ownsAccountAndCategory(
        req.userId!,
        accountId ?? existing.accountId,
        categoryId ?? existing.categoryId
      );
      if (!ok) return res.status(404).json({ error: "Cuenta o categoría no encontrada" });
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
    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Transacción no encontrada" });

    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
