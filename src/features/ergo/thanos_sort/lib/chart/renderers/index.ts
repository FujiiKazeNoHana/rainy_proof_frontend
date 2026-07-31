import type { LodMode } from "../../types";
import { renderBar } from "./bar";
import { renderLabel } from "./label";
import { renderSpark } from "./spark";
import { renderStem } from "./stem";
import type { Renderer } from "./types";

export const renderers: Record<LodMode, Renderer> = {
  spark: renderSpark,
  stem: renderStem,
  bar: renderBar,
  label: renderLabel,
};

export type { RenderContext, Renderer } from "./types";
