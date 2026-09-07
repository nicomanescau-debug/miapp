import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";
import authRoutes from "./routes/authRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { requireAuth } from "./middleware/auth";
import { generateDueRecurringTransactions } from "./lib/recurringTransactions";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

app.use("/api", requireAuth);

app.use("/api", async (_req, _res, next) => {
  try {
    await generateDueRecurringTransactions();
    next();
  } catch (err) {
    next(err);
  }
});

app.use("/api", routes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});
