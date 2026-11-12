import { ImageResponse } from "next/og";

export const alt = "Rello, find your next home";
export const contentType = "image/png";
export const size = { height: 630, width: 1200 };

export default function OpenGraphImage(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#f7f2e9",
        color: "#003b55",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding: "72px",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#003b55",
            borderRadius: "28px",
            color: "#d5982f",
            display: "flex",
            fontSize: 58,
            fontWeight: 800,
            height: 124,
            justifyContent: "center",
            width: 124,
          }}
        >
          R
        </div>
        <div style={{ fontSize: 78, fontWeight: 800, marginTop: 34 }}>
          Find your next home.
        </div>
        <div style={{ color: "#5f6c76", fontSize: 30, marginTop: 22 }}>
          Rentals and shortlets with clear terms on Rello
        </div>
      </div>
    </div>,
    size,
  );
}
