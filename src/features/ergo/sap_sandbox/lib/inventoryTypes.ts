export type MovementType = "GI" | "GR" | "ADJ";

export type StockBalance = {
  id: string;
  materialCode: string;
  plantCode: string;
  storageLocationCode: string;
  quantity: number;
  unit: string;
  updatedAt: string;
};

export type StockMovement = {
  id: string;
  materialCode: string;
  plantCode: string;
  storageLocationCode: string;
  quantityDelta: number;
  unit: string;
  movementType: MovementType | string;
  referenceDocument: string | null;
  idempotencyKey: string;
  postedAt: string;
};

export type AdjustStockInput = {
  materialCode: string;
  plantCode: string;
  storageLocationCode: string;
  quantityDelta: number;
  unit: string;
  referenceDocument?: string | null;
};

export type StockBalanceSnapshot = {
  materialCode: string;
  plantCode: string;
  storageLocationCode: string;
  quantity: number;
  unit: string;
};

export type StockListQuery = {
  materialCode?: string;
  plantCode?: string;
  storageLocationCode?: string;
};

export type MovementListQuery = {
  materialCode?: string;
  movementType?: string;
  take?: number;
};
