import React from "react";

interface VideoProps {
  src: string;
  title?: string;
  aspectRatio?: "16:9" | "4:3" | "1:1";
  width?: string;
}

const Video: React.FC<VideoProps> = ({
  src,
  title = "Video",
  aspectRatio = "16:9",
  width = "100%",
}) => {
  const paddingBottom = {
    "16:9": "56.25%",
    "4:3": "75%",
    "1:1": "100%",
  };

  return (
    <div className='video-container' style={{ margin: "2rem 0" }}>
      {title && (
        <h4 style={{ marginBottom: "1rem", color: "var(--ifm-heading-color)" }}>
          🎥 {title}
        </h4>
      )}
      <div
        style={{
          position: "relative",
          paddingBottom: paddingBottom[aspectRatio],
          height: 0,
          overflow: "hidden",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          width: width,
        }}
      >
        <iframe
          src={src}
          frameBorder='0'
          allowFullScreen
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
          title={title}
        />
      </div>
    </div>
  );
};

export default Video;
