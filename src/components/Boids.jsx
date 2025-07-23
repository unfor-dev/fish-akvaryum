import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useAtom } from "jotai";
import { useEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";
import { SkeletonUtils } from "three-stdlib";
import { randFloat, randInt } from "three/src/math/MathUtils.js";
import { themeAtom, THEMES } from "./UI";

function remap(value, low1, high1, low2, high2) {
  return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
}

const limits = new Vector3();
const wander = new Vector3();
const horizontalWander = new Vector3();
const alignment = new Vector3();
const avoidance = new Vector3();
const cohesion = new Vector3();
const steering = new Vector3();

// Static values instead of controls
const config = {
  NB_BOIDS: 40,
  MIN_SCALE: 0.7,
  MAX_SCALE: 1.3,
  MIN_SPEED: 0.6,
  MAX_SPEED: 0.4,
  MAX_STEERING: 0.1,
  threeD: true,
  ALIGNEMENT: true,
  AVOIDANCE: true,
  COHESION: true,
  WANDER_RADIUS: 5,
  WANDER_STRENGTH: 2,
  WANDER_CIRCLE: false,
  ALIGN_RADIUS: 1.2,
  ALIGN_STRENGTH: 4,
  ALIGN_CIRCLE: false,
  AVOID_RADIUS: 0.8,
  AVOID_STRENGTH: 2,
  AVOID_CIRCLE: false,
  COHESION_RADIUS: 1.22,
  COHESION_STRENGTH: 4,
  COHESION_CIRCLE: false
};

export const Boids = ({ boundaries }) => {
  const [theme] = useAtom(themeAtom);

  const boids = useMemo(() => {
    return new Array(config.NB_BOIDS).fill().map((_, i) => ({
      model: THEMES[theme].models[randInt(0, THEMES[theme].models.length - 1)],
      position: new Vector3(
        randFloat(-boundaries.x / 2, boundaries.x / 2),
        randFloat(-boundaries.y / 2, boundaries.y / 2),
        config.threeD ? randFloat(-boundaries.z / 2, boundaries.z / 2) : 0
      ),
      velocity: new Vector3(0, 0, 0),
      wander: randFloat(0, Math.PI * 2),
      scale: randFloat(config.MIN_SCALE, config.MAX_SCALE),
    }));
  }, [config.NB_BOIDS, boundaries, theme]);

  useFrame((_, delta) => {
    for (let i = 0; i < boids.length; i++) {
      const boid = boids[i];

      // WANDER
      boid.wander += randFloat(-0.05, 0.05);

      wander.set(
        Math.cos(boid.wander) * config.WANDER_RADIUS,
        Math.sin(boid.wander) * config.WANDER_RADIUS,
        0
      );

      wander.normalize();
      wander.multiplyScalar(config.WANDER_STRENGTH);

      horizontalWander.set(
        Math.cos(boid.wander) * config.WANDER_RADIUS,
        0,
        Math.sin(boid.wander) * config.WANDER_RADIUS
      );

      horizontalWander.normalize();
      horizontalWander.multiplyScalar(config.WANDER_STRENGTH);

      // RESET FORCES
      limits.multiplyScalar(0);
      steering.multiplyScalar(0);
      alignment.multiplyScalar(0);
      avoidance.multiplyScalar(0);
      cohesion.multiplyScalar(0);

      // LIMITS
      if (Math.abs(boid.position.x) + 1 > boundaries.x / 2) {
        limits.x = -boid.position.x;
        boid.wander += Math.PI;
      }
      if (Math.abs(boid.position.y) + 1 > boundaries.y / 2) {
        limits.y = -boid.position.y;
        boid.wander += Math.PI;
      }
      if (Math.abs(boid.position.z) + 1 > boundaries.z / 2) {
        limits.z = -boid.position.z;
        boid.wander += Math.PI;
      }
      limits.normalize();
      limits.multiplyScalar(50);

      let totalCohesion = 0;

      // Loop through all boids
      for (let b = 0; b < boids.length; b++) {
        if (b === i) continue;
        
        const other = boids[b];
        let d = boid.position.distanceTo(other.position);
        
        // ALIGNEMENT
        if (d > 0 && d < config.ALIGN_RADIUS && config.ALIGNEMENT) {
          const copy = other.velocity.clone();
          copy.normalize();
          copy.divideScalar(d);
          alignment.add(copy);
        }

        // AVOID
        if (d > 0 && d < config.AVOID_RADIUS && config.AVOIDANCE) {
          const diff = boid.position.clone().sub(other.position);
          diff.normalize();
          diff.divideScalar(d);
          avoidance.add(diff);
        }

        // COHESION
        if (d > 0 && d < config.COHESION_RADIUS && config.COHESION) {
          cohesion.add(other.position);
          totalCohesion++;
        }
      }

      // APPLY FORCES
      steering.add(limits);
      steering.add(wander);
      if (config.threeD) {
        steering.add(horizontalWander);
      }

      if (config.ALIGNEMENT) {
        alignment.normalize();
        alignment.multiplyScalar(config.ALIGN_STRENGTH);
        steering.add(alignment);
      }

      if (config.AVOIDANCE) {
        avoidance.normalize();
        avoidance.multiplyScalar(config.AVOID_STRENGTH);
        steering.add(avoidance);
      }

      if (config.COHESION && totalCohesion > 0) {
        cohesion.divideScalar(totalCohesion);
        cohesion.sub(boid.position);
        cohesion.normalize();
        cohesion.multiplyScalar(config.COHESION_STRENGTH);
        steering.add(cohesion);
      }

      steering.clampLength(0, config.MAX_STEERING * delta);
      boid.velocity.add(steering);
      boid.velocity.clampLength(
        0,
        remap(boid.scale, config.MIN_SCALE, config.MAX_SCALE, config.MAX_SPEED, config.MIN_SPEED) * delta
      );

      // APPLY VELOCITY
      boid.position.add(boid.velocity);
    }
  });

  return boids.map((boid, index) => (
    <Boid
      key={index + boid.model}
      position={boid.position}
      model={boid.model}
      scale={boid.scale}
      velocity={boid.velocity}
      animation={"Fish_Armature|Swimming_Fast"}
      wanderCircle={config.WANDER_CIRCLE}
      wanderRadius={config.WANDER_RADIUS / boid.scale}
      alignCircle={config.ALIGN_CIRCLE}
      alignRadius={config.ALIGN_RADIUS / boid.scale}
      avoidCircle={config.AVOID_CIRCLE}
      avoidRadius={config.AVOID_RADIUS / boid.scale}
      cohesionCircle={config.COHESION_CIRCLE}
      cohesionRadius={config.COHESION_RADIUS / boid.scale}
    />
  ));
};

const Boid = ({
  position,
  velocity,
  model,
  animation,
  wanderCircle,
  wanderRadius,
  alignCircle,
  alignRadius,
  avoidCircle,
  avoidRadius,
  cohesionCircle,
  cohesionRadius,
  ...props
}) => {
  const { scene, animations } = useGLTF(`/models/${model}.glb`);
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const group = useRef();
  const { actions } = useAnimations(animations, group);
  
  useEffect(() => {
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
  }, []);

  useEffect(() => {
    actions[animation]?.play();
    return () => {
      actions[animation]?.stop();
    };
  }, [animation]);

  useFrame(() => {
    const target = group.current.clone(false);
    target.lookAt(group.current.position.clone().add(velocity));
    group.current.quaternion.slerp(target.quaternion, 0.1);
    group.current.position.copy(position);
  });

  return (
    <group {...props} ref={group} position={position}>
      <primitive object={clone} rotation-y={Math.PI / 2} />
      <mesh visible={wanderCircle}>
        <sphereGeometry args={[wanderRadius, 32]} />
        <meshBasicMaterial color={"red"} wireframe />
      </mesh>
      <mesh visible={alignCircle}>
        <sphereGeometry args={[alignRadius, 32]} />
        <meshBasicMaterial color={"green"} wireframe />
      </mesh>
      <mesh visible={avoidCircle}>
        <sphereGeometry args={[avoidRadius, 32]} />
        <meshBasicMaterial color={"blue"} wireframe />
      </mesh>
      <mesh visible={cohesionCircle}>
        <sphereGeometry args={[cohesionRadius, 32]} />
        <meshBasicMaterial color={"yellow"} wireframe />
      </mesh>
    </group>
  );
};