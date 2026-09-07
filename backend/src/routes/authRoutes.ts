import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const router = Router();

function issueToken(userId: string): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET as string, { expiresIn: "30d" });
}

router.post("/register", async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      res.status(500).json({ error: "Autenticación no configurada en el servidor" });
      return;
    }

    const { username, password } = req.body ?? {};
    if (typeof username !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "Usuario y contraseña son requeridos" });
      return;
    }
    if (username.trim().length < 3) {
      res.status(400).json({ error: "El usuario debe tener al menos 3 caracteres" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      res.status(409).json({ error: "Ese usuario ya existe" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, passwordHash } });
    res.status(201).json({ token: issueToken(user.id) });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      res.status(500).json({ error: "Autenticación no configurada en el servidor" });
      return;
    }

    const { username, password } = req.body ?? {};
    if (typeof username !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "Usuario y contraseña son requeridos" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { username } });
    const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !validPassword) {
      res.status(401).json({ error: "Usuario o contraseña incorrectos" });
      return;
    }

    res.json({ token: issueToken(user.id) });
  } catch (err) {
    next(err);
  }
});

export default router;
