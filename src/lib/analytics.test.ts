/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from "vitest";
import { initAnalytics, trackPageView, updateAnalyticsConsent } from "./analytics";

describe("analytics", () => {
  beforeEach(() => {
    window.dataLayer = [];
    delete window.gtag;
  });

  it("initializes with Consent Mode v2 denied by default before config", () => {
    initAnalytics();
    const consentDefault = window.dataLayer.find(
      (entry) => entry[0] === "consent" && entry[1] === "default"
    );
    const configCall = window.dataLayer.find((entry) => entry[0] === "config");

    expect(consentDefault).toBeDefined();
    expect(consentDefault[2]).toMatchObject({ analytics_storage: "denied" });
    expect(window.dataLayer.indexOf(consentDefault)).toBeLessThan(
      window.dataLayer.indexOf(configCall)
    );
  });

  it("updates consent to granted", () => {
    initAnalytics();
    updateAnalyticsConsent(true);
    const update = window.dataLayer.find(
      (entry) => entry[0] === "consent" && entry[1] === "update"
    );
    expect(update[2]).toMatchObject({ analytics_storage: "granted" });
  });

  it("updates consent to denied", () => {
    initAnalytics();
    updateAnalyticsConsent(false);
    const update = window.dataLayer.find(
      (entry) => entry[0] === "consent" && entry[1] === "update"
    );
    expect(update[2]).toMatchObject({ analytics_storage: "denied" });
  });

  it("tracks a page view with the given path", () => {
    initAnalytics();
    trackPageView("/");
    const pageView = window.dataLayer.find(
      (entry) => entry[0] === "event" && entry[1] === "page_view"
    );
    expect(pageView).toBeDefined();
    expect(pageView[2]).toMatchObject({ page_path: "/" });
  });

  it("does not push a second consent default if a consent core already exists", () => {
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments as unknown as unknown[]);
    };
    initAnalytics();
    const defaults = window.dataLayer.filter(
      (entry) => entry[0] === "consent" && entry[1] === "default"
    );
    expect(defaults).toHaveLength(0);
  });
});
