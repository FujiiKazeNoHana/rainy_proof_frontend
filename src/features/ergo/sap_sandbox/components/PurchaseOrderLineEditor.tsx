"use client";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useSapI18n } from "../i18n";
import type { MaterialListItem } from "../lib/masterDataTypes";

export type PoLineDraft = {
  key: string;
  lineId?: string | null;
  materialCode: string;
  orderedQty: number;
  unit: string;
  unitPrice: number;
  receivedQty: number;
};

type Props = {
  lines: PoLineDraft[];
  onChange: (lines: PoLineDraft[]) => void;
  materials: MaterialListItem[];
  readOnly?: boolean;
};

export function createEmptyPoLines(
  count = 1,
  defaults?: {
    materialCode?: string;
    unit?: string;
    unitPrice?: number;
  },
): PoLineDraft[] {
  return Array.from({ length: count }, () => ({
    key: `new-${crypto.randomUUID()}`,
    materialCode: defaults?.materialCode ?? "",
    orderedQty: 1,
    unit: defaults?.unit ?? "EA",
    unitPrice: defaults?.unitPrice ?? 0,
    receivedQty: 0,
  }));
}

export function PurchaseOrderLineEditor({
  lines,
  onChange,
  materials,
  readOnly = false,
}: Props) {
  const { t } = useSapI18n();

  const updateLine = (key: string, patch: Partial<PoLineDraft>) => {
    onChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const removeLine = (key: string) => {
    const target = lines.find((l) => l.key === key);
    if (target && target.receivedQty > 0) return;
    onChange(lines.filter((l) => l.key !== key));
  };

  const addLine = () => {
    const material = materials[0];
    onChange([
      ...lines,
      ...createEmptyPoLines(1, {
        materialCode: material?.code,
        unit: material?.baseUnit,
        unitPrice: 0,
      }),
    ]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{t("purchaseOrderLines.title")}</h3>
        {!readOnly ? (
          <Button type="button" size="sm" variant="outline" onClick={addLine}>
            {t("purchaseOrderLines.addLine")}
          </Button>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.material")}</TableHead>
              <TableHead>{t("purchaseOrderLines.quantity")}</TableHead>
              <TableHead>{t("purchaseOrderLines.unit")}</TableHead>
              <TableHead>{t("purchaseOrderLines.unitPrice")}</TableHead>
              {!readOnly ? <TableHead /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={readOnly ? 4 : 5}
                  className="text-muted-foreground"
                >
                  {t("purchaseOrderLines.empty")}
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line) => {
                const locked = line.receivedQty > 0;
                return (
                  <TableRow key={line.key}>
                    <TableCell className="min-w-40">
                      {readOnly || locked ? (
                        <div className="space-y-0.5">
                          <span className="font-medium">{line.materialCode}</span>
                          {locked ? (
                            <p className="text-xs text-muted-foreground">
                              {t("purchaseOrderLines.receivedQty", {
                                qty: line.receivedQty,
                              })}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <Select
                          value={line.materialCode || undefined}
                          onValueChange={(v) => {
                            if (!v) return;
                            const mat = materials.find((m) => m.code === v);
                            updateLine(line.key, {
                              materialCode: v,
                              unit: mat?.baseUnit ?? line.unit,
                            });
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={t(
                                "purchaseOrderLines.selectMaterial",
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((m) => (
                              <SelectItem key={m.code} value={m.code}>
                                {m.code} · {m.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={locked ? line.receivedQty : 0}
                        step="any"
                        className="w-28"
                        value={line.orderedQty}
                        disabled={readOnly}
                        onChange={(e) =>
                          updateLine(line.key, {
                            orderedQty: Number(e.target.value),
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="w-20"
                        value={line.unit}
                        disabled={readOnly || locked}
                        onChange={(e) =>
                          updateLine(line.key, { unit: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        className="w-28"
                        value={line.unitPrice}
                        disabled={readOnly}
                        onChange={(e) =>
                          updateLine(line.key, {
                            unitPrice: Number(e.target.value),
                          })
                        }
                      />
                    </TableCell>
                    {!readOnly ? (
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={locked}
                          title={
                            locked
                              ? t("purchaseOrderLines.deleteBlocked")
                              : t("purchaseOrderLines.deleteLine")
                          }
                          onClick={() => removeLine(line.key)}
                        >
                          {t("purchaseOrderLines.deleteShort")}
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
