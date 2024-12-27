// // React component an interactive 3D visual element using the Three.js library, specifically
// // with the @react-three/fiber and @react-three/drei packages

//  //Ball UI/Canvas

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
//     // <Float speed={2.5} rotationIntensity={1} floatIntensity={2}>
//     <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
//       {/* <ambientLight intensity={0.25} /> */}
//       <ambientLight intensity={0.2} />
//       <directionalLight position={[0, 0, 0.05]} />
//       {/* <mesh castShadow receiveShadow scale={2.75}> */}
//       <mesh castShadow receiveShadow scale={2.5}>
//         <icosahedronGeometry args={[1, 2]} />
//         {/* <icosahedronGeometry args={[1, 1]} />  */}
//         <meshStandardMaterial
//           color="#e0e0e0"
//           polygonOffset
//           // polygonOffsetFactor={-5}
//           polygonOffsetFactor={-4}
//           flatShading
//         />
//         {/* <Decal
//           position={[0, 0, 1]}
//           rotation={[2 * Math.PI, 0, 6.25]}
//           flatShading
//           map={decal}
//         /> */}
//         <Decal
//           position={[0, 0, 1]}
//           rotation={[Math.PI * 2, 0, 0]}
//           flatShading
//           map={decal}
//         />
//       </mesh>
//     </Float>
//   );
// };

// const BallCanvas = ({ icon }) => {
//   return (
//     // <Canvas frameloop="always" gl={{ preserveDrawingBuffer: true }}>
//     <Canvas
//       frameloop="demand" // Optimize rendering for performance
//       gl={{ preserveDrawingBuffer: true }}
//       style={{ width: "100%", height: "auto" }} // Responsive size
//     >
//       <Suspense fallback={<Loader />}>
//         {/* <OrbitControls enableZoom={false} position0={0} /> */}
//         <OrbitControls
//           enableZoom={false}
//           enablePan={false} // Disable unnecessary controls
//           maxPolarAngle={Math.PI / 2}
//           minPolarAngle={Math.PI / 2}
//         />
//         <Ball imgUrl={icon} />
//       </Suspense>

//       <Preload all />
//     </Canvas>
//   );
// };

// export default BallCanvas;

// //Cube UI/Canvas

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

const Cube = (props) => {
  const [decal] = useTexture([props.imgUrl]);

  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[0, 1, 1]} />
      <mesh castShadow receiveShadow scale={2.5}>
        <boxGeometry args={[1.5, 1.5, 1.5]} /> {/* Creates a cube */}
        <meshStandardMaterial
          color="#e9ecef"
          polygonOffset
          polygonOffsetFactor={-2}
          flatShading
        />
        <Decal
          position={[0, 0, 0.75]} // Place the decal on the front face
          rotation={[0, 0, 0]} // No rotation
          flatShading
          map={decal}
        />
      </mesh>
    </Float>
  );
};

const CubeCanvas = ({ icon }) => {
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
        <Cube imgUrl={icon} />
      </Suspense>

      <Preload all />
    </Canvas>
  );
};

export default CubeCanvas;

// //Cylinder UI/Canvas

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

// const Cylinder = (props) => {
//   const [decal] = useTexture([props.imgUrl]);

//   return (
//     <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
//       <ambientLight intensity={0.3} />
//       <directionalLight position={[0, 1, 1]} />
//       <mesh castShadow receiveShadow scale={2.5}>
//         <cylinderGeometry args={[0.75, 0.75, 1.5, 32]} />{" "}
//         {/* Creates a cylinder */}
//         <meshStandardMaterial
//           color="#efefef"
//           polygonOffset
//           polygonOffsetFactor={-2}
//           flatShading
//         />
//         <Decal
//           position={[0, 0, 0.75]} // Place the decal on the top face
//           rotation={[0, 0, 0]} // No rotation
//           flatShading
//           map={decal}
//         />
//       </mesh>
//     </Float>
//   );
// };

// const CylinderCanvas = ({ icon }) => {
//   return (
//     <Canvas
//       frameloop="demand" // Optimize rendering for performance
//       gl={{ preserveDrawingBuffer: true }}
//       style={{ width: "100%", height: "auto" }} // Responsive size
//     >
//       <Suspense fallback={<Loader />}>
//         <OrbitControls
//           enableZoom={false}
//           enablePan={false} // Disable unnecessary controls
//           maxPolarAngle={Math.PI / 2}
//           minPolarAngle={Math.PI / 2}
//         />
//         <Cylinder imgUrl={icon} />
//       </Suspense>

//       <Preload all />
//     </Canvas>
//   );
// };

// export default CylinderCanvas;
