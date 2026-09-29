'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* Simplex noise GLSL (Ashima) — compact */
const NOISE_GLSL = /* glsl */ `
  vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}
  vec4 mod289(vec4 x){return x - floor(x * (1.0/289.0)) * 289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

const BLOB_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  varying vec3 vNormal;
  varying vec3 vPos;
  varying float vNoise;
  ${NOISE_GLSL}
  void main() {
    float n = snoise(normal * 1.6 + uTime * 0.35);
    float n2 = snoise(normal * 3.4 - uTime * 0.22) * 0.35;
    float d = (n + n2) * uAmp;
    vNoise = n;
    vec3 p = position + normal * d;
    vNormal = normalMatrix * normal;
    vPos = (modelViewMatrix * vec4(p, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const BLOB_FRAG = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  varying float vNoise;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 viewDir = normalize(-vPos);
    float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 2.2);
    vec3 deep = vec3(0.023, 0.23, 0.16);
    vec3 emerald = vec3(0.06, 0.72, 0.41);
    vec3 acid = vec3(0.85, 1.0, 0.24);
    vec3 base = mix(deep, emerald, smoothstep(-0.6, 0.7, vNoise));
    base = mix(base, acid, fresnel * 0.9);
    base += acid * fresnel * 0.35;
    gl_FragColor = vec4(base, 1.0);
  }
`;

function Blob() {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const mouse = useRef({ x: 0, y: 0 });

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uAmp: { value: 0.32 } }),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (mat.current) mat.current.uniforms.uTime.value = t;
    // mouse parallax
    mouse.current.x += (state.pointer.x - mouse.current.x) * 0.04;
    mouse.current.y += (state.pointer.y - mouse.current.y) * 0.04;
    if (mesh.current) {
      mesh.current.rotation.y = t * 0.12 + mouse.current.x * 0.5;
      mesh.current.rotation.x = Math.sin(t * 0.18) * 0.18 + mouse.current.y * 0.3;
      mesh.current.position.y = Math.sin(t * 0.6) * 0.08;
    }
  });

  return (
    <mesh ref={mesh} scale={1.55}>
      <icosahedronGeometry args={[1, 48]} />
      <shaderMaterial
        ref={mat}
        vertexShader={BLOB_VERT}
        fragmentShader={BLOB_FRAG}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function ParticleRing({ count = 900 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 2.4 + Math.random() * 2.4;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3.4;
      positions[i * 3 + 2] = Math.sin(a) * r;
      seeds[i] = Math.random() * Math.PI * 2;
    }
    return { positions, seeds };
  }, [count]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uTime;
          varying float vA;
          void main() {
            vec3 p = position;
            p.y += sin(uTime * 0.4 + aSeed) * 0.25;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = (2.2 + sin(uTime + aSeed) * 1.2) * (120.0 / -mv.z);
            vA = 0.35 + 0.3 * sin(uTime * 0.8 + aSeed * 2.0);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          varying float vA;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            vec3 col = mix(vec3(0.04,0.42,0.28), vec3(0.35,0.62,0.18), smoothstep(0.5, 0.0, d));
            gl_FragColor = vec4(col, vA * smoothstep(0.5, 0.1, d) * 0.55);
          }
        `,
      }),
    []
  );

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.03;
  });

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    return g;
  }, [positions, seeds]);

  return <points ref={ref} geometry={geo} material={mat} />;
}

/** Floating pill capsules orbiting the blob */
function Pills() {
  const g = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!g.current) return;
    g.current.children.forEach((child, i) => {
      const a = t * (0.18 + i * 0.05) + (i * Math.PI * 2) / 3;
      child.position.set(Math.cos(a) * 2.6, Math.sin(t * 0.5 + i * 2) * 0.9, Math.sin(a) * 2.6 - 0.5);
      child.rotation.set(t * 0.4 + i, t * 0.3, 0);
    });
  });
  return (
    <group ref={g}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <capsuleGeometry args={[0.16, 0.42, 8, 24]} />
          <meshStandardMaterial
            color={i === 1 ? '#d9ff3d' : '#f2f0e8'}
            roughness={0.25}
            metalness={0.15}
            emissive={i === 1 ? '#4a5d00' : '#0b3b2e'}
            emissiveIntensity={i === 1 ? 0.6 : 0.25}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Effervescence — micro-bubbles rising like a dissolving tablet */
function Bubbles({ count = 220 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { geo, mat } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3); // x: phase, y: speed, z: size
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3 - 0.5;
      seeds[i * 3] = Math.random() * Math.PI * 2;
      seeds[i * 3 + 1] = 0.25 + Math.random() * 0.6;
      seeds[i * 3 + 2] = 0.5 + Math.random() * 1.6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute vec3 aSeed;
        uniform float uTime;
        varying float vA;
        void main() {
          vec3 p = position;
          float rise = mod(p.y + 2.75 + uTime * aSeed.y, 5.5) - 2.75;
          p.y = rise;
          p.x += sin(uTime * 0.8 + aSeed.x * 7.0) * 0.18;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float edge = smoothstep(2.75, 1.8, abs(rise));
          vA = edge * (0.25 + 0.35 * sin(uTime * 1.4 + aSeed.x * 3.0) * 0.5 + 0.175);
          gl_PointSize = aSeed.z * (46.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          float ring = smoothstep(0.5, 0.42, d) - smoothstep(0.34, 0.2, d) * 0.55;
          vec3 col = mix(vec3(0.043,0.231,0.18), vec3(0.06,0.62,0.37), smoothstep(0.5, 0.0, d));
          gl_FragColor = vec4(col, vA * ring);
        }
      `,
    });
    return { geo: g, mat: m };
  }, [count]);

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    if (ref.current) ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.08;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

/**
 * ShaderHero — full-bleed Three.js scene: morphing emerald blob,
 * particle ring, rising effervescence bubbles + orbiting pill capsules.
 * Mouse-reactive.
 */
export default function ShaderHero({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 6], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 5, 6]} intensity={1.4} color="#d9ff3d" />
        <pointLight position={[-5, -2, 3]} intensity={12} color="#10b981" />
        <Blob />
        <ParticleRing />
        <Bubbles />
        <Pills />
      </Canvas>
    </div>
  );
}
