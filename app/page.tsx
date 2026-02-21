import Link from "next/link";

export default function SplashScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "28%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,169,110,0.05) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ overflow: "hidden", lineHeight: 1 }}>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(58px,15vw,90px)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "#fff",
              letterSpacing: "0.04em",
              display: "block",
              animation: "slideUp 1s cubic-bezier(0.16,1,0.3,1) 0.2s both",
            }}
          >
            Koi Fes
          </span>
        </div>
        <div style={{ overflow: "hidden" }}>
          <span
            style={{
              fontFamily: "'Noto Sans JP', sans-serif",
              fontSize: "clamp(12px,3.2vw,20px)",
              fontWeight: 400,
              letterSpacing: "0.35em",
              color: "rgba(255,255,255,0.9)",
              display: "block",
              marginTop: 20,
              animation: "slideUp 1s cubic-bezier(0.16,1,0.3,1) 0.5s both",
            }}
          >
            恋 フ ェ ス  徳 島  2 0 2 6
          </span>
        </div>
        <div style={{ overflow: "hidden", marginTop: 16 }}>
          <span
            style={{
              fontFamily: "'Noto Sans JP', sans-serif",
              fontSize: "clamp(14px,3vw,18px)",
              fontWeight: 400,
              letterSpacing: "0.3em",
              color: "rgba(255,255,255,0.7)",
              display: "block",
              animation: "slideUp 1s cubic-bezier(0.16,1,0.3,1) 0.6s both",
            }}
          >
            恋フェス JAPAN
          </span>
        </div>
        <div
          style={{
            width: 1,
            margin: "44px auto",
            background: "#c8a96e",
            animation: "growLine 0.8s ease 1s both",
          }}
        />
        <Link
          href="/login"
          style={{
            fontFamily: "'Noto Sans JP', sans-serif",
            fontSize: 18,
            fontWeight: 400,
            letterSpacing: "0.35em",
            color: "rgba(255,255,255,0.7)",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            padding: "22px 64px",
            cursor: "pointer",
            animation: "fadeIn 0.8s ease 1.4s both",
            transition: "all 0.35s ease",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          ENTER
        </Link>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 32,
          fontSize: 12,
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.4)",
          animation: "fadeIn 1s ease 2s both",
        }}
      >
        NEXT-GEN EVENT PLATFORM
      </div>
    </div>
  );
}
