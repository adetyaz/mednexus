import React from "react";

interface LoomVideoProps {
  videoId: string;
  title?: string;
  width?: string;
  autoplay?: boolean;
  hideOwner?: boolean;
}

const LoomVideo: React.FC<LoomVideoProps> = ({
  videoId,
  title,
  width = "100%",
  autoplay = false,
  hideOwner = true,
}) => {
  // Construct Loom URL with options
  const loomUrl = `https://www.loom.com/embed/${videoId}?sid=auto&hideEmbedTopBar=true${
    autoplay ? "&autoplay=1" : ""
  }${hideOwner ? "&hideOwner=1" : ""}`;

  return (
    <div className='loom-video-container' style={{ margin: "2rem 0" }}>
      {title && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.5rem 0",
            borderBottom: "2px solid var(--ifm-color-primary)",
            display: "inline-block",
          }}
        >
          <h4
            style={{
              margin: 0,
              color: "var(--ifm-color-primary)",
              fontSize: "1.1rem",
              fontWeight: 600,
            }}
          >
            🎬 {title}
          </h4>
        </div>
      )}
      <div
        style={{
          position: "relative",
          paddingBottom: "56.25%", // 16:9 aspect ratio
          height: 0,
          overflow: "hidden",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
          border: "1px solid var(--ifm-color-emphasis-200)",
          width: width,
          backgroundColor: "#f8f9fa",
        }}
      >
        <iframe
          src={loomUrl}
          frameBorder='0'
          allowFullScreen
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            borderRadius: "12px",
          }}
          title={title || "Loom Video"}
          loading='lazy'
        />
      </div>
    </div>
  );
};

export default LoomVideo;
