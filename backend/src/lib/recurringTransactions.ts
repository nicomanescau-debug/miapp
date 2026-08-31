import { prisma } from "./prisma";
import type { RecurrenceFrequency } from "../generated/prisma/enums";

const MAX_OCCURRENCES_PER_RUN = 1000;

export function addInterval(date: Date, frequency: RecurrenceFrequency, interval: number): Date {
  const next = new Date(date);
  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + interval);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + interval * 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + interval);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + interval);
      break;
  }
  return next;
}

// El middleware llama a esta función en cada petición /api, y el frontend dispara
// varias peticiones en paralelo al cargar una pantalla. Sin serializar, dos
// ejecuciones simultáneas leen el mismo nextRunDate y materializan la misma
// ocurrencia dos veces (transacciones duplicadas). Encadenamos las llamadas para
// que solo corra una a la vez dentro del proceso.
let inFlight: Promise<void> | null = null;

export function generateDueRecurringTransactions(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = runDueRecurringTransactions().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runDueRecurringTransactions(): Promise<void> {
  const now = new Date();

  const due = await prisma.recurringTransaction.findMany({
    where: { active: true, nextRunDate: { lte: now } },
  });

  for (const rule of due) {
    const occurrences: Date[] = [];
    let cursor = rule.nextRunDate;
    let active = rule.active;

    while (
      cursor <= now &&
      (!rule.endDate || cursor <= rule.endDate) &&
      occurrences.length < MAX_OCCURRENCES_PER_RUN
    ) {
      occurrences.push(cursor);
      cursor = addInterval(cursor, rule.frequency, rule.interval);
    }

    if (rule.endDate && cursor > rule.endDate) {
      active = false;
    }

    if (occurrences.length === 0) continue;

    await prisma.$transaction([
      ...occurrences.map((date) =>
        prisma.transaction.create({
          data: {
            amount: rule.amount,
            type: rule.type,
            description: rule.description,
            date,
            accountId: rule.accountId,
            categoryId: rule.categoryId,
            recurringTransactionId: rule.id,
          },
        })
      ),
      prisma.recurringTransaction.update({
        where: { id: rule.id },
        data: { nextRunDate: cursor, active },
      }),
    ]);
  }
}
