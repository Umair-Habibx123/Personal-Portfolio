const LowQualityBackground = ({ icon }) => (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #e0e0e0, #cfcfcf)", // A simple gradient
        borderRadius: "50%", // Make it a perfect circle/ remove for square
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Optional: Add shadow for depth
      }}
    >
      <img
        src={icon}
        alt="technology-icon"
        style={{
          width: "60px",
          height: "60px",
          objectFit: "contain",
          filter: "grayscale(50%)", // Apply a low-quality effect
        }}
      />
    </div>
  );


  export default LowQualityBackground;
