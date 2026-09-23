import React, { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import { useNavigate } from "react-router-dom";

const cities = [
  { id: "sousse", name: "Sousse", x: 0.60, y: 0.34 },
  { id: "monastir", name: "Monastir", x: 0.63, y: 0.36 },
  { id: "mahdia", name: "Mahdia", x: 0.66, y: 0.43 },
  { id: "hammamet", name: "Hammamet", x: 0.58, y: 0.27 },
];

function TunisiaMesh() {
  const navigate = useNavigate();
  const [paths, setPaths] = useState([]);
  const [viewBox, setViewBox] = useState(null);

  useEffect(() => {
    fetch("/tn.svg")
      .then((res) => res.text())
      .then((svgText) => {
        const loader = new SVGLoader();
        const data = loader.parse(svgText);
        setPaths(data.paths);

        const vb = svgText.match(/viewBox="([^"]+)"/i);
        if (vb) {
          const [minX, minY, width, height] = vb[1]
            .split(" ")
            .map(Number);
          setViewBox({ minX, minY, width, height });
        }
      });
  }, []);

  const transform = useMemo(() => {
    if (!viewBox) return null;

    const targetSize = 28; // BIGGER MAP
    const scale = targetSize / Math.max(viewBox.width, viewBox.height);

    const centerX = viewBox.minX + viewBox.width / 2;
    const centerY = viewBox.minY + viewBox.height / 2;

    return { scale, centerX, centerY };
  }, [viewBox]);

  if (!transform) return null;

  return (
    <group>
      {paths.map((p, i) => {
        const shapes = SVGLoader.createShapes(p);
        if (!shapes.length) return null;

        // Merge ALL shapes inside this path
        const geometries = shapes.map(
          (shape) =>
            new THREE.ExtrudeGeometry(shape, {
              depth: 1.4,
              bevelEnabled: false,
            })
        );

        const merged = THREE.BufferGeometryUtils
          ? THREE.BufferGeometryUtils.mergeGeometries(geometries)
          : geometries[0];

        merged.computeVertexNormals();
        merged.translate(-transform.centerX, -transform.centerY, 0);
        merged.scale(transform.scale, -transform.scale, 1);

        return (
          <mesh key={i} geometry={merged}>
            <meshStandardMaterial
              color="#f4f1eb"
              roughness={0.85}
              metalness={0.05}
            />
          </mesh>
        );
      })}

      {cities.map((c) => {
        const sx = viewBox.minX + c.x * viewBox.width;
        const sy = viewBox.minY + c.y * viewBox.height;

        const wx = (sx - transform.centerX) * transform.scale;
        const wy = -(sy - transform.centerY) * transform.scale;

        return (
          <group key={c.id} position={[wx, wy, 2]}>
            <mesh
              onClick={() => navigate(`/booking/${c.id}`)}
            >
              <sphereGeometry args={[0.35, 32, 32]} />
              <meshStandardMaterial
                color="#d62828"
                emissive="#b00020"
                emissiveIntensity={1}
              />
            </mesh>

            <Html distanceFactor={18}>
              <div
                style={{
                  background: "white",
                  padding: "8px 14px",
                  borderRadius: "25px",
                  fontSize: "13px",
                  fontWeight: 600,
                  boxShadow: "0 12px 25px rgba(0,0,0,0.25)",
                  transform: "translate(-50%, -170%)",
                  whiteSpace: "nowrap",
                }}
              >
                {c.name}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export default function TunisiaMap() {
  return (
    <div style={{ width: "100%", height: 750, background: "#e6e3df" }}>
      <Canvas camera={{ position: [0, 0, 45], fov: 35 }}>
        <ambientLight intensity={1.4} />
        <directionalLight position={[15, 25, 20]} intensity={1.2} />
        <directionalLight position={[-15, -10, 10]} intensity={0.4} />

        <TunisiaMesh />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.6}
        />
      </Canvas>
    </div>
  );
}
