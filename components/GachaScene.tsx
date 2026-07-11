"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  Float,
  RoundedBox,
  MeshTransmissionMaterial,
} from "@react-three/drei";
import {
  Physics,
  RigidBody,
  BallCollider,
  CylinderCollider,
  CuboidCollider,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";
import { pickWinnerIndex } from "@/lib/drawEngine";

type Phase = "idle" | "shaking" | "ejecting" | "opening";

const PALETTE = ["#FF6B6B", "#F2B33D", "#7FD8BE", "#8AB4F8", "#F7A6C4", "#B79CED"];

const DOME_R = 1.7;
const DOME_CENTER_Y = 2.15;
const WALL_R = 1.35;
const WALL_H = 1.0;
const FLOOR_Y = 1.55;
const CAPSULE_R = 0.22;
const MAX_CAPSULES = 14;

const CHUTE_POS = new THREE.Vector3(0, 0.35, 1.05);
const REVEAL_POS = new THREE.Vector3(0, 1.35, 2.6);

const SHAKE_MS = 1100;
const EJECT_MS = 900;
const OPEN_MS = 650;

function two(t: number, p0: THREE.Vector3, p1: THREE.Vector3) {
  return p0.clone().lerp(p1, t);
}

/** 클레이 스타일 가챠 머신 본체 */
function MachineBody() {
  return (
    <group>
      {/* 받침대 */}
      <RoundedBox args={[3.2, 0.3, 3.2]} radius={0.12} smoothness={4} position={[0, 0.15, 0]} receiveShadow>
        <meshStandardMaterial color="#efe6d8" roughness={0.6} />
      </RoundedBox>

      {/* 본체 */}
      <RoundedBox args={[2.2, 1.7, 2.2]} radius={0.22} smoothness={4} position={[0, 1.15, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#F2B33D" roughness={0.45} />
      </RoundedBox>

      {/* 코랄 트림 밴드 */}
      <RoundedBox args={[2.26, 0.28, 2.26]} radius={0.1} smoothness={4} position={[0, 0.55, 0]} castShadow>
        <meshStandardMaterial color="#FF6B6B" roughness={0.4} />
      </RoundedBox>

      {/* 네온 림 (돔 받침 고리) */}
      <mesh position={[0, DOME_CENTER_Y - 0.03, 0]}>
        <torusGeometry args={[1.55, 0.055, 16, 48]} />
        <meshStandardMaterial color="#7FD8BE" emissive="#7FD8BE" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>

      {/* 민트 포인트 패널 */}
      <RoundedBox args={[0.5, 0.5, 0.08]} radius={0.08} position={[-0.95, 1.35, 1.11]} castShadow>
        <meshStandardMaterial color="#7FD8BE" roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.5, 0.08]} radius={0.08} position={[0.95, 1.35, 1.11]} castShadow>
        <meshStandardMaterial color="#8AB4F8" roughness={0.4} />
      </RoundedBox>

      {/* 배출구 */}
      <RoundedBox args={[0.62, 0.42, 0.32]} radius={0.08} position={[0, 0.42, 1.02]} castShadow>
        <meshStandardMaterial color="#2b2320" roughness={0.8} />
      </RoundedBox>
    </group>
  );
}

function GlassDome() {
  return (
    <mesh position={[0, DOME_CENTER_Y, 0]} castShadow>
      <sphereGeometry args={[DOME_R, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
      <MeshTransmissionMaterial
        thickness={0.35}
        roughness={0.06}
        transmission={1}
        ior={1.15}
        chromaticAberration={0.02}
        backside
        samples={6}
        color="#eaf6ff"
      />
    </mesh>
  );
}

function CapsuleMesh({ color, r = CAPSULE_R }: { color: string; r?: number }) {
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[r, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      <mesh castShadow rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[r, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#fff8f0" roughness={0.25} />
      </mesh>
    </group>
  );
}

/** 돔 안쪽 캡슐 더미 - 물리 시뮬레이션 */
function CapsulePile({
  count,
  bodyRefs,
  colors,
}: {
  count: number;
  bodyRefs: React.MutableRefObject<(RapierRigidBody | null)[]>;
  colors: string[];
}) {
  const positions = useMemo(() => {
    const arr: [number, number, number][] = [];
    let i = 0;
    let ring = 0;
    while (i < count) {
      const ringCount = Math.min(6 + ring * 2, count - i);
      const ringR = 0.28 + ring * 0.42;
      for (let k = 0; k < ringCount && i < count; k++, i++) {
        const a = (k / ringCount) * Math.PI * 2 + ring * 0.4;
        arr.push([
          Math.cos(a) * ringR * 0.55,
          FLOOR_Y + 0.25 + ring * 0.42 + Math.random() * 0.1,
          Math.sin(a) * ringR * 0.55,
        ]);
      }
      ring++;
    }
    return arr;
  }, [count]);

  return (
    <>
      {positions.map((pos, i) => (
        <RigidBody
          key={i}
          ref={(el) => {
            bodyRefs.current[i] = el;
          }}
          colliders={false}
          position={pos}
          restitution={0.35}
          friction={0.6}
          angularDamping={0.6}
          linearDamping={0.35}
        >
          <BallCollider args={[CAPSULE_R]} />
          <CapsuleMesh color={colors[i % colors.length]} />
        </RigidBody>
      ))}
    </>
  );
}

/** 돔 내부를 감싸는 보이지 않는 원형 벽 (캡슐 이탈 방지) */
function ContainmentWalls() {
  const segments = 16;
  return (
    <RigidBody type="fixed" colliders={false} position={[0, FLOOR_Y, 0]}>
      <CylinderCollider args={[0.05, WALL_R]} position={[0, -0.05, 0]} />
      {Array.from({ length: segments }).map((_, i) => {
        const a = (i / segments) * Math.PI * 2;
        const x = Math.cos(a) * WALL_R;
        const z = Math.sin(a) * WALL_R;
        return (
          <CuboidCollider
            key={i}
            args={[0.14, WALL_H / 2, 0.05]}
            position={[x, WALL_H / 2, z]}
            rotation={[0, -a, 0]}
          />
        );
      })}
    </RigidBody>
  );
}

/** 배출 후 스크립트 비행 + 오픈 연출을 담당하는 캡슐 */
function FlyingCapsule({
  phase,
  progressRef,
  color,
  startPos,
}: {
  phase: Phase;
  progressRef: React.MutableRefObject<number>;
  color: string;
  startPos: THREE.Vector3;
}) {
  const group = useRef<THREE.Group>(null);
  const topHalf = useRef<THREE.Group>(null);
  const bottomHalf = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current) return;
    if (phase === "ejecting") {
      const t = progressRef.current;
      const mid = new THREE.Vector3(
        (startPos.x + CHUTE_POS.x) / 2,
        Math.max(startPos.y, CHUTE_POS.y) + 0.6,
        (startPos.z + CHUTE_POS.z) / 2
      );
      const a = two(t, startPos, mid);
      const b = two(t, mid, CHUTE_POS);
      const p1 = two(t, a, b);

      const mid2 = new THREE.Vector3(0, REVEAL_POS.y - 0.3, (CHUTE_POS.z + REVEAL_POS.z) / 2);
      const c = two(t, CHUTE_POS, mid2);
      const d = two(t, mid2, REVEAL_POS);
      const p2 = two(t, c, d);

      const pos = t < 0.35 ? p1 : two((t - 0.35) / 0.65, CHUTE_POS, p2);
      group.current.position.copy(pos);
      group.current.rotation.y += 0.25;
      group.current.rotation.x += 0.15;
    } else if (phase === "opening" || phase === "shaking") {
      group.current.position.copy(REVEAL_POS);
      group.current.rotation.set(0, 0, 0);
    }

    if (phase === "opening" && topHalf.current && bottomHalf.current) {
      const t = progressRef.current;
      topHalf.current.position.y = 0.05 + t * 0.5;
      topHalf.current.rotation.x = -t * 1.1;
      bottomHalf.current.position.y = -0.05 - t * 0.5;
      bottomHalf.current.rotation.x = t * 1.1;
    }
  });

  if (phase !== "ejecting" && phase !== "opening") return null;

  return (
    <group ref={group}>
      <group ref={topHalf}>
        <mesh castShadow>
          <sphereGeometry args={[CAPSULE_R * 1.6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} roughness={0.35} />
        </mesh>
      </group>
      <group ref={bottomHalf}>
        <mesh castShadow rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[CAPSULE_R * 1.6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#fff8f0" roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

function CameraRig({ phaseRef }: { phaseRef: React.MutableRefObject<Phase> }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, DOME_CENTER_Y - 0.3, 0));

  useFrame(() => {
    const phase = phaseRef.current;
    let camTarget: THREE.Vector3;
    let lookTarget: THREE.Vector3;

    if (phase === "idle") {
      camTarget = new THREE.Vector3(0, 2.4, 6.2);
      lookTarget = new THREE.Vector3(0, DOME_CENTER_Y - 0.2, 0);
    } else if (phase === "shaking") {
      camTarget = new THREE.Vector3(0, 2.1, 4.6);
      lookTarget = new THREE.Vector3(0, DOME_CENTER_Y - 0.2, 0);
    } else if (phase === "ejecting") {
      camTarget = new THREE.Vector3(0, 1.9, 3.6);
      lookTarget = new THREE.Vector3(0, 1.2, 1.4);
    } else {
      camTarget = new THREE.Vector3(0, 1.55, 3.4);
      lookTarget = REVEAL_POS.clone();
    }

    camera.position.lerp(camTarget, 0.045);
    target.current.lerp(lookTarget, 0.06);
    camera.lookAt(target.current);
  });

  return null;
}

function SceneContent({
  count,
  phase,
  phaseRef,
  onShakeComplete,
  onEjectComplete,
  onOpenComplete,
  ejectedColor,
}: {
  count: number;
  phase: Phase;
  phaseRef: React.MutableRefObject<Phase>;
  onShakeComplete: () => void;
  onEjectComplete: () => void;
  onOpenComplete: () => void;
  ejectedColor: string;
}) {
  const bodyRefs = useRef<(RapierRigidBody | null)[]>([]);
  const colors = useMemo(
    () => Array.from({ length: count }, (_, i) => PALETTE[i % PALETTE.length]),
    [count]
  );

  const shakeStart = useRef(0);
  const ejectStart = useRef(0);
  const openStart = useRef(0);
  const progressRef = useRef(0);
  const flyStartPos = useRef(new THREE.Vector3(0, FLOOR_Y + 0.6, 0));
  const shookRef = useRef(false);

  useEffect(() => {
    if (phase === "shaking" && !shookRef.current) {
      shookRef.current = true;
      shakeStart.current = performance.now();
      bodyRefs.current.forEach((b) => {
        if (!b) return;
        b.applyImpulse(
          { x: (Math.random() - 0.5) * 2.2, y: 1.6 + Math.random() * 1.2, z: (Math.random() - 0.5) * 2.2 },
          true
        );
        b.applyTorqueImpulse(
          { x: (Math.random() - 0.5) * 0.4, y: (Math.random() - 0.5) * 0.4, z: (Math.random() - 0.5) * 0.4 },
          true
        );
      });
    }
    if (phase !== "shaking") shookRef.current = false;

    if (phase === "ejecting") {
      const alive = bodyRefs.current.filter(Boolean) as RapierRigidBody[];
      const chosen = alive[Math.floor(Math.random() * alive.length)];
      if (chosen) {
        const t = chosen.translation();
        flyStartPos.current.set(t.x, t.y, t.z);
      }
      ejectStart.current = performance.now();
      progressRef.current = 0;
    }

    if (phase === "opening") {
      openStart.current = performance.now();
      progressRef.current = 0;
    }
  }, [phase]);

  useFrame(() => {
    if (phase === "shaking") {
      const t = Math.min((performance.now() - shakeStart.current) / SHAKE_MS, 1);
      if (t >= 1) onShakeComplete();
    } else if (phase === "ejecting") {
      const t = Math.min((performance.now() - ejectStart.current) / EJECT_MS, 1);
      progressRef.current = t;
      if (t >= 1) onEjectComplete();
    } else if (phase === "opening") {
      const t = Math.min((performance.now() - openStart.current) / OPEN_MS, 1);
      progressRef.current = t;
      if (t >= 1) onOpenComplete();
    }
  });

  return (
    <>
      <CameraRig phaseRef={phaseRef} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 6, 4]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 3, -2]} intensity={0.35} />

      <Float speed={1.1} rotationIntensity={0.06} floatIntensity={0.22}>
        <MachineBody />
        <Physics gravity={[0, -9.2, 0]}>
          <ContainmentWalls />
          {phase === "idle" || phase === "shaking" ? (
            <CapsulePile count={count} bodyRefs={bodyRefs} colors={colors} />
          ) : null}
        </Physics>
        <GlassDome />
      </Float>

      <FlyingCapsule phase={phase} progressRef={progressRef} color={ejectedColor} startPos={flyStartPos.current} />

      <ContactShadows position={[0, 0.001, 0]} opacity={0.45} scale={7} blur={2.4} far={3} />
      <Environment preset="studio" />
    </>
  );
}

export default function GachaScene({
  names,
  onRevealed,
}: {
  names: string[];
  onRevealed: (winnerIndex: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const winnerIdx = useRef<number | null>(null);
  const ejectedColor = useRef(PALETTE[0]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const count = Math.min(Math.max(names.length, 2), MAX_CAPSULES);

  const press = () => {
    if (phase !== "idle") return;
    winnerIdx.current = pickWinnerIndex(names.length);
    ejectedColor.current = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    setPhase("shaking");
  };

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-3xl"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 30%, rgba(255,214,165,0.35), transparent 65%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(127,216,190,0.25), transparent 60%)",
          filter: "blur(20px)",
        }}
      />
      <div className="h-[440px] w-full overflow-hidden rounded-3xl">
        <Canvas shadows camera={{ position: [0, 2.4, 6.2], fov: 34 }}>
          <SceneContent
            count={count}
            phase={phase}
            phaseRef={phaseRef}
            ejectedColor={ejectedColor.current}
            onShakeComplete={() => setPhase("ejecting")}
            onEjectComplete={() => setPhase("opening")}
            onOpenComplete={() => {
              if (winnerIdx.current !== null) onRevealed(winnerIdx.current);
            }}
          />
        </Canvas>
      </div>

      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="rounded-xl border-2 border-brand-500/60 bg-slate-950/80 px-4 py-1.5 text-xs tracking-widest text-brand-400 shadow-glow">
          참가자 {names.length}명
        </div>
        <button
          onClick={press}
          disabled={phase !== "idle"}
          className="rounded-full bg-gradient-to-b from-orange-400 to-brand-600 px-10 py-3.5 text-sm font-extrabold tracking-wide text-white shadow-glow transition active:scale-95 disabled:opacity-60"
        >
          {phase === "idle" ? "PRESS TO START" : "두구두구..."}
        </button>
      </div>
    </div>
  );
}
