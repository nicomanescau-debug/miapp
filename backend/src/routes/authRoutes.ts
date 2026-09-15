import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { sendPasswordResetEmail } from "../lib/mailer";
import { rateLimit } from "../lib/rateLimit";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_CODE_TTL_MS = 30 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

function issueToken(userId: string): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET as string, { expiresIn: "30d" });
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

router.post("/register", async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      res.status(500).json({ error: "Autenticación no configurada en el servidor" });
      return;
    }

    const { username, password, email } = req.body ?? {};
    if (typeof username !== "string" || typeof password !== "string" || typeof email !== "string") {
      res.status(400).json({ error: "Usuario, email y contraseña son requeridos" });
      return;
    }
    if (username.trim().length < 3) {
      res.status(400).json({ error: "El usuario debe tener al menos 3 caracteres" });
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      res.status(400).json({ error: "El email no es válido" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email: normalizedEmail }] },
    });
    if (existing) {
      res.status(409).json({ error: "Ese usuario o email ya está registrado" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, email: normalizedEmail, passwordHash } });
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

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, email: true },
    });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.put("/email", requireAuth, async (req, res, next) => {
  try {
    const { email } = req.body ?? {};
    if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      res.status(400).json({ error: "El email no es válido" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const inUse = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (inUse && inUse.id !== req.userId) {
      res.status(409).json({ error: "Ese email ya está en uso por otra cuenta" });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { email: normalizedEmail },
      select: { id: true, username: true, email: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post("/forgot", rateLimit(5, 15 * 60 * 1000), async (req, res, next) => {
  try {
    const { email } = req.body ?? {};
    if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      res.status(400).json({ error: "El email no es válido" });
      return;
    }

    // Always respond the same way, whether or not the email is registered,
    // so this endpoint can't be used to probe which emails have accounts.
    const genericResponse = { message: "Si el email está registrado, vas a recibir un correo con instrucciones" };

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      res.json(genericResponse);
      return;
    }

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

    const code = crypto.randomInt(100000, 1000000).toString();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        codeHash: hashCode(code),
        expiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
      },
    });

    try {
      await sendPasswordResetEmail(normalizedEmail, user.username, code);
    } catch (mailErr) {
      console.error("No se pudo enviar el correo de recuperación", mailErr);
      res.status(500).json({ error: "No se pudo enviar el correo, intentá de nuevo más tarde" });
      return;
    }

    res.json(genericResponse);
  } catch (err) {
    next(err);
  }
});

router.post("/reset-password", rateLimit(10, 15 * 60 * 1000), async (req, res, next) => {
  try {
    const { email, code, password } = req.body ?? {};
    if (typeof email !== "string" || typeof code !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "Faltan datos" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const invalidResponse = { error: "Código inválido o vencido" };
    if (!user) {
      res.status(400).json(invalidResponse);
      return;
    }

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id, usedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!resetToken || resetToken.expiresAt < new Date() || resetToken.attempts >= MAX_CODE_ATTEMPTS) {
      res.status(400).json(invalidResponse);
      return;
    }

    if (resetToken.codeHash !== hashCode(code.trim())) {
      await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { attempts: { increment: 1 } },
      });
      res.status(400).json(invalidResponse);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    ]);

    res.json({ message: "Contraseña actualizada" });
  } catch (err) {
    next(err);
  }
});

export default router;
