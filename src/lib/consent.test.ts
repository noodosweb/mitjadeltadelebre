/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateAnalyticsConsent = vi.fn();
vi.mock("./analytics", () => ({
  updateAnalyticsConsent: (...args: unknown[]) => updateAnalyticsConsent(...args),
}));

const STORAGE_KEY = "cookie-consent-v1";

function renderBannerDom() {
  document.body.innerHTML = `
    <div id="cookie-banner" hidden>
      <button id="cookie-customize">Personalitzar</button>
      <button id="cookie-reject">Rebutjar</button>
      <button id="cookie-accept">Acceptar totes</button>
    </div>
    <div id="cookie-modal" hidden>
      <div id="cookie-modal-backdrop"></div>
      <input type="checkbox" id="cookie-cat-preferencies" />
      <input type="checkbox" id="cookie-cat-estadistiques" />
      <input type="checkbox" id="cookie-cat-marketing" />
      <button id="cookie-modal-close">Cancel·lar</button>
      <button id="cookie-modal-save">Desar preferències</button>
    </div>
    <button id="reopen-cookie-settings">Configuració de cookies</button>
  `;
}

describe("consent — categories and persistence", () => {
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

describe("mountCookieBanner — real DOM wiring (reproduces the reported bug if present)", () => {
  beforeEach(() => {
    localStorage.clear();
    updateAnalyticsConsent.mockClear();
    vi.resetModules();
    renderBannerDom();
  });

  it("shows the banner when there is no stored decision", async () => {
    const { mountCookieBanner } = await import("./consent");
    mountCookieBanner();
    expect((document.getElementById("cookie-banner") as HTMLElement).hidden).toBe(false);
  });

  it("keeps the banner hidden and re-applies consent when a decision is already stored", async () => {
    const { saveConsent, mountCookieBanner } = await import("./consent");
    saveConsent({ preferencies: false, estadistiques: true, marketing: false });
    updateAnalyticsConsent.mockClear();
    mountCookieBanner();
    expect((document.getElementById("cookie-banner") as HTMLElement).hidden).toBe(true);
    expect(updateAnalyticsConsent).toHaveBeenCalledWith({ estadistiques: true, marketing: false });
  });

  it('clicking "Acceptar totes" persists all categories granted and hides the banner', async () => {
    const { mountCookieBanner, getStoredConsent } = await import("./consent");
    mountCookieBanner();
    document.getElementById("cookie-accept")!.dispatchEvent(new Event("click", { bubbles: true }));
    expect(getStoredConsent()?.categories).toMatchObject({ estadistiques: true, marketing: true });
    expect((document.getElementById("cookie-banner") as HTMLElement).hidden).toBe(true);
  });

  it('clicking "Rebutjar" persists everything denied and hides the banner', async () => {
    const { mountCookieBanner, getStoredConsent } = await import("./consent");
    mountCookieBanner();
    document.getElementById("cookie-reject")!.dispatchEvent(new Event("click", { bubbles: true }));
    expect(getStoredConsent()?.categories).toMatchObject({ estadistiques: false, marketing: false });
    expect((document.getElementById("cookie-banner") as HTMLElement).hidden).toBe(true);
  });

  it('"Personalitzar" -> check only Estadístiques -> "Desar preferències" persists exactly that and closes both banner and modal', async () => {
    const { mountCookieBanner, getStoredConsent } = await import("./consent");
    mountCookieBanner();

    document.getElementById("cookie-customize")!.dispatchEvent(new Event("click", { bubbles: true }));
    expect((document.getElementById("cookie-modal") as HTMLElement).hidden).toBe(false);

    (document.getElementById("cookie-cat-estadistiques") as HTMLInputElement).checked = true;
    document.getElementById("cookie-modal-save")!.dispatchEvent(new Event("click", { bubbles: true }));

    expect(getStoredConsent()?.categories).toMatchObject({ estadistiques: true, marketing: false });
    expect(updateAnalyticsConsent).toHaveBeenCalledWith({ estadistiques: true, marketing: false });
    expect((document.getElementById("cookie-modal") as HTMLElement).hidden).toBe(true);
    expect((document.getElementById("cookie-banner") as HTMLElement).hidden).toBe(true);
  });

  it("reopening via the footer button pre-fills the modal with the stored choice", async () => {
    const { saveConsent, mountCookieBanner } = await import("./consent");
    saveConsent({ preferencies: false, estadistiques: true, marketing: false });
    mountCookieBanner();
    document
      .getElementById("reopen-cookie-settings")!
      .dispatchEvent(new Event("click", { bubbles: true }));
    expect((document.getElementById("cookie-cat-estadistiques") as HTMLInputElement).checked).toBe(true);
    expect((document.getElementById("cookie-cat-marketing") as HTMLInputElement).checked).toBe(false);
  });

  it("mounting twice (e.g. re-run in dev) does not throw and does not double-save on a single click", async () => {
    const { mountCookieBanner, getStoredConsent } = await import("./consent");
    mountCookieBanner();
    mountCookieBanner();
    document.getElementById("cookie-accept")!.dispatchEvent(new Event("click", { bubbles: true }));
    expect(updateAnalyticsConsent).toHaveBeenCalledTimes(1);
    expect(getStoredConsent()?.categories).toMatchObject({ estadistiques: true, marketing: true });
  });
});
