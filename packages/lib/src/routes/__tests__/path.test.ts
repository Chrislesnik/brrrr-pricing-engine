import { describe, expect, it } from "vitest";
import {
  qs,
  join,
  normalizePath,
  assertInternalPath,
  buildPath,
} from "../path";

describe("qs", () => {
  it("generates query string from params", () => {
    expect(qs({ status: "draft", page: 1 })).toBe("?status=draft&page=1");
  });

  it("filters out undefined values", () => {
    expect(qs({ status: "draft", filter: undefined })).toBe("?status=draft");
  });

  it("filters out null values", () => {
    expect(qs({ status: "draft", filter: null })).toBe("?status=draft");
  });

  it("returns empty string when no params", () => {
    expect(qs({})).toBe("");
  });

  it("returns empty string when all params are undefined", () => {
    expect(qs({ foo: undefined, bar: null })).toBe("");
  });

  it("handles boolean values", () => {
    expect(qs({ active: true })).toBe("?active=true");
  });
});

describe("join", () => {
  it("joins path segments", () => {
    expect(join("/users", "profile")).toBe("/users/profile");
  });

  it("handles trailing slashes", () => {
    expect(join("/users/", "/profile/")).toBe("/users/profile");
  });

  it("handles multiple segments", () => {
    expect(join("users", "profile", "settings")).toBe("/users/profile/settings");
  });

  it("ensures leading slash", () => {
    expect(join("users", "profile")).toBe("/users/profile");
  });

  it("handles empty parts", () => {
    expect(join("/users", "", "profile")).toBe("/users/profile");
  });

  it("handles undefined parts", () => {
    expect(join("/users", undefined, "profile")).toBe("/users/profile");
  });

  it("returns root for empty input", () => {
    expect(join()).toBe("/");
  });
});

describe("normalizePath", () => {
  it("removes trailing slash", () => {
    expect(normalizePath("/settings/")).toBe("/settings");
  });

  it("keeps root slash", () => {
    expect(normalizePath("/")).toBe("/");
  });

  it("removes query string", () => {
    expect(normalizePath("/settings?foo=bar")).toBe("/settings");
  });

  it("removes hash", () => {
    expect(normalizePath("/settings#section")).toBe("/settings");
  });

  it("removes both query and hash", () => {
    expect(normalizePath("/settings?foo=bar#section")).toBe("/settings");
  });

  it("removes duplicate slashes", () => {
    expect(normalizePath("//settings//profile//")).toBe("/settings/profile");
  });

  it("adds leading slash if missing", () => {
    expect(normalizePath("settings/profile")).toBe("/settings/profile");
  });
});

describe("assertInternalPath", () => {
  it("allows paths with leading slash", () => {
    expect(() => assertInternalPath("/settings")).not.toThrow();
  });

  it("allows https URLs", () => {
    expect(() => assertInternalPath("https://example.com")).not.toThrow();
  });

  it("allows http URLs", () => {
    expect(() => assertInternalPath("http://example.com")).not.toThrow();
  });

  it("allows mailto URLs", () => {
    expect(() => assertInternalPath("mailto:test@example.com")).not.toThrow();
  });

  it("allows tel URLs", () => {
    expect(() => assertInternalPath("tel:+1234567890")).not.toThrow();
  });

  it("rejects protocol-relative URLs", () => {
    expect(() => assertInternalPath("//evil.com")).toThrow(
      "Protocol-relative URLs are not allowed"
    );
  });

  it("rejects paths without leading slash", () => {
    expect(() => assertInternalPath("settings")).toThrow(
      "Internal paths must start with /"
    );
  });
});

describe("buildPath", () => {
  describe("single dynamic segments [param]", () => {
    it("replaces single param", () => {
      expect(buildPath("/users/[id]", { id: "123" })).toBe("/users/123");
    });

    it("replaces multiple params", () => {
      expect(buildPath("/org/[orgId]/users/[userId]", { orgId: "abc", userId: "123" })).toBe(
        "/org/abc/users/123"
      );
    });

    it("encodes special characters", () => {
      expect(buildPath("/users/[name]", { name: "John Doe" })).toBe("/users/John%20Doe");
    });

    it("throws for missing param", () => {
      expect(() => buildPath("/users/[id]", {})).toThrow("Missing required parameter: id");
    });

    it("throws for array value in single param", () => {
      expect(() => buildPath("/users/[id]", { id: ["1", "2"] })).toThrow(
        'Single parameter "id" cannot be an array'
      );
    });
  });

  describe("catch-all segments [...slug]", () => {
    it("joins array values with slashes", () => {
      expect(buildPath("/docs/[...slug]", { slug: ["api", "auth"] })).toBe("/docs/api/auth");
    });

    it("handles single-item array", () => {
      expect(buildPath("/docs/[...slug]", { slug: ["overview"] })).toBe("/docs/overview");
    });

    it("throws for non-array value", () => {
      expect(() => buildPath("/docs/[...slug]", { slug: "invalid" as unknown as string[] })).toThrow(
        'Catch-all parameter "slug" must be an array'
      );
    });

    it("throws for empty array", () => {
      expect(() => buildPath("/docs/[...slug]", { slug: [] })).toThrow(
        'Catch-all parameter "slug" cannot be empty'
      );
    });
  });

  describe("optional catch-all segments [[...slug]]", () => {
    it("joins array values with slashes", () => {
      expect(buildPath("/blog/[[...slug]]", { slug: ["2024", "post"] })).toBe("/blog/2024/post");
    });

    it("returns base path for empty array", () => {
      expect(buildPath("/blog/[[...slug]]", { slug: [] })).toBe("/blog");
    });

    it("returns base path for undefined", () => {
      expect(buildPath("/blog/[[...slug]]", { slug: undefined })).toBe("/blog");
    });

    it("returns base path when param not provided", () => {
      expect(buildPath("/blog/[[...slug]]", {})).toBe("/blog");
    });
  });

  describe("query parameters", () => {
    it("appends query string", () => {
      expect(buildPath("/users", {}, { page: 1, limit: 10 })).toBe("/users?page=1&limit=10");
    });

    it("combines path params and query", () => {
      expect(buildPath("/users/[id]", { id: "123" }, { tab: "profile" })).toBe(
        "/users/123?tab=profile"
      );
    });
  });

  describe("normalization", () => {
    it("normalizes result path", () => {
      expect(buildPath("/settings/", {})).toBe("/settings");
    });
  });
});
