"use client";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
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
import type { CodeNameItem, MaterialListItem } from "../lib/masterDataTypes";

export type LineDraft = {
  key: string;
  id?: string | null;
  materialCode: string;
  orderedQty: number;
  unit: string;
  plantCode: string;
  unitPrice: number | null;
  remark: string;
  deliveredQty: number;
  billedQty: number;
};

type Props = {
  lines: LineDraft[];
  onChange: (lines: LineDraft[]) => void;
  materials: MaterialListItem[];
  plants: CodeNameItem[];
  readOnly?: boolean;
};

export function createEmptyLines(
  count = 1,
  defaults?: {
    materialCode?: string;
    unit?: string;
    plantCode?: string;
  },
): LineDraft[] {
  return Array.from({ length: count }, () => ({
    key: `new-${crypto.randomUUID()}`,
    materialCode: defaults?.materialCode ?? "",
    orderedQty: 1,
    unit: defaults?.unit ?? "EA",
    plantCode: defaults?.plantCode ?? "",
    unitPrice: null,
    remark: "",
    deliveredQty: 0,
    billedQty: 0,
  }));
}

/** 下拉在触发器下方展开，避免盖住当前选中项 */
function LineSelect({
  value,
  disabled,
  options,
  className,
  onValueChange,
  "aria-label": ariaLabel,
  placeholder,
}: {
  value: string;
  disabled?: boolean;
  options: { value: string; label: string }[];
  className?: string;
  onValueChange: (value: string) => void;
  "aria-label"?: string;
  placeholder?: string;
}) {
  const { t } = useSapI18n();
  const items =
    value && !options.some((o) => o.value === value)
      ? [
          {
            value,
            label: t("orderLines.currentOption", { value }),
          },
          ...options,
        ]
      : options;

  return (
    <Select
      value={value || null}
      disabled={disabled || items.length === 0}
      modal={false}
      items={items}
      onValueChange={(next) => {
        if (next != null) onValueChange(next);
      }}
    >
      <SelectTrigger size="sm" className={className} aria-label={ariaLabel}>
        <SelectValue
          placeholder={placeholder || t("common.selectPlaceholder")}
        />
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        side="bottom"
        align="start"
        sideOffset={6}
      >
        {items.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function OrderLineEditor({
  lines,
  onChange,
  materials,
  plants,
  readOnly,
}: Props) {
  const { t } = useSapI18n();

  const update = (key: string, patch: Partial<LineDraft>) => {
    onChange(
      lines.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, ...patch };
        if (patch.materialCode) {
          const m = materials.find((x) => x.code === patch.materialCode);
          if (m && !patch.unit) next.unit = m.baseUnit;
        }
        return next;
      }),
    );
  };

  const remove = (key: string) => {
    const line = lines.find((l) => l.key === key);
    if (!line) return;
    if ((line.deliveredQty ?? 0) > 0) return;
    onChange(lines.filter((l) => l.key !== key));
  };

  const addLine = () => {
    const material = materials[0];
    const plant = plants[0];
    onChange([
      ...lines,
      ...createEmptyLines(1, {
        materialCode: material?.code,
        unit: material?.baseUnit,
        plantCode: plant?.code,
      }),
    ]);
  };

  const emDash = t("common.emDash");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>{t("orderLines.title")}</Label>
        {!readOnly ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addLine}
            disabled={materials.length === 0 || plants.length === 0}
          >
            {t("orderLines.addLine")}
          </Button>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>{t("common.material")}</TableHead>
              <TableHead className="w-28">{t("orderLines.quantity")}</TableHead>
              <TableHead className="w-20">{t("orderLines.unit")}</TableHead>
              <TableHead className="w-28">{t("common.plant")}</TableHead>
              <TableHead className="w-28">{t("orderLines.unitPrice")}</TableHead>
              <TableHead>{t("common.remark")}</TableHead>
              {!readOnly ? <TableHead className="w-20" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={readOnly ? 7 : 8}
                  className="text-muted-foreground"
                >
                  {t("orderLines.empty")}
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line, index) => {
                const locked = (line.deliveredQty ?? 0) > 0;
                return (
                  <TableRow key={line.key}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        line.materialCode
                      ) : (
                        <LineSelect
                          aria-label={t("common.material")}
                          className="w-full min-w-40"
                          value={line.materialCode}
                          disabled={locked}
                          placeholder={t("orderLines.selectMaterial")}
                          options={materials.map((m) => ({
                            value: m.code,
                            label: `${m.code} · ${m.name}`,
                          }))}
                          onValueChange={(materialCode) =>
                            update(line.key, { materialCode })
                          }
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        line.orderedQty
                      ) : (
                        <Input
                          type="number"
                          min={Math.max(1, line.deliveredQty || 0)}
                          step="any"
                          className="h-8"
                          value={line.orderedQty}
                          onChange={(e) =>
                            update(line.key, {
                              orderedQty: Number(e.target.value) || 0,
                            })
                          }
                        />
                      )}
                      {locked ? (
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {t("orderLines.deliveredQty", {
                            qty: line.deliveredQty,
                          })}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        line.unit
                      ) : (
                        <Input
                          className="h-8"
                          value={line.unit}
                          disabled={locked}
                          onChange={(e) =>
                            update(line.key, { unit: e.target.value })
                          }
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        line.plantCode
                      ) : (
                        <LineSelect
                          aria-label={t("common.plant")}
                          className="w-full min-w-24"
                          value={line.plantCode}
                          disabled={locked}
                          placeholder={t("common.plant")}
                          options={plants.map((p) => ({
                            value: p.code,
                            label: `${p.code} · ${p.name}`,
                          }))}
                          onValueChange={(plantCode) =>
                            update(line.key, { plantCode })
                          }
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        line.unitPrice ?? emDash
                      ) : (
                        <Input
                          type="number"
                          step="any"
                          className="h-8"
                          value={line.unitPrice ?? ""}
                          onChange={(e) =>
                            update(line.key, {
                              unitPrice:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        line.remark || emDash
                      ) : (
                        <Input
                          className="h-8"
                          value={line.remark}
                          onChange={(e) =>
                            update(line.key, { remark: e.target.value })
                          }
                        />
                      )}
                    </TableCell>
                    {!readOnly ? (
                      <TableCell>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          disabled={locked}
                          title={
                            locked
                              ? t("orderLines.deleteBlocked")
                              : t("orderLines.deleteLine")
                          }
                          onClick={() => remove(line.key)}
                        >
                          {t("orderLines.deleteShort")}
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
