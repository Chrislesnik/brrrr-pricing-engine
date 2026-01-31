import { describe, expect, it } from "vitest";
import {
  isActivePath,
  createActiveChecker,
  findMostSpecificActive,
} from "../active";

describe("isActivePath", () => {
  describe("exact matches", () => {
    it("/settings is active on /settings", () => {
      expect(isActivePath("/settings", "/settings")).toBe(true);
    });

    it("root path matches", () => {
      expect(isActivePath("/", "/")).toBe(true);
    });
  });

  describe("child path matches", () => {
    it("/settings is active on /settings/profile", () => {
      expect(isActivePath("/settings/profile", "/settings")).toBe(true);
    });

    it("/settings is active on /settings/profile/details", () => {
      expect(isActivePath("/settings/profile/details", "/settings")).toBe(true);
    });
  });

  describe("segment boundary matching", () => {
    it("/settings is NOT active on /settings-billing", () => {
      expect(isActivePath("/settings-billing", "/settings")).toBe(false);
    });

    it("/user is NOT active on /users", () => {
      expect(isActivePath("/users", "/user")).toBe(false);
    });
  });

  describe("trailing slash handling", () => {
    it("/settings/ matches /settings", () => {
      expect(isActivePath("/settings/", "/settings")).toBe(true);
    });

    it("/settings matches /settings/", () => {
      expect(isActivePath("/settings", "/settings/")).toBe(true);
    });

    it("/settings/ matches /settings/", () => {
      expect(isActivePath("/settings/", "/settings/")).toBe(true);
    });
  });

  describe("query string handling", () => {
    it("/settings?tab=1 matches /settings", () => {
      expect(isActivePath("/settings?tab=1", "/settings")).toBe(true);
    });

    it("/settings matches /settings?tab=1 (target with query)", () => {
      expect(isActivePath("/settings", "/settings?tab=1")).toBe(true);
    });
  });

  describe("hash handling", () => {
    it("/settings#section matches /settings", () => {
      expect(isActivePath("/settings#section", "/settings")).toBe(true);
    });

    it("/settings matches /settings#section (target with hash)", () => {
      expect(isActivePath("/settings", "/settings#section")).toBe(true);
    });
  });

  describe("exact option", () => {
    it("exact match returns true", () => {
      expect(isActivePath("/settings", "/settings", { exact: true })).toBe(true);
    });

    it("child path returns false with exact", () => {
      expect(isActivePath("/settings/profile", "/settings", { exact: true })).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles empty paths", () => {
      expect(isActivePath("", "/settings")).toBe(false);
    });

    it("handles root against non-root", () => {
      // Root "/" should not be active when viewing "/settings"
      // because "/" is the root and "/settings" is a sub-path
      expect(isActivePath("/settings", "/")).toBe(false);
    });

    it("does not match different paths", () => {
      expect(isActivePath("/users", "/settings")).toBe(false);
    });
  });
});

describe("createActiveChecker", () => {
  it("creates a reusable checker", () => {
    const isActive = createActiveChecker("/settings/profile");

    expect(isActive("/settings")).toBe(true);
    expect(isActive("/settings/profile")).toBe(true);
    expect(isActive("/users")).toBe(false);
  });

  it("supports exact option", () => {
    const isActive = createActiveChecker("/settings/profile");

    expect(isActive("/settings", { exact: true })).toBe(false);
    expect(isActive("/settings/profile", { exact: true })).toBe(true);
  });
});

describe("findMostSpecificActive", () => {
  it("finds the most specific matching path", () => {
    const result = findMostSpecificActive("/settings/profile", [
      "/settings",
      "/settings/profile",
      "/users",
    ]);

    expect(result).toBe("/settings/profile");
  });

  it("returns undefined when no paths match", () => {
    const result = findMostSpecificActive("/dashboard", [
      "/settings",
      "/users",
    ]);

    expect(result).toBeUndefined();
  });

  it("returns the only matching path", () => {
    const result = findMostSpecificActive("/settings/billing", [
      "/settings",
      "/users",
    ]);

    expect(result).toBe("/settings");
  });

  it("handles empty paths array", () => {
    const result = findMostSpecificActive("/settings", []);

    expect(result).toBeUndefined();
  });
});
