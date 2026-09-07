import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

export async function getCategory(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const category = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!category) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json(category);
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, type } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: "name y type son requeridos" });
    }
    if (type !== "INCOME" && type !== "EXPENSE") {
      return res.status(400).json({ error: "type debe ser INCOME o EXPENSE" });
    }
    const category = await prisma.category.create({ data: { name, type, userId: req.userId! } });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const { name, type } = req.body;
    if (type && type !== "INCOME" && type !== "EXPENSE") {
      return res.status(400).json({ error: "type debe ser INCOME o EXPENSE" });
    }
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Categoría no encontrada" });

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, type },
    });
    res.json(category);
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Categoría no encontrada" });

    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
