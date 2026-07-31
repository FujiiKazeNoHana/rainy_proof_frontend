import { describe, expect, it } from "vitest";
import { modeFor } from "./modeFor";

describe("modeFor", () => {
  it("maps thresholds per spec", () => {
    expect(modeFor(10000)).toBe("spark");
    expect(modeFor(2000)).toBe("spark");
    expect(modeFor(1999)).toBe("stem");
    expect(modeFor(200)).toBe("stem");
    expect(modeFor(199)).toBe("bar");
    expect(modeFor(32)).toBe("bar");
    expect(modeFor(31)).toBe("label");
    expect(modeFor(1)).toBe("label");
  });
});
