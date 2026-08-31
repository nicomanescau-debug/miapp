import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export async function listBudgets(req: Request, res: Response, next: NextFunction) {
  try {
    const { month, year } = req.query;
    const where: Record<string, unknown> = {};
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
    const budget = await prisma.budget.findUnique({
      where: { id: req.params.id },
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
    const budget = await prisma.budget.create({
      data: { amount, month, year, categoryId },
    });
    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
}

export async function updateBudget(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const { amount, month, year, categoryId } = req.body;
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
    await prisma.budget.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
