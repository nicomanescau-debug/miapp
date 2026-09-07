import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

const VALID_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

export async function listRecurringTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId, categoryId, active } = req.query;

    const where: Record<string, unknown> = { userId: req.userId };
    if (accountId) where.accountId = String(accountId);
    if (categoryId) where.categoryId = String(categoryId);
    if (active !== undefined) where.active = active === "true";

    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where,
      include: { account: true, category: true },
      orderBy: { nextRunDate: "asc" },
    });
    res.json(recurringTransactions);
  } catch (err) {
    next(err);
  }
}

export async function getRecurringTransaction(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const recurringTransaction = await prisma.recurringTransaction.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { account: true, category: true },
    });
    if (!recurringTransaction) return res.status(404).json({ error: "Movimiento recurrente no encontrado" });
    res.json(recurringTransaction);
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

export async function createRecurringTransaction(req: Request, res: Response, next: NextFunction) {
  try {
    const { amount, type, description, accountId, categoryId, frequency, interval, startDate, endDate } = req.body;
    if (amount === undefined || !type || !accountId || !categoryId || !frequency || !startDate) {
      return res.status(400).json({
        error: "amount, type, accountId, categoryId, frequency y startDate son requeridos",
      });
    }
    if (type !== "INCOME" && type !== "EXPENSE") {
      return res.status(400).json({ error: "type debe ser INCOME o EXPENSE" });
    }
    if (!VALID_FREQUENCIES.includes(frequency)) {
      return res.status(400).json({ error: "frequency debe ser DAILY, WEEKLY, MONTHLY o YEARLY" });
    }
    if (!(await ownsAccountAndCategory(req.userId!, accountId, categoryId))) {
      return res.status(404).json({ error: "Cuenta o categoría no encontrada" });
    }
    const start = new Date(startDate);
    const recurringTransaction = await prisma.recurringTransaction.create({
      data: {
        amount,
        type,
        description,
        accountId,
        categoryId,
        frequency,
        interval: interval ?? 1,
        startDate: start,
        endDate: endDate ? new Date(endDate) : undefined,
        nextRunDate: start,
        userId: req.userId!,
      },
    });
    res.status(201).json(recurringTransaction);
  } catch (err) {
    next(err);
  }
}

export async function updateRecurringTransaction(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const { amount, type, description, accountId, categoryId, frequency, interval, startDate, endDate, active } =
      req.body;
    if (type && type !== "INCOME" && type !== "EXPENSE") {
      return res.status(400).json({ error: "type debe ser INCOME o EXPENSE" });
    }
    if (frequency && !VALID_FREQUENCIES.includes(frequency)) {
      return res.status(400).json({ error: "frequency debe ser DAILY, WEEKLY, MONTHLY o YEARLY" });
    }

    const existing = await prisma.recurringTransaction.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Movimiento recurrente no encontrado" });

    if (accountId || categoryId) {
      const ok = await ownsAccountAndCategory(
        req.userId!,
        accountId ?? existing.accountId,
        categoryId ?? existing.categoryId
      );
      if (!ok) return res.status(404).json({ error: "Cuenta o categoría no encontrada" });
    }

    const data: Record<string, unknown> = {
      amount,
      type,
      description,
      accountId,
      categoryId,
      frequency,
      interval,
      endDate: endDate === undefined ? undefined : endDate ? new Date(endDate) : null,
      active,
    };

    if (startDate) {
      const start = new Date(startDate);
      data.startDate = start;
      data.nextRunDate = start;
    }

    const recurringTransaction = await prisma.recurringTransaction.update({
      where: { id: req.params.id },
      data,
    });
    res.json(recurringTransaction);
  } catch (err) {
    next(err);
  }
}

export async function deleteRecurringTransaction(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.recurringTransaction.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Movimiento recurrente no encontrado" });

    await prisma.recurringTransaction.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
