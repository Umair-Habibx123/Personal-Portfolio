// React component an interactive 3D visual element using the Three.js library, specifically
// with the @react-three/fiber and @react-three/drei packages

//Ball UI/Canvas

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Decal,
  Float,
  OrbitControls,
  Preload,
  useTexture,
} from "@react-three/drei";
import useIsLaptop from "../../utils/useInLaptop";
import LowQualityBackground from "../../utils/LowQualityBackgound";
import Loader from "../Loader";

const Ball = (props) => {
  const [decal] = useTexture([props.imgUrl]);

  return (
    <Float speed={2.5} rotationIntensity={1} floatIntensity={2}>
      <ambientLight intensity={0.25} />
      <directionalLight position={[0, 0, 0.05]} />
      <mesh castShadow receiveShadow scale={2.75}>
        <icosahedronGeometry args={[1, 2]} />
        {/* <sphereGeometry args={[1, 64, 64]} /> */}
        <meshStandardMaterial
          color="#efefef"
          polygonOffset
          polygonOffsetFactor={-5}
          flatShading
        />
        <Decal
          position={[0, 0, 1]}
          rotation={[2 * Math.PI, 0, 6.25]}
          flatShading
          map={decal}
        />
      </mesh>
    </Float>
  );
};

const BallCanvas = ({ icon }) => {
  const isLaptop = useIsLaptop();
  return isLaptop ? (
    <Canvas
      frameloop="always" // "demand" Optimize rendering for performance
      gl={{ preserveDrawingBuffer: true }}
      style={{ width: "120%", height: "auto" }} // Responsive size
      // camera={{ position: [0, 0, 9], fov: 50 }}
    >
      <Suspense fallback={<Loader />}>
        <OrbitControls
          enableZoom={false}
          position0={0}
          // maxPolarAngle={Math.PI / 2}
          // minPolarAngle={Math.PI / 2}
        />
        <Ball imgUrl={icon} />
      </Suspense>

      <Preload all />
    </Canvas>
  ) : (
    <LowQualityBackground icon={icon} />
  );
};

export default BallCanvas;

// //Cube UI/Canvas

// import React from "react";
// import { Canvas } from "@react-three/fiber";
// import {
//   Decal,
//   Float,
//   OrbitControls,
//   Preload,
//   useTexture,
// } from "@react-three/drei";
// import useIsLaptop from "../../utils/useInLaptop"; // Assuming your hook is in this file
// import LowQualityBackground from "../../utils/LowQualityBackgound";
// import Loader from "../Loader";

// const Cube = (props) => {
//   const [decal] = useTexture([props.imgUrl]);

//   return (
//     <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
//       <ambientLight intensity={0.3} />
//       <directionalLight position={[0, 1, 1]} />
//       <mesh castShadow receiveShadow scale={2.5}>
//         <boxGeometry args={[1.5, 1.5, 1.5]} />
//         <meshStandardMaterial
//           color="#e9ecef"
//           polygonOffset
//           polygonOffsetFactor={-2}
//           flatShading
//         />
//         <Decal
//           position={[0, 0, 0.75]}
//           rotation={[0, 0, 0]}
//           flatShading
//           map={decal}
//         />
//       </mesh>
//     </Float>
//   );
// };

// const CubeCanvas = ({ icon }) => {
//   const isLaptop = useIsLaptop();

//   return isLaptop ? (
//     <Canvas
//       frameloop="demand"
//       gl={{ preserveDrawingBuffer: true }}
//       style={{ width: "100%", height: "auto" }}
//     >
//       <React.Suspense fallback={<Loader />}>
//         <OrbitControls
//           enableZoom={false}
//           enablePan={false}
//           maxPolarAngle={Math.PI / 2}
//           minPolarAngle={Math.PI / 2}
//         />
//         <Cube imgUrl={icon} />
//       </React.Suspense>

//       <Preload all />
//     </Canvas>
//   ) : (
//     <LowQualityBackground icon={icon} />
//   );
// };

// export default CubeCanvas;
