"use client";

import { useEffect, useState } from "react";
import { Input } from "@/shared/components/ui/input";
import {
  clampInt,
  parseIntegerInput,
} from "@/shared/lib/parse-integer-input";
import { cn } from "@/shared/lib/utils";

type Props = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange" | "inputMode"
> & {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Used when the field is empty. Default 0. */
  emptyValue?: number;
};

/**
 * Integer field: empty → emptyValue (0); "0100" → 100 (normalized on blur / when complete).
 */
export function IntegerInput({
  value,
  onValueChange,
  min,
  max,
  emptyValue = 0,
  className,
  onBlur,
  onFocus,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => String(value));

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const commit = (raw: string) => {
    const next = clampInt(parseIntegerInput(raw, emptyValue), min, max);
    onValueChange(next);
    setDraft(String(next));
    return next;
  };

  return (
    <Input
      {...rest}
      type="text"
      inputMode="numeric"
      className={cn("tabular-nums", className)}
      value={focused ? draft : String(value)}
      onFocus={(e) => {
        setFocused(true);
        setDraft(String(value));
        onFocus?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw !== "" && !/^-?\d*$/.test(raw)) return;
        setDraft(raw);
        if (raw === "" || raw === "-") {
          onValueChange(clampInt(emptyValue, min, max));
          return;
        }
        onValueChange(clampInt(parseIntegerInput(raw, emptyValue), min, max));
      }}
      onBlur={(e) => {
        commit(draft);
        setFocused(false);
        onBlur?.(e);
      }}
    />
  );
}
