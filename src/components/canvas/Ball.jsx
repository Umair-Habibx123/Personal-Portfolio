// import React, { Suspense } from "react";
// import { Canvas } from "@react-three/fiber";
// import {
//   Decal,
//   Float,
//   OrbitControls,
//   Preload,
//   useTexture,
// } from "@react-three/drei";
// import Loader from "../Loader";

// const Ball = (props) => {
//   const [decal] = useTexture([props.imgUrl]);

//   return (
//     <Float speed={2.5} rotationIntensity={1} floatIntensity={2}>
//       <ambientLight intensity={0.25} />
//       <directionalLight position={[0, 0, 0.05]} />
//       <mesh castShadow receiveShadow scale={2.75}>
//         <icosahedronGeometry args={[1, 1]} />
//         {/* Reduce the detail level in your geometry, e.g., args={[1, 1]} instead of args={[1, 2]} */}
//         <meshStandardMaterial
//           color="#ffffff"
//           polygonOffset
//           polygonOffsetFactor={-5}
//           flatShading
//         />
//         <Decal
//           position={[0, 0, 1]}
//           rotation={[2 * Math.PI, 0, 6.25]}
//           flatShading
//           map={decal}
//         />
//       </mesh>
//     </Float>
//   );
// };

// const BallCanvas = ({ icon }) => {
//   return (
//     <Canvas frameloop="always" gl={{ preserveDrawingBuffer: true }}>
//       <Suspense fallback={<Loader />}>
//         <OrbitControls enableZoom={false} position0={0} />
//         <Ball imgUrl={icon} />
//       </Suspense>

//       <Preload all />
//     </Canvas>
//   );
// };

// export default BallCanvas;

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Decal,
  Float,
  OrbitControls,
  Preload,
  useTexture,
} from "@react-three/drei";
import Loader from "../Loader";

const Ball = (props) => {
  const [decal] = useTexture([props.imgUrl]);

  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
      <ambientLight intensity={0.2} />
      <directionalLight position={[0, 0, 0.05]} />
      <mesh castShadow receiveShadow scale={2.5}>
        <icosahedronGeometry args={[1, 1]} /> {/* Reduced subdivisions */}
        <meshStandardMaterial
          color="#e0e0e0"
          polygonOffset
          polygonOffsetFactor={-4}
          flatShading
        />
        <Decal
          position={[0, 0, 1]}
          rotation={[Math.PI * 2, 0, 0]}
          flatShading
          map={decal}
        />
      </mesh>
    </Float>
  );
};


const BallCanvas = ({ icon }) => {
  return (
    <Canvas
      frameloop="demand" // Optimize rendering for performance
      gl={{ preserveDrawingBuffer: true }}
      style={{ width: "100%", height: "auto" }} // Responsive size
    >
      <Suspense fallback={<Loader />}>
        <OrbitControls
          enableZoom={false}
          enablePan={false} // Disable unnecessary controls
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
        <Ball imgUrl={icon} />
      </Suspense>

      <Preload all />
    </Canvas>
  );
};

export default BallCanvas;
