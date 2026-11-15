import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getInternalBackDestination,
  peekInternalBackDestination,
  recordInternalRoute,
} from "../internalNavigation";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  snapshot(): Map<string, string> {
    return new Map(this.values);
  }
}

describe("internal back navigation", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal("window", { sessionStorage: storage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("peeks at the previous route without consuming navigation history", () => {
    recordInternalRoute("/browse?city=lagos");
    recordInternalRoute("/property/home-p_1234567890abcdef");
    const beforePeek = storage.snapshot();

    expect(
      peekInternalBackDestination(
        "/property/home-p_1234567890abcdef",
        "/browse",
      ),
    ).toBe("/browse?city=lagos");
    expect(storage.snapshot()).toEqual(beforePeek);
  });

  it("skips an outdated slug for the current public resource", () => {
    recordInternalRoute("/browse");
    recordInternalRoute("/property/old-name-p_1234567890abcdef");

    expect(
      peekInternalBackDestination(
        "/property/new-name-p_1234567890abcdef",
        "/browse",
      ),
    ).toBe("/browse");
  });

  it("skips incompatible role and authentication destinations", () => {
    recordInternalRoute("/tenant/dashboard");
    recordInternalRoute("/login");
    recordInternalRoute("/landlord/dashboard");
    recordInternalRoute("/tenant/settings");

    expect(
      peekInternalBackDestination("/tenant/settings", "/tenant/dashboard"),
    ).toBe("/tenant/dashboard");
  });

  it("consumes the selected destination only after navigation starts", () => {
    recordInternalRoute("/browse?query=lekki");
    recordInternalRoute("/property/home-p_1234567890abcdef");

    expect(
      getInternalBackDestination(
        "/property/home-p_1234567890abcdef",
        "/browse",
      ),
    ).toBe("/browse?query=lekki");

    const afterConsumption = storage.snapshot();
    recordInternalRoute("/browse?query=lekki");
    expect(storage.snapshot()).not.toEqual(afterConsumption);
    expect(peekInternalBackDestination("/browse?query=lekki", "/browse")).toBe(
      "/browse",
    );
  });
});
