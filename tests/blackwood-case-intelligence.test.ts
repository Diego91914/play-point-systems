import { describe, expect, it } from "vitest";
import { buildMysteryCaseAlerts } from "../app/games/mystery/MysteryCaseIntelligence";

describe("Blackwood Case File Intelligence", () => {
  it("uses company-record logic instead of Old Friend logic in the Business Partner path", () => {
    const alerts = buildMysteryCaseAlerts({
      evidence: [
        { index: 1, title: "The death window", text: "10:31–10:35" },
        { index: 2, title: "The torn bank-record fragment", text: "A fragment matched copied company records." },
      ],
      interviews: [
        { questioner: "A", target: "Jordan", question: "Where were you?", answer: "I was in the downstairs study at 10:30." },
      ],
    });

    expect(alerts.some(alert => alert.id === "study-record-fragment")).toBe(true);
    expect(alerts.flatMap(alert => alert.facts).join(" ").toLowerCase()).not.toContain("blue ledger");
  });

  it("recognizes the Sister's call gap without calling it proof", () => {
    const alerts = buildMysteryCaseAlerts({
      evidence: [{ index: 3, title: "The garden-call gap", text: "The accountant call disconnected." }],
      interviews: [
        { questioner: "A", target: "Morgan", question: "Where?", answer: "I was outside near the garden gate on the family accountant call." },
      ],
    });

    const alert = alerts.find(item => item.id === "garden-call-pressure");
    expect(alert).toBeTruthy();
    expect(alert?.caution.toLowerCase()).toContain("not identity");
  });

  it("recognizes the Chef service gap without declaring guilt", () => {
    const alerts = buildMysteryCaseAlerts({
      evidence: [{ index: 2, title: "The service gap", text: "Kitchen activity paused." }],
      interviews: [
        { questioner: "A", target: "Casey", question: "Where?", answer: "I was cleaning in the kitchen continuously through the critical window." },
      ],
    });

    const alert = alerts.find(item => item.id === "kitchen-service-gap");
    expect(alert).toBeTruthy();
    expect(alert?.caution.toLowerCase()).toContain("does not by itself");
  });
});
