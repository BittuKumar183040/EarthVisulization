import React, { useRef } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Bounds, OrbitControls, Sphere, Stats, Text } from '@react-three/drei';
import * as THREE from 'three';
import earthTexture from '../asset/Equirectangular_projection_high.jpg';
import earthBumpTexture from '../asset/8081_earthbump4k.jpg';
import satellites from '../data/satellites.json';

const earth_radius = 100;

function randomAxisPoints(radius) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  return [x, y, z];
}

const TextBoard = ({ position, text }) => {
  const textRef = useRef();
  const { camera } = useThree();
  const moveAmount = 80;
  const directionToCenter = new THREE.Vector3(0, 0, 0)
    .sub(new THREE.Vector3(...position))
    .normalize();
  const newPosition = new THREE.Vector3(...position).add(
    directionToCenter.multiplyScalar(moveAmount),
  );

  useFrame(() => {
    if (textRef.current) {
      textRef.current.lookAt(camera.position);
    }
  });
  return (
    <Text ref={textRef} position={newPosition} fontSize={4} color="black">
      {text}
    </Text>
  );
};

const Earth = ({ coverageData }) => {
  const earthRef = useRef();
  const { scene } = useThree()
  const earthMap = useLoader(THREE.TextureLoader, earthTexture);
  const bumpTexture = useLoader(THREE.TextureLoader, earthBumpTexture);

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0005;
    }
  });

  const handleCoverageClick = (e, coverage) => {
    const relatedSat = scene.children.filter((item)=>{
      return coverage.satellites.includes(item.name.split('_')[1]);
    })
    // relatedSat.push(e.intersections[0].object)
    scene.children.forEach((mesh) => {
      if (!relatedSat.includes(mesh) && mesh.material && mesh.name.startsWith('satellite_')) {
        mesh.material.color.set(0xffff00);
      }
    });

    relatedSat.forEach((mesh) => {
      if (mesh.material && mesh.name.startsWith('satellite_')) {
      mesh.material.color.set(0xff0000); 
      }
    });
    createLinesBetweenSatellites(relatedSat)
  }

  const createLinesBetweenSatellites = (relatedSat) => {
    scene.children = scene.children.filter((child) => !(child instanceof THREE.Line));
    relatedSat.forEach((sat, index) => {
      if (index === 0) return;
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
      const points = [
        relatedSat[0].position, 
        sat.position,
      ];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
    });
    
  };

  return (
    <group ref={earthRef}>
      <Sphere 
        args={[earth_radius, 40, 40]} 
        scale={0}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          map={earthMap}
          bumpMap={bumpTexture}
          bumpScale={0.5}
        />
      </Sphere>
      {coverageData.map((item, idx) => {
        const coverageArea = randomAxisPoints(earth_radius - 5);
        return (
          <group key={item.location} position={coverageArea}>
            <Sphere 
              args={[10, 20, 20]} 
              scale={1}
              onClick={(e)=>handleCoverageClick(e, item)}
            >
              <meshBasicMaterial
                attach={'material'}
                color={0x00ff00}
                transparent={true}
                opacity={0.5}
              />
            </Sphere>
            <TextBoard position={coverageArea} text={item.location} />
          </group>
        );
      })}
    </group>
  );
};

const Renderer = ({ parameters, coverage_data, selectedCoverage }) => {

  const randomValue = (start, end) => {
    return Math.random() * (end - start) + start;
  };

  return (
    <Canvas>
      <ambientLight intensity={3} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls />
      <Bounds fit margin={1} observe>
        <Earth coverageData={coverage_data} />
      </Bounds>
      {satellites.map((item, idx) => {
        const satellitePos = randomAxisPoints(
          earth_radius + randomValue(5, 10),
        );
        return (
          <Sphere
            key={item.satellite}
            name={"satellite_"+item.satellite}
            args={[randomValue(0.5, 1), 5, 5]}
            scale={1}
            position={satellitePos}
          >
            <meshBasicMaterial attach={'material'} color={0xffff00} />
          </Sphere>
        );
      })}
      <Stats />
    </Canvas>
  );
};

export default Renderer;
