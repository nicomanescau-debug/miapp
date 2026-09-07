import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export async function listBudgets(req: Request, res: Response, next: NextFunction) {
  try {
    const { month, year } = req.query;
    const where: Record<string, unknown> = { userId: req.userId };
    if (month) where.month = Number(month);
    if (year) where.year = Number(year);

    const budgets = await prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    res.json(budgets);
  } catch (err) {
    next(err);
  }
}

export async function getBudget(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const budget = await prisma.budget.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { category: true },
    });
    if (!budget) return res.status(404).json({ error: "Presupuesto no encontrado" });
    res.json(budget);
  } catch (err) {
    next(err);
  }
}

export async function createBudget(req: Request, res: Response, next: NextFunction) {
  try {
    const { amount, month, year, categoryId } = req.body;
    if (amount === undefined || !month || !year || !categoryId) {
      return res
        .status(400)
        .json({ error: "amount, month, year y categoryId son requeridos" });
    }
    const category = await prisma.category.findFirst({ where: { id: categoryId, userId: req.userId } });
    if (!category) return res.status(404).json({ error: "Categoría no encontrada" });

    const budget = await prisma.budget.create({
      data: { amount, month, year, categoryId, userId: req.userId! },
    });
    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
}

export async function updateBudget(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const { amount, month, year, categoryId } = req.body;
    const existing = await prisma.budget.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Presupuesto no encontrado" });

    if (categoryId) {
      const category = await prisma.category.findFirst({ where: { id: categoryId, userId: req.userId } });
      if (!category) return res.status(404).json({ error: "Categoría no encontrada" });
    }

    const budget = await prisma.budget.update({
      where: { id: req.params.id },
      data: { amount, month, year, categoryId },
    });
    res.json(budget);
  } catch (err) {
    next(err);
  }
}

export async function deleteBudget(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.budget.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Presupuesto no encontrado" });

    await prisma.budget.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
