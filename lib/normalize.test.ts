import { describe, expect, it } from "vitest";
import { normalizeSkillMention } from "./normalize";

describe("normalizeSkillMention — match stage cascade", () => {
  it("exact_alias: a registered alias string matches directly", () => {
    const result = normalizeSkillMention("excel");
    expect(result.skillId).toBe("SKILL_EXCEL_BASIC");
    expect(result.stage).toBe("exact_alias");
  });

  it("exact_canonical: a canonical name not itself in the alias list still matches", () => {
    const result = normalizeSkillMention("Practical Arithmetic");
    expect(result.skillId).toBe("SKILL_ARITHMETIC");
    expect(result.stage).toBe("exact_canonical");
  });

  it("containment: an alias contained in a longer, unregistered phrase matches", () => {
    const result = normalizeSkillMention("Microsoft Excel");
    expect(result.skillId).toBe("SKILL_EXCEL_BASIC");
    expect(result.stage).toBe("containment");
  });

  it("token_overlap: shared tokens above threshold match even without containment", () => {
    // Not a substring match (word order differs, "ko"/"karna" are stopwords)
    // but shares "customers" + "handling" with the "handling customers" alias.
    const result = normalizeSkillMention("customers ko handling karna");
    expect(result.skillId).toBe("SKILL_CUSTOMER_HANDLING");
    expect(result.stage).toBe("token_overlap");
  });

  it("unmatched: an unrelated phrase returns null rather than a guess", () => {
    const result = normalizeSkillMention("qwxyz zzzznonsense");
    expect(result.skillId).toBeNull();
    expect(result.stage).toBe("unmatched");
  });
});

describe("normalizeSkillMention — containment semantic guard", () => {
  it("rejects a bare generic alias when a leftover token belongs to a different skill", () => {
    // "coordination" alone is TEAM_COORDINATION's alias, but "order" is
    // discriminating for ORDER_MANAGEMENT, so the phrase resolves there —
    // via the exact alias added specifically for this case.
    const result = normalizeSkillMention("order coordination");
    expect(result.skillId).toBe("SKILL_ORDER_MANAGEMENT");
  });

  it("still allows containment when the leftover token belongs to no other skill", () => {
    // "microsoft" is not discriminating for anything in the taxonomy, so it
    // does not block "excel" from matching.
    const result = normalizeSkillMention("Microsoft Excel");
    expect(result.skillId).toBe("SKILL_EXCEL_BASIC");
  });

  it("still allows containment when the leftover word is itself a stopword", () => {
    // "assistance" is in STOPWORDS, so it never survives to be checked as a
    // leftover token in the first place.
    const result = normalizeSkillMention("sales assistance");
    expect(result.skillId).toBe("SKILL_SALES_FLOOR");
  });
});

describe("normalizeSkillMention — specific taxonomy regressions", () => {
  it("maps 'vendor coordination' to VENDOR_COORDINATION, not the bare 'coordination' alias", () => {
    const result = normalizeSkillMention("vendor coordination");
    expect(result.skillId).toBe("SKILL_VENDOR_COORDINATION");
  });

  it("maps 'gst billing' to GST_FILING, not the bare 'billing' alias", () => {
    const result = normalizeSkillMention("gst billing");
    expect(result.skillId).toBe("SKILL_GST_FILING");
  });
});
