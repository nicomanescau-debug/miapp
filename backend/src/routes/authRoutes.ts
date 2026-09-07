import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
const APP_USERNAME = process.env.APP_USERNAME;
const APP_PASSWORD_HASH = process.env.APP_PASSWORD_HASH;

router.post("/login", async (req, res) => {
  if (!JWT_SECRET || !APP_USERNAME || !APP_PASSWORD_HASH) {
    res.status(500).json({ error: "Autenticación no configurada en el servidor" });
    return;
  }

  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Usuario y contraseña son requeridos" });
    return;
  }

  const validUsername = username === APP_USERNAME;
  const validPassword = await bcrypt.compare(password, APP_PASSWORD_HASH);

  if (!validUsername || !validPassword) {
    res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    return;
  }

  const token = jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token });
});

export default router;
