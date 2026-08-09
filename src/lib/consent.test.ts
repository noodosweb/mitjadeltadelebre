/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateAnalyticsConsent = vi.fn();
vi.mock("./analytics", () => ({ updateAnalyticsConsent: (...args: unknown[]) => updateAnalyticsConsent(...args) }));

const STORAGE_KEY = "cookie-consent-v1";

describe("consent", () => {
  beforeEach(() => {
    localStorage.clear();
    updateAnalyticsConsent.mockClear();
    vi.resetModules();
  });

  it("has no stored consent before any decision", async () => {
    const { getStoredConsent } = await import("./consent");
    expect(getStoredConsent()).toBeNull();
  });

  it("saves and persists categories, funcional always true", async () => {
    const { saveConsent, getStoredConsent } = await import("./consent");
    saveConsent({ preferencies: true, estadistiques: true, marketing: false });
    const stored = getStoredConsent();
    expect(stored?.categories).toMatchObject({
      funcional: true,
      preferencies: true,
      estadistiques: true,
      marketing: false,
    });
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    expect(raw.version).toBe(1);
  });

  it("applies stored categories to analytics on init", async () => {
    const { saveConsent, initConsent } = await import("./consent");
    saveConsent({ preferencies: false, estadistiques: true, marketing: false });
    updateAnalyticsConsent.mockClear();
    initConsent();
    expect(updateAnalyticsConsent).toHaveBeenCalledWith({ estadistiques: true, marketing: false });
  });

  it("does not call analytics on init when there is no stored decision", async () => {
    const { initConsent } = await import("./consent");
    initConsent();
    expect(updateAnalyticsConsent).not.toHaveBeenCalled();
  });

  it("acceptAll grants estadistiques and marketing", async () => {
    const { acceptAll, getStoredConsent } = await import("./consent");
    acceptAll();
    expect(getStoredConsent()?.categories).toMatchObject({
      estadistiques: true,
      marketing: true,
    });
    expect(updateAnalyticsConsent).toHaveBeenCalledWith({ estadistiques: true, marketing: true });
  });

  it("rejectAll denies estadistiques and marketing", async () => {
    const { rejectAll, getStoredConsent } = await import("./consent");
    rejectAll();
    expect(getStoredConsent()?.categories).toMatchObject({
      estadistiques: false,
      marketing: false,
    });
    expect(updateAnalyticsConsent).toHaveBeenCalledWith({ estadistiques: false, marketing: false });
  });
});
