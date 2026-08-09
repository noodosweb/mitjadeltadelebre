/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from "vitest";
import { applyConsent, getStoredConsent, initConsent, saveConsent } from "./consent";

describe("consent", () => {
  beforeEach(() => {
    localStorage.clear();
    window.dataLayer = [];
    delete window.gtag;
  });

  it("bootstraps consent default with the 4 signals denied when no core exists", () => {
    initConsent();
    const def = window.dataLayer.find(
      (entry) => entry[0] === "consent" && entry[1] === "default"
    );
    expect(def).toBeDefined();
    expect(def[2]).toMatchObject({
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  });

  it("does not push a second consent default if a core already exists", () => {
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments as unknown as unknown[]);
    };
    initConsent();
    const defaults = window.dataLayer.filter(
      (entry) => entry[0] === "consent" && entry[1] === "default"
    );
    expect(defaults).toHaveLength(0);
  });

  it("maps statistics to analytics_storage", () => {
    initConsent();
    applyConsent({ preferences: false, statistics: true, marketing: false });
    const update = window.dataLayer.find(
      (entry) => entry[0] === "consent" && entry[1] === "update"
    );
    expect(update[2]).toMatchObject({
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  });

  it("maps marketing to the three ad signals", () => {
    initConsent();
    applyConsent({ preferences: false, statistics: false, marketing: true });
    const update = window.dataLayer.find(
      (entry) => entry[0] === "consent" && entry[1] === "update"
    );
    expect(update[2]).toMatchObject({
      analytics_storage: "denied",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
  });

  it("persists and restores the choice", () => {
    saveConsent({ preferences: true, statistics: true, marketing: false });
    expect(getStoredConsent()).toEqual({
      preferences: true,
      statistics: true,
      marketing: false,
    });
  });

  it("returns null when nothing is stored", () => {
    expect(getStoredConsent()).toBeNull();
  });

  it("re-applies the stored consent on init", () => {
    saveConsent({ preferences: false, statistics: true, marketing: false });
    initConsent();
    const update = window.dataLayer.find(
      (entry) => entry[0] === "consent" && entry[1] === "update"
    );
    expect(update).toBeDefined();
    expect(update[2]).toMatchObject({ analytics_storage: "granted" });
  });
});
