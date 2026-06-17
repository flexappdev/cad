import { describe, it, expect } from "vitest";
import { isAllowlistedEmail } from "@/lib/supabase";

describe("isAllowlistedEmail", () => {
  it("allows the default mat@matsiems.com", () => {
    expect(isAllowlistedEmail("mat@matsiems.com")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isAllowlistedEmail("MAT@MATSIEMS.COM")).toBe(true);
  });

  it("rejects unknown emails", () => {
    expect(isAllowlistedEmail("random@example.com")).toBe(false);
  });

  it("rejects null/undefined", () => {
    expect(isAllowlistedEmail(null)).toBe(false);
    expect(isAllowlistedEmail(undefined)).toBe(false);
    expect(isAllowlistedEmail("")).toBe(false);
  });
});
