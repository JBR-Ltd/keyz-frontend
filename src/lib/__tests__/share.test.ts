import { describe, expect, it } from "vitest";
import {
  buildPublicShareUrl,
  formatSharePrice,
  getNativeShareData,
  getShareChannelUrls,
  type ShareContent,
} from "@/lib/share";

const PROPERTY_SHARE: ShareContent = {
  kind: "property",
  title: "Bright home in Lekki",
  description: "See this ₦2,000,000 home on Rello.",
  url: "https://www.rello.online/property/bright-home-p_1234567890abcdef",
  imageUrl: "https://media.example.com/home.jpg",
  location: "Lekki, Lagos",
  price: "₦2,000,000 per year",
};

describe("buildPublicShareUrl", () => {
  it("uses the configured origin and removes query and hash values", () => {
    expect(
      buildPublicShareUrl(
        "/property/bright-home-p_1234567890abcdef?from=saved#photos",
        "https://earlyaccess.rello.online",
      ),
    ).toBe(
      "https://earlyaccess.rello.online/property/bright-home-p_1234567890abcdef",
    );
  });

  it("rejects external and protocol-relative paths", () => {
    expect(() =>
      buildPublicShareUrl("https://example.com/home", "https://rello.online"),
    ).toThrow();
    expect(() =>
      buildPublicShareUrl("//example.com/home", "https://rello.online"),
    ).toThrow();
  });
});

describe("share channel URLs", () => {
  it("encodes Unicode copy and the canonical URL for every channel", () => {
    const channels = getShareChannelUrls(PROPERTY_SHARE);

    expect(new URL(channels.whatsapp).searchParams.get("text")).toBe(
      `${PROPERTY_SHARE.description}\n${PROPERTY_SHARE.url}`,
    );
    expect(new URL(channels.x).searchParams.get("text")).toBe(
      PROPERTY_SHARE.title,
    );
    expect(new URL(channels.x).searchParams.get("url")).toBe(
      PROPERTY_SHARE.url,
    );
    expect(new URL(channels.facebook).searchParams.get("u")).toBe(
      PROPERTY_SHARE.url,
    );
    expect(new URL(channels.email).searchParams.get("subject")).toBe(
      PROPERTY_SHARE.title,
    );
    expect(new URL(channels.email).searchParams.get("body")).toContain(
      "₦2,000,000",
    );
  });

  it("builds the native share payload from the same content", () => {
    expect(getNativeShareData(PROPERTY_SHARE)).toEqual({
      text: PROPERTY_SHARE.description,
      title: PROPERTY_SHARE.title,
      url: PROPERTY_SHARE.url,
    });
  });
});

describe("formatSharePrice", () => {
  it("uses the correct rental period", () => {
    expect(formatSharePrice(500000, "MONTHLY")).toBe("₦500,000 per month");
    expect(formatSharePrice(125000, "SHORT_STAY")).toBe("₦125,000 per night");
  });
});
