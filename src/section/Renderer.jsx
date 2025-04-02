import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Bounds, OrbitControls, Sphere, Stats, Text } from '@react-three/drei';
import * as THREE from 'three';
import earthTexture from '../asset/Equirectangular_projection_high.jpg';
import earthBumpTexture from '../asset/8081_earthbump4k.jpg';
import satellites from '../data/satellites.json';

const earth_radius = 100;

let scaleUp = true;
let animationFrame;
const animateScale = (mesh, speed = 0.001) => {
  if (!mesh) return;
  animationFrame = requestAnimationFrame(() => animateScale(mesh));
  if (scaleUp) {
    mesh.scale.x += speed;
    mesh.scale.y += speed;
    mesh.scale.z += speed;
    if (mesh.scale.x >= 1.25) scaleUp = false; // Reverse direction
  } else {
    mesh.scale.x -= speed;
    mesh.scale.y -= speed;
    mesh.scale.z -= speed;
    if (mesh.scale.x <= 1.1) scaleUp = true; // Reverse direction again
  }
};

const stopScaleAnimation = () => {
  if (animationFrame) cancelAnimationFrame(animationFrame);
};


function randomAxisPoints(radius) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  return [x, y, z];
}

const TextBoard = ({ position, text, size }) => {
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
    <Text ref={textRef}
      position={newPosition}
      outlineOpacity={0.5}
      outlineWidth={0.1}
      fontSize={size}
      color="green">
      {text}
    </Text>
  );
};

const Earth = ({ coverageData }) => {
  const earthRef = useRef();
  const groupRef = useRef();
  const { scene } = useThree();
  const earthMap = useLoader(THREE.TextureLoader, earthTexture);
  const bumpTexture = useLoader(THREE.TextureLoader, earthBumpTexture);

  // to get selected coverage mesh cause its inside group of meshes. (used to reset the coverage mofications)
  function groupChildren(children) {
    children.forEach((child) => {
      if (child.type === 'Mesh' && child.name.startsWith('coverage_')) {
        child.material.color.set(0x00ff00);
        child.scale.set(1, 1, 1);
      }
      if (child.children && child.children.length > 0) {
        groupChildren(child.children);
      }
    });
  }

  const handleCoverageClick = (e, coverage) => {
    const relatedSat = scene.children.filter((item) => {
      return coverage.satellites.includes(item.name.split('_')[1]);
    });
    // Reset to initial color
    scene.children.forEach((mesh) => {
      if (mesh.type === 'Group') {
        groupChildren(mesh.children);
      }
      if (mesh.material) {
        if (mesh.name.startsWith('satellite_')) {
          mesh.material.color.set(0xffff00);
        }
      }
    });

    // Show Active Coverage Area
    const interactedCoverageField = e.intersections[0].object;
    interactedCoverageField.material.color.set(0xff0000);
    stopScaleAnimation();
    animateScale(interactedCoverageField, 0.001);

    // Show active connected Satellites
    relatedSat.forEach((mesh) => {
      if (mesh.material && mesh.name.startsWith('satellite_')) {
        mesh.material.color.set(0xff0000);
      }
    });

    // relatedSat.push(interactedCoverageField);
    showSatellitesNames(relatedSat);
    relatedSat.unshift(interactedCoverageField.parent);
    createLinesBetweenSatellites(relatedSat);
  };

  const showSatellitesNames = (relatedSat) => {
    scene.children = scene.children.filter(
      (child) => !(child instanceof THREE.Sprite),
    );

    relatedSat.forEach((sat) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.font = '55px Arial';
      context.fillStyle = 'red';
      context.outlineOpacity = 0.5;
      context.outlineWidth = 0.1;
      context.fillText(sat.name.split('_')[1], 10, 50);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
      });

      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(sat.position);
      sprite.scale.set(20, 10, 5);
      scene.add(sprite);
    });
  };

  const createLinesBetweenSatellites = (relatedSat) => {
    scene.children = scene.children.filter(
      (child) => !(child instanceof THREE.Line),
    );

    relatedSat.forEach((sat, index) => {
      if (index === 0) return;

      const startPos = relatedSat[0].position.clone();
      startPos.normalize().multiplyScalar(earth_radius + 10);

      const endPos = sat.position.clone();
      endPos.normalize().multiplyScalar(earth_radius + 10);

      const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
      midPoint.normalize().multiplyScalar(earth_radius + 20);

      const startHandle = new THREE.Vector3().addVectors(startPos, midPoint).multiplyScalar(0.5);
      startHandle.normalize().multiplyScalar(earth_radius + 15);

      const endHandle = new THREE.Vector3().addVectors(endPos, midPoint).multiplyScalar(0.5);
      endHandle.normalize().multiplyScalar(earth_radius + 15);

      const curve = new THREE.CatmullRomCurve3([startPos, startHandle, midPoint, endHandle, endPos]);

      const points = curve.getPoints(50);
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineDashedMaterial({
        color: 0xff0000,
        dashSize: 1,
        gapSize: 1,
        linewidth: 1,
        transparent: true,
        opacity: 0.5,
      });

      const line = new THREE.Line(lineGeometry, lineMaterial);
      line.computeLineDistances();
      scene.add(line);
    });
  };


  return (
    <group ref={earthRef}>
      {/* Earth Radius */}
      <Sphere args={[earth_radius, 40, 40]} scale={1} position={[0, 0, 0]}>
        <meshStandardMaterial
          map={earthMap}
          bumpMap={bumpTexture}
          bumpScale={0.5}
        />
      </Sphere>

      {/* Coverage Cones */}
      {coverageData.map((item, idx) => {
        const coverageArea = randomAxisPoints(earth_radius - 5);
        return (
          <group ref={groupRef} key={item.location} position={coverageArea}>
            <Sphere
              args={[10, 20, 20]}
              scale={1}
              name={'coverage_' + item.location}
              onClick={(e) => handleCoverageClick(e, item)}
            >
              <meshBasicMaterial
                attach={'material'}
                color={0x00ff00}
                transparent={true}
                opacity={0.6}
              />
            </Sphere>
            <TextBoard position={coverageArea} text={item.location} size={4} />
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
      <OrbitControls enablePan={false} />
      <Bounds fit margin={1} observe>
        <Earth coverageData={coverage_data} />
      </Bounds>

      {/* Satellites  */}
      {satellites.map((item, idx) => {
        const satellitePos = randomAxisPoints(earth_radius + 10);
        return (
          <Sphere
            key={item.satellite}
            name={'satellite_' + item.satellite}
            args={[randomValue(0.5, 1), 5, 5]}
            scale={1}
            position={satellitePos}
          >
            <meshBasicMaterial attach={'material'} color={0xffff00} />
          </Sphere>
        );
      })}
    </Canvas>
  );
};

export default Renderer;
