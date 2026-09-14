import { ImageResponse } from "next/og";

export const alt = "Modex Engineers Architects";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(135deg, #f7f5f1 0%, #f1edf8 100%)",
          padding: "70px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            border: "1px solid rgba(20,0,63,0.12)",
            borderRadius: "28px",
            background: "rgba(255,255,255,0.72)",
          }}
        >
          <img
            src="https://modexengineers.com/logo/modex-logo.svg"
            width="500"
            height="250"
            style={{
              objectFit: "contain",
              marginBottom: "32px",
            }}
          />

          <div
            style={{
              display: "flex",
              fontSize: "25px",
              letterSpacing: "7px",
              textTransform: "uppercase",
              color: "#5E3DC0",
              fontWeight: 700,
            }}
          >
            Architecture · Engineering · Construction
          </div>

          <div
            style={{
              display: "flex",
              marginTop: "28px",
              fontSize: "22px",
              color: "#6c6670",
              letterSpacing: "2px",
            }}
          >
            modexengineers.com
          </div>
        </div>
      </div>
    ),
    size
  );
}
