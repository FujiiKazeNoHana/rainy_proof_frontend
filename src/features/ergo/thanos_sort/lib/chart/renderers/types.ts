import type { Step } from "../../types";
import type { ChartTheme } from "../theme";

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  theme: ChartTheme;
  step: Step;
  /** 0..1 progress of removal highlight within the current round. */
  removeProgress: number;
  hoverIndex: number | null;
}

export type Renderer = (rc: RenderContext) => void;
