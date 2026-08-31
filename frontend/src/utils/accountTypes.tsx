import { IconBank, IconCard, IconCash, IconWalletOther } from "../components/icons";
import type { AccountType } from "../types";

export const ACCOUNT_TYPE_META: Record<AccountType, { label: string; Icon: typeof IconBank }> = {
  BANK: { label: "Banco", Icon: IconBank },
  CASH: { label: "Efectivo", Icon: IconCash },
  CARD: { label: "Tarjeta", Icon: IconCard },
  OTHER: { label: "Otro", Icon: IconWalletOther },
};

export const ACCOUNT_TYPE_OPTIONS: AccountType[] = ["BANK", "CASH", "CARD", "OTHER"];
