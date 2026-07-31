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
import { MATERIALS, PLANTS } from "../lib/masterDataStub";

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
  readOnly?: boolean;
};

function newLine(): LineDraft {
  const material = MATERIALS[0];
  return {
    key: `new-${crypto.randomUUID()}`,
    materialCode: material.code,
    orderedQty: 1,
    unit: material.defaultUnit,
    plantCode: PLANTS[0].code,
    unitPrice: null,
    remark: "",
    deliveredQty: 0,
    billedQty: 0,
  };
}

/** 下拉在触发器下方展开，避免盖住当前选中项 */
function LineSelect({
  value,
  disabled,
  options,
  className,
  onValueChange,
  "aria-label": ariaLabel,
}: {
  value: string;
  disabled?: boolean;
  options: { value: string; label: string }[];
  className?: string;
  onValueChange: (value: string) => void;
  "aria-label"?: string;
}) {
  return (
    <Select
      value={value}
      disabled={disabled}
      modal={false}
      items={options}
      onValueChange={(next) => {
        if (next != null) onValueChange(next);
      }}
    >
      <SelectTrigger size="sm" className={className} aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        side="bottom"
        align="start"
        sideOffset={6}
      >
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function OrderLineEditor({ lines, onChange, readOnly }: Props) {
  const update = (key: string, patch: Partial<LineDraft>) => {
    onChange(
      lines.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, ...patch };
        if (patch.materialCode) {
          const m = MATERIALS.find((x) => x.code === patch.materialCode);
          if (m && !patch.unit) next.unit = m.defaultUnit;
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>订单行</Label>
        {!readOnly ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange([...lines, newLine()])}
          >
            增行
          </Button>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>物料</TableHead>
              <TableHead className="w-28">数量</TableHead>
              <TableHead className="w-20">单位</TableHead>
              <TableHead className="w-28">工厂</TableHead>
              <TableHead className="w-28">单价</TableHead>
              <TableHead>备注</TableHead>
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
                  暂无行项目
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
                          aria-label="物料"
                          className="w-full min-w-40"
                          value={line.materialCode}
                          disabled={locked}
                          options={MATERIALS.map((m) => ({
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
                          已交 {line.deliveredQty}
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
                          aria-label="工厂"
                          className="w-full min-w-24"
                          value={line.plantCode}
                          disabled={locked}
                          options={PLANTS.map((p) => ({
                            value: p.code,
                            label: p.code,
                          }))}
                          onValueChange={(plantCode) =>
                            update(line.key, { plantCode })
                          }
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        line.unitPrice ?? "—"
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
                        line.remark || "—"
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
                              ? "已有交货数量，不可删除"
                              : "删除行"
                          }
                          onClick={() => remove(line.key)}
                        >
                          删
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

export function createEmptyLines(count = 1): LineDraft[] {
  return Array.from({ length: count }, () => newLine());
}
