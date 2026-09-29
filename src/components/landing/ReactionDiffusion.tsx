'use client';

import { useEffect, useRef } from 'react';

/**
 * ReactionDiffusion — a REAL Gray–Scott chemical simulation running
 * live in WebGL2 (the same math behind Belousov–Zhabotinsky reactions,
 * Turing patterns & cell mitosis). Ping-pong float framebuffers at low
 * res, upscaled for an organic petri-dish look. Pointer acts as a
 * chemical feed — stir the dish. Gracefully hides if float buffers
 * aren't supported (hero still has blob + bubbles).
 */

const VERT = /* glsl */ `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

const SIM_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uState;
  uniform vec2 uTexel;
  uniform float uFeed;
  uniform float uKill;
  uniform vec4 uBrush;
  uniform vec2 uAutoA;
  uniform vec2 uAutoB;
  uniform vec2 uAutoC;

  vec2 laplacian(vec2 uv, vec2 tx) {
    vec2 s = vec2(0.0);
    s += texture2D(uState, uv + vec2(-tx.x, 0.0)).rg * 0.2;
    s += texture2D(uState, uv + vec2( tx.x, 0.0)).rg * 0.2;
    s += texture2D(uState, uv + vec2(0.0, -tx.y)).rg * 0.2;
    s += texture2D(uState, uv + vec2(0.0,  tx.y)).rg * 0.2;
    s += texture2D(uState, uv + vec2(-tx.x, -tx.y)).rg * 0.05;
    s += texture2D(uState, uv + vec2( tx.x, -tx.y)).rg * 0.05;
    s += texture2D(uState, uv + vec2(-tx.x,  tx.y)).rg * 0.05;
    s += texture2D(uState, uv + vec2( tx.x,  tx.y)).rg * 0.05;
    s += texture2D(uState, uv).rg * -1.0;
    return s;
  }

  void feed(inout vec2 s, vec2 uv, vec2 p, float r, float amt) {
    float m = smoothstep(r, 0.0, distance(uv, p)) * amt;
    s.r = mix(s.r, 1.0, m);
    s.g *= (1.0 - m);
  }

  void main() {
    vec2 cur = texture2D(uState, vUv).rg;
    vec2 L = laplacian(vUv, uTexel);
    float uvv = cur.r * cur.g * cur.g;
    float U = cur.r + (L.r - uvv + uFeed * (1.0 - cur.r));
    float V = cur.g + (0.5 * L.g + uvv - (uFeed + uKill) * cur.g);
    vec2 s = vec2(clamp(U, 0.0, 1.0), clamp(V, 0.0, 1.0));
    feed(s, vUv, uBrush.xy, uBrush.z, uBrush.w);
    feed(s, vUv, uAutoA, 0.022, 0.6);
    feed(s, vUv, uAutoB, 0.022, 0.6);
    feed(s, vUv, uAutoC, 0.022, 0.6);
    gl_FragColor = vec4(s, 0.0, 1.0);
  }
`;

const RENDER_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uState;
  void main() {
    float v = texture2D(uState, vUv).g;
    vec3 cream  = vec3(0.957, 0.949, 0.918);
    vec3 leaf   = vec3(0.10, 0.55, 0.34);
    vec3 forest = vec3(0.043, 0.231, 0.180);
    vec3 acid   = vec3(0.78, 0.94, 0.20);
    vec3 col = cream;
    col = mix(col, leaf, smoothstep(0.04, 0.22, v));
    col = mix(col, forest, smoothstep(0.20, 0.48, v));
    float rim = smoothstep(0.02, 0.08, v) * (1.0 - smoothstep(0.08, 0.26, v));
    col = mix(col, acid, rim * 0.8);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function ReactionDiffusion({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { antialias: false, depth: false, alpha: false }) as WebGL2RenderingContext | null;
    if (!gl) return;
    if (!gl.getExtension('EXT_color_buffer_float') || !gl.getExtension('OES_texture_float_linear')) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.innerWidth < 768;
    const W = mobile ? 160 : 256;
    const H = mobile ? 160 : 256;
    canvas.width = W;
    canvas.height = H;

    const compile = (src: string, type: number) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const makeProg = (frag: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, compile(VERT, gl.VERTEX_SHADER));
      gl.attachShader(p, compile(frag, gl.FRAGMENT_SHADER));
      gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    };
    const simProg = makeProg(SIM_FRAG);
    const renProg = makeProg(RENDER_FRAG);
    if (!simProg || !renProg) return;

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const bindQuad = (prog: WebGLProgram) => {
      const loc = gl.getAttribLocation(prog, 'aPos');
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    };

    const makeTex = (data: Float32Array | null) => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, W, H, 0, gl.RGBA, gl.FLOAT, data);
      return t;
    };

    // seed: U=1 everywhere, V=0, plus scattered V colonies
    const seed = new Float32Array(W * H * 4);
    for (let i = 0; i < W * H; i++) {
      seed[i * 4] = 1;
      seed[i * 4 + 3] = 1;
    }
    const colony = (cx: number, cy: number, r: number) => {
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const dx = (x / W - cx) * (W / H);
          const dy = y / H - cy;
          if (dx * dx + dy * dy < r * r) {
            const i = (y * W + x) * 4;
            seed[i] = 0.5;
            seed[i + 1] = 1;
          }
        }
      }
    };
    colony(0.5, 0.5, 0.05);
    colony(0.28, 0.62, 0.03);
    colony(0.72, 0.38, 0.03);
    colony(0.62, 0.72, 0.025);
    colony(0.35, 0.3, 0.025);

    let texA = makeTex(seed);
    let texB = makeTex(null);
    const fboA = gl.createFramebuffer()!;
    const fboB = gl.createFramebuffer()!;
    const attach = (fbo: WebGLFramebuffer, tex: WebGLTexture) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    };
    attach(fboA, texA);
    attach(fboB, texB);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return;

    // sim uniforms
    gl.useProgram(simProg);
    bindQuad(simProg);
    const u = (n: string) => gl.getUniformLocation(simProg, n);
    const lState = u('uState'), lTexel = u('uTexel'), lFeed = u('uFeed'), lKill = u('uKill');
    const lBrush = u('uBrush'), lA = u('uAutoA'), lB = u('uAutoB'), lC = u('uAutoC');
    gl.uniform2f(lTexel, 1 / W, 1 / H);
    gl.uniform1f(lFeed, 0.0545); // mitosis regime — replicating spots
    gl.uniform1f(lKill, 0.062);

    gl.useProgram(renProg);
    bindQuad(renProg);
    const rState = gl.getUniformLocation(renProg, 'uState');

    const brush = { x: 0.5, y: 0.5, s: 0 };
    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (r.width === 0) return;
      brush.x = (e.clientX - r.left) / r.width;
      brush.y = 1 - (e.clientY - r.top) / r.height;
      if (brush.x >= -0.05 && brush.x <= 1.05 && brush.y >= -0.05 && brush.y <= 1.05) brush.s = 1;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    const STEPS = mobile ? 8 : 12;
    let texRead = texA;
    let fboWrite = fboB;

    const step = (t: number) => {
      gl.useProgram(simProg);
      bindQuad(simProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texRead);
      gl.uniform1i(lState, 0);
      gl.uniform4f(lBrush, brush.x, brush.y, 0.045, brush.s);
      gl.uniform2f(lA, 0.5 + 0.3 * Math.cos(t * 0.21), 0.5 + 0.3 * Math.sin(t * 0.17));
      gl.uniform2f(lB, 0.5 + 0.32 * Math.cos(t * 0.13 + 2.1), 0.5 + 0.28 * Math.sin(t * 0.19 + 1.0));
      gl.uniform2f(lC, 0.5 + 0.28 * Math.cos(t * 0.17 + 4.2), 0.5 + 0.32 * Math.sin(t * 0.11 + 3.0));
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboWrite);
      gl.viewport(0, 0, W, H);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      // swap read/write
      texRead = fboWrite === fboA ? texA : texB;
      fboWrite = fboWrite === fboA ? fboB : fboA;
      brush.s *= 0.94;
    };

    const render = () => {
      gl.useProgram(renProg);
      bindQuad(renProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texRead);
      gl.uniform1i(rState, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // warm up behind the preloader so it's alive on reveal
    for (let i = 0; i < 80; i++) step(i * 0.016);

    if (reduced) {
      render();
      return () => {
        window.removeEventListener('pointermove', onPointer);
        io.disconnect();
      };
    }

    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      const t = (performance.now() - t0) / 1000;
      for (let i = 0; i < STEPS; i++) step(t);
      render();
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      io.disconnect();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
