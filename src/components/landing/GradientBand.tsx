'use client';

import { useEffect, useRef } from 'react';

/**
 * GradientBand — ShaderGradient / UnicornStudio-style animated
 * gradient mesh in raw WebGL (zero extra deps). Flowing emerald →
 * acid blobs with film grain, mouse-reactive, pauses off-screen.
 */
const FRAG = /* glsl */ `
  precision mediump float;
  uniform vec2 uRes;
  uniform float uTime;
  uniform vec2 uMouse;
  varying vec2 vUv;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.,0.)), u.x),
               mix(hash(i + vec2(0.,1.)), hash(i + vec2(1.,1.)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for(int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main(){
    vec2 uv = vUv;
    float t = uTime * 0.12;
    vec2 m = uMouse * 0.25;

    float n1 = fbm(uv * 2.6 + vec2(t * 1.4, -t) + m);
    float n2 = fbm(uv * 3.4 - vec2(t * 0.8, t * 1.1) - m);
    float n3 = fbm((uv + n1) * 2.0 + t * 0.5);

    vec3 ink = vec3(0.957, 0.949, 0.918);
    vec3 forest = vec3(0.85, 0.92, 0.80);
    vec3 emerald = vec3(0.06, 0.62, 0.37);
    vec3 acid = vec3(0.72, 0.90, 0.10);
    vec3 bone = vec3(1.0, 0.995, 0.96);

    vec3 col = mix(ink, forest, smoothstep(0.2, 0.75, n1));
    col = mix(col, emerald, smoothstep(0.55, 0.9, n2) * 0.5);
    col = mix(col, acid, smoothstep(0.70, 0.95, n3) * 0.55);

    // mouse glow
    float d = distance(uv, uMouse * 0.5 + 0.25);
    col = mix(col, emerald, smoothstep(0.55, 0.0, d) * 0.25);

    // vignette + grain
    float vig = smoothstep(1.15, 0.35, distance(uv, vec2(0.5)));
    col *= mix(0.92, 1.0, vig);
    col += (hash(uv * uRes + fract(uTime) * 100.0) - 0.5) * 0.035;

    // occasional forest filament
    float fil = smoothstep(0.02, 0.0, abs(n1 - n2 - 0.08));
    col = mix(col, vec3(0.043, 0.231, 0.18), fil * 0.15);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const VERT = /* glsl */ `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export default function GradientBand({ className = '', speed = 1 }: { className?: string; speed?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uMouse = gl.getUniformLocation(prog, 'uMouse');
    const mouse = { x: 0.5, y: 0.5 };
    const onMouse = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / Math.max(r.width, 1);
      mouse.y = 1 - (e.clientY - r.top) / Math.max(r.height, 1);
    };
    window.addEventListener('mousemove', onMouse, { passive: true });

    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const t0 = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      resize();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, ((performance.now() - t0) / 1000) * speed);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('mousemove', onMouse);
    };
  }, [speed]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
