import { apiFetch } from "@/shared/lib/api-client";
import { INVENTORY_API } from "../constants";
import type {
  AdjustStockInput,
  MovementListQuery,
  StockBalance,
  StockBalanceSnapshot,
  StockListQuery,
  StockMovement,
} from "../lib/inventoryTypes";

function stockQuery(params: StockListQuery): string {
  const q = new URLSearchParams();
  if (params.materialCode?.trim()) {
    q.set("materialCode", params.materialCode.trim());
  }
  if (params.plantCode?.trim()) q.set("plantCode", params.plantCode.trim());
  if (params.storageLocationCode?.trim()) {
    q.set("storageLocationCode", params.storageLocationCode.trim());
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

function movementQuery(params: MovementListQuery): string {
  const q = new URLSearchParams();
  if (params.materialCode?.trim()) {
    q.set("materialCode", params.materialCode.trim());
  }
  if (params.movementType?.trim()) {
    q.set("movementType", params.movementType.trim());
  }
  if (params.take != null && Number.isFinite(params.take)) {
    q.set("take", String(params.take));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function listStock(
  query: StockListQuery = {},
): Promise<StockBalance[]> {
  return apiFetch<StockBalance[]>(`${INVENTORY_API}/stock${stockQuery(query)}`);
}

export async function listMovements(
  query: MovementListQuery = {},
): Promise<StockMovement[]> {
  return apiFetch<StockMovement[]>(
    `${INVENTORY_API}/movements${movementQuery(query)}`,
  );
}

/** Manual ADJ — do not send Idempotency-Key (double-submit = double count). */
export async function adjustStock(
  input: AdjustStockInput,
): Promise<StockBalanceSnapshot> {
  return apiFetch<StockBalanceSnapshot>(`${INVENTORY_API}/adjust`, {
    method: "POST",
    body: input,
  });
}
