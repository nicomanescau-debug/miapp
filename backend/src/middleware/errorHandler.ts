import { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Recurso no encontrado" });
    }
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Ya existe un registro con ese valor único" });
    }
    if (err.code === "P2003") {
      return res.status(400).json({ error: "Referencia inválida (accountId/categoryId)" });
    }
  }

  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
}
