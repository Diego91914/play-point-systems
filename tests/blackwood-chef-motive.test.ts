import { describe, expect, it } from "vitest";
import { BLACKWOOD_CASE_VARIANTS } from "../lib/play-point-core/mystery-case-variants";

describe("Private Chef motive", () => {
  it("scores the threatened household-account exposure as the authored motive", () => {
    const chef = BLACKWOOD_CASE_VARIANTS.find(variant => variant.id === "blackwood-private-chef");
    expect(chef?.motiveId).toBe("household_fraud_exposure");
    expect(chef?.solution).toMatch(/household accounts/i);
    expect(chef?.solution).toMatch(/expos/i);
    expect(chef?.solution).toMatch(/threatened fraud exposure was the real pressure/i);
    expect(chef?.solution).not.toMatch(/firing was the real pressure/i);
  });
});
