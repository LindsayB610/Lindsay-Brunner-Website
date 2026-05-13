"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { IconSparkles } from "@tabler/icons-react";

type ContactSectionProps = {
  colors?: string[];
  secondaryCta?: {
    href: string;
    label: string;
  } | null;
};

export default function ContactSectionWithShader({
  colors,
  secondaryCta = {
    href: "/about/",
    label: "More about me",
  },
}: ContactSectionProps) {
  return (
    <div className="w-full bg-site-black">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 md:px-8 lg:grid-cols-2 lg:py-20">
        <div className="relative order-last h-[440px] overflow-hidden rounded-3xl md:order-first md:h-[500px] lg:h-auto">
          <ShaderBackground colors={colors} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[6] bg-black/30"
          />
          <div className="absolute inset-0 z-10 flex items-center justify-center p-5 md:p-8">
            <RotatingTestimonials />
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-lg rounded-3xl px-4 py-6 md:px-10 md:py-8">
            <div>
              <p className="mb-4 font-mono text-xs font-bold uppercase text-brand-yellow">
                Currently open
              </p>
              <h2 className="mt-4 text-3xl leading-tight font-bold tracking-tight text-white md:text-5xl">
                Bring me your weird content problems
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-site-muted">
                Useful product, messy story, skeptical technical audience,
                content system held together with vibes and one heroic
                spreadsheet? Perfect. Let's talk.
              </p>
            </div>

            <div className="grid gap-3 pt-6 pb-8 md:pt-7 md:pb-12">
              {[
                "Developer marketing and technical content strategy",
                "Mentorship for content marketers working with developer audiences",
                "Content audits, editorial systems, and AI workflow design",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-site-muted"
                >
                  <IconSparkles
                    aria-hidden="true"
                    className="mt-1 h-5 w-5 shrink-0 text-brand-pink"
                  />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="https://www.linkedin.com/in/lindsaybrunner/"
                target="_blank"
                rel="noreferrer"
                className="relative z-10 flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-black no-underline transition duration-200 hover:-translate-y-0.5"
              >
                <ExternalLink className="h-4 w-4" />
                Start on LinkedIn
              </a>
              {secondaryCta ? (
                <a
                  href={secondaryCta.href}
                  className="relative z-10 flex h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white no-underline transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.08]"
                >
                  {secondaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const testimonials = [
  {
    quote:
      "She is technical, has a unique and deep understanding of the developer audience, and is a no-brainer leader for any developer-focused content program.",
    name: "Steve Sewell",
    designation: "CEO, Builder.io",
    avatar: "/images/testimonials/steve-sewell.jpg",
  },
  {
    quote:
      "She is my north star for what a great developer content leader looks like.",
    name: "Kaitlyn Barnard",
    designation: "Product Marketing, Apollo GraphQL",
    avatar: "/images/testimonials/kaitlyn-barnard.jpg",
  },
  {
    quote:
      "She has an incredible ability to balance big-picture strategy with genuine care for the people she works with.",
    name: "Scott McAllister",
    designation: "Principal Developer Advocate, vCluster",
    avatar: "/images/testimonials/scott-mcallister.jpg",
  },
  {
    quote:
      "Lindsay managed Okta's developer content, oversaw an extensive developer contractor program, and led numerous special projects.",
    name: "Randall Degges",
    designation: "VP Developer Relations, Snyk",
    avatar: "/images/testimonials/randall-degges.jpg",
  },
  {
    quote:
      "Lindsay just gets it in a way that is hard to teach. She built a content program that drove 20% month over month organic growth.",
    name: "Kaitlyn Barnard",
    designation: "Product Marketing, Apollo GraphQL",
    avatar: "/images/testimonials/kaitlyn-barnard.jpg",
  },
];

const testimonialRotationDelayMs = 8000;

function RotatingTestimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, testimonialRotationDelayMs);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex h-full w-full max-w-md items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="w-full"
        >
          <TestimonialCard testimonial={testimonials[currentIndex]} />
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      <div className="absolute -bottom-7 left-1/2 flex -translate-x-1/2 gap-1">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Show testimonial ${index + 1} of ${testimonials.length}`}
            className="group flex h-11 w-11 appearance-none items-center justify-center rounded-full border-0 bg-transparent p-0 shadow-none focus:outline-none focus-visible:outline-none focus-visible:[&>span]:ring-2 focus-visible:[&>span]:ring-white/80"
          >
            <span
              className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-6 bg-white"
                : "w-2 bg-white/40 group-hover:bg-white/60"
            }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof testimonials)[0];
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/20 bg-black/75 p-6 shadow-xl backdrop-blur-md md:p-10">
      <svg
        className="mb-5 h-9 w-9 text-white/60 md:h-11 md:w-11"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
      </svg>
      <p className="text-lg leading-relaxed font-medium text-white md:text-2xl md:leading-relaxed">
        {testimonial.quote}
      </p>
      <div className="mt-7 flex items-center gap-4 md:mt-10">
        <TestimonialAvatar src={testimonial.avatar} />
        <div className="flex min-w-0 flex-col gap-0">
          <span className="block text-xl leading-[1.05] font-bold text-white">
            {testimonial.name}
          </span>
          <span className="mt-1 block text-base leading-[1.05] text-white/70">
            {testimonial.designation}
          </span>
        </div>
      </div>
    </div>
  );
}

function TestimonialAvatar({ src }: { src: string }) {
  const [hasImage, setHasImage] = useState(true);

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 ring-2 ring-white/30">
      {hasImage ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setHasImage(false)}
        />
      ) : (
        <Sparkles className="h-6 w-6 text-white" />
      )}
    </div>
  );
}

function resolveCssColorToRGB(color: string): [number, number, number] {
  if (typeof document === "undefined") {
    return [128, 128, 128];
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [128, 128, 128];

  const el = document.createElement("div");
  el.style.color = color;
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color;
  document.body.removeChild(el);

  ctx.fillStyle = computed;
  ctx.fillRect(0, 0, 1, 1);
  const data = ctx.getImageData(0, 0, 1, 1).data;

  return [data[0], data[1], data[2]];
}

const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_colors[5];

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
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
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  vec3 blendNormal(vec3 base, vec3 blend, float opacity) {
    return blend * opacity + base * (1.0 - opacity);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    float time = u_time * 0.15;

    vec2 nCoord = vec2(uv.x * aspect, uv.y) * 0.4;

    // Base color (u_colors[0])
    vec3 color = u_colors[0];

    // Layer 1 (u_colors[1])
    float n1 = snoise(vec3(
      nCoord.x * 1.3 + time * 0.5,
      nCoord.y * 1.6,
      time * 0.3 + 3.0
    ));
    n1 = smoothstep(0.15, 0.7, n1 * 0.5 + 0.5);
    color = blendNormal(color, u_colors[1], pow(n1, 3.5));

    // Layer 2 (u_colors[2])
    float n2 = snoise(vec3(
      nCoord.x * 1.5 + time * 0.4,
      nCoord.y * 1.8,
      time * 0.35 + 12.0
    ));
    n2 = smoothstep(0.18, 0.75, n2 * 0.5 + 0.5);
    color = blendNormal(color, u_colors[2], pow(n2, 3.5));

    // Layer 3 (u_colors[3])
    float n3 = snoise(vec3(
      nCoord.x * 1.1 - time * 0.35,
      nCoord.y * 1.4,
      time * 0.25 + 24.0
    ));
    n3 = smoothstep(0.20, 0.80, n3 * 0.5 + 0.5);
    color = blendNormal(color, u_colors[3], pow(n3, 4.0));

    // Layer 4 (u_colors[4])
    float n4 = snoise(vec3(
      nCoord.x * 0.9 + time * 0.2,
      nCoord.y * 1.2,
      time * 0.15 + 36.0
    ));
    n4 = smoothstep(0.25, 0.85, n4 * 0.5 + 0.5);
    color = blendNormal(color, u_colors[4], pow(n4, 4.0));

    // Vignette for depth
    float vignette = smoothstep(1.2, 0.4, length(uv - vec2(0.5)));
    color *= vignette * 0.85 + 0.15;

    gl_FragColor = vec4(color, 1.0);
  }
`;

type ShaderBackgroundProps = {
  colors?: string[];
};

const defaultColors = [
  "#000000", // Base: site black
  "#ff0037", // Layer 1: brand red
  "#ff1b8d", // Layer 2: brand pink
  "#ffdd00", // Layer 3: brand yellow
  "#ff0037", // Layer 4: brand red
];

function ShaderBackground({ colors = defaultColors }: ShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const createShader = useCallback(
    (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    },
    [],
  );

  const parseColors = useCallback(() => {
    const resolved = [...colors];
    while (resolved.length < 5) {
      resolved.push(resolved[resolved.length - 1] ?? "#ff1b8d");
    }
    const rgb = resolved.slice(0, 5).map((c) => {
      const [r, g, b] = resolveCssColorToRGB(c);
      return [r / 255, g / 255, b / 255] as [number, number, number];
    });
    return rgb.flat();
  }, [colors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: false });
    if (!gl) return;

    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const vertices = new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uColors = gl.getUniformLocation(program, "u_colors");

    const colorArray = new Float32Array(parseColors());
    gl.uniform3fv(uColors, colorArray);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startTime = performance.now();
    const render = () => {
      const elapsed = shouldReduceMotion ? 0 : (performance.now() - startTime) / 1000;
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (shouldReduceMotion) return;
      rafRef.current = requestAnimationFrame(render);
    };
    if (shouldReduceMotion) {
      render();
    } else {
      rafRef.current = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [createShader, parseColors]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ display: "block" }}
      />
      {/* Noise overlay for texture */}
      <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full opacity-[0.25]">
        <filter id="contactShaderNoise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#contactShaderNoise)" />
      </svg>
    </>
  );
}
