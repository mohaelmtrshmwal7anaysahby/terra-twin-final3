import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import earthCloudsUrl from '../assets/textures/earth_clouds.webp';
import earthDayUrl from '../assets/textures/earth_day.webp';
import earthLightsUrl from '../assets/textures/earth_lights.webp';
import earthNormalUrl from '../assets/textures/earth_normal.webp';
import earthRoughnessUrl from '../assets/textures/earth_roughness.webp';
import marsBumpUrl from '../assets/textures/mars_bump.webp';
import marsUrl from '../assets/textures/mars.webp';
import moonUrl from '../assets/textures/moon.webp';
import { EARTH_ANALOG_SITES, HERO_ASSETS } from '../data/planetaryData';
import { LocaleCode } from '../types/terratwin';

export type GlobeFocus = 'earth' | 'moon' | 'mars';

interface PlanetaryGlobe3DProps {
  focus: GlobeFocus;
  locale: LocaleCode;
  /** `origin` is the click position in viewport pixels (used by the warp transition). */
  onSelectAnalogSite?: (siteId: string, origin?: { x: number; y: number }) => void;
  /**
   * "hero" shifts the planet away from the text column (right on LTR, left on RTL, up on small screens)
   * and plays a cinematic camera descent on first load. "centered" keeps the classic framing.
   */
  framing?: 'centered' | 'hero';
}

const _vec3 = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _pinWorld = new THREE.Vector3();
const _pinNormal = new THREE.Vector3();
const _toCamera = new THREE.Vector3();

/** Direction of the sun in world space. Shared by the key light and every sun-aware shader. */
const SUN_DIR = new THREE.Vector3(6, 3.5, 4).normalize();

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

/** Small deterministic PRNG so the starfield is identical on every load. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Atmosphere shell whose glow is brightest on the sunlit limb and fades toward the night side. */
function createAtmosphereMaterial(
  color: string,
  strength: number,
  mode: 'halo' | 'limb'
): THREE.ShaderMaterial {
  const rim =
    mode === 'halo'
      ? 'pow(max(0.0, 0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.2)'
      : 'pow(1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.4)';
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: mode === 'halo' ? THREE.BackSide : THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      glowColor: { value: new THREE.Color(color) },
      sunDir: { value: SUN_DIR.clone() },
      strength: { value: strength },
    },
    vertexShader: ATMOSPHERE_VERTEX,
    fragmentShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vWorldNormal;
      uniform vec3 glowColor;
      uniform vec3 sunDir;
      uniform float strength;
      void main() {
        float rim = ${rim};
        float sun = 0.28 + 0.72 * smoothstep(-0.35, 0.55, dot(normalize(vWorldNormal), sunDir));
        gl_FragColor = vec4(glowColor, rim * strength * sun);
      }
    `,
  });
}

/** City lights that only appear on the night side of the Earth. */
function createNightLightsMaterial(map: THREE.Texture): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      map: { value: map },
      sunDir: { value: SUN_DIR.clone() },
      tint: { value: new THREE.Color('#ffc983') },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform vec3 sunDir;
      uniform vec3 tint;
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      void main() {
        float d = dot(normalize(vWorldNormal), sunDir);
        float night = smoothstep(0.1, -0.2, d);
        vec3 c = texture2D(map, vUv).rgb;
        float l = max(max(c.r, c.g), c.b);
        gl_FragColor = vec4(tint * l * night * 2.2, 1.0);
      }
    `,
  });
}

/** Twinkling multi-colour starfield with a few bright stars that catch the bloom pass. */
function createStarField(count: number, pixelRatio: number): THREE.Points {
  const rand = mulberry32(20261114);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1;
    const theta = rand() * Math.PI * 2;
    const r = 52 + rand() * 26;
    const s = Math.sqrt(1 - u * u);
    positions[i * 3] = r * s * Math.cos(theta);
    positions[i * 3 + 1] = r * u;
    positions[i * 3 + 2] = r * s * Math.sin(theta);

    const tone = rand();
    const c = tone < 0.5 ? [0.78, 0.86, 1.0] : tone < 0.85 ? [1.0, 0.98, 0.95] : [1.0, 0.82, 0.62];
    colors.set(c, i * 3);

    sizes[i] = 0.9 + rand() ** 6 * 3.4;
    phases[i] = rand() * Math.PI * 2;
    speeds[i] = 0.6 + rand() * 1.8;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPx: { value: pixelRatio } },
    vertexShader: /* glsl */ `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aPhase;
      attribute float aSpeed;
      uniform float uTime;
      uniform float uPx;
      varying vec3 vColor;
      void main() {
        float tw = 0.72 + 0.28 * sin(uTime * aSpeed + aPhase);
        vColor = aColor * tw * (0.55 + aSize * 0.36);
        gl_PointSize = aSize * uPx;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, d);
        gl_FragColor = vec4(vColor, a);
      }
    `,
  });
  return new THREE.Points(geometry, material);
}

/** Very dim Milky-Way band + nebula dust painted on a huge inverted sphere. */
function createNebula(): THREE.Mesh {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    uniforms: { bandNormal: { value: new THREE.Vector3(0.28, 0.9, -0.34).normalize() } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      uniform vec3 bandNormal;
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
          f.z);
      }
      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p *= 2.02;
          a *= 0.5;
        }
        return v;
      }
      void main() {
        vec3 d = normalize(vDir);
        float band = exp(-pow(dot(d, bandNormal) * 2.7, 2.0));
        float n = fbm(d * 2.8 + vec3(1.7, 0.3, 2.1));
        float n2 = fbm(d * 6.5 - vec3(3.1, 1.2, 0.4));
        vec3 col = mix(vec3(0.02, 0.17, 0.21), vec3(0.17, 0.07, 0.21), n);
        col *= band * (0.25 + 1.7 * n * n2);
        col -= vec3(smoothstep(0.55, 0.85, n2) * band * 0.05);
        col += vec3(0.004, 0.007, 0.012);
        gl_FragColor = vec4(max(col, 0.0) * 0.6, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(95, 32, 32), material);
  mesh.renderOrder = -10;
  return mesh;
}

export const PlanetaryGlobe3D: React.FC<PlanetaryGlobe3DProps> = ({
  focus,
  locale,
  onSelectAnalogSite,
  framing = 'centered',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const focusRef = useRef<GlobeFocus>(focus);
  const localeRef = useRef<LocaleCode>(locale);
  const framingRef = useRef(framing);
  const onSelectRef = useRef(onSelectAnalogSite);
  const readyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hoveredPin, setHoveredPin] = useState<{
    name: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    focusRef.current = focus;
  }, [focus]);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    framingRef.current = framing;
  }, [framing]);

  useEffect(() => {
    onSelectRef.current = onSelectAnalogSite;
  }, [onSelectAnalogSite]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();
    const motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ===
      true;
    // "lite" = no bloom/nebula, fewer stars, 1x pixel ratio (software GL or data-saver users).
    const lite = isSoftwareGl || saveData;
    let pixelRatio = lite ? 1 : Math.min(window.devicePixelRatio, 2);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 520;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !lite,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      // No WebGL (blocked, old GPU, headless): show the orbital photo instead of a dead canvas.
      readyRef.current = true;
      setFailed(true);
      setReady(true);
      return;
    }
    renderer.setClearColor(0x010205, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 200);
    // Pins live on layer 1 (so they can be raycast on their own); the camera must see that layer too.
    camera.layers.enable(1);

    // ---- Intro: camera descends from high orbit once the textures are in. ----
    // Camera distances for the Earth and for the Moon/Mars close-ups; retuned by applyLayout().
    let earthDist = 4.8;
    let sideDist = 3.2;
    const introEnabled = framingRef.current === 'hero' && motionOk;
    const INTRO_SECONDS = 3.6;
    const introStartDir = new THREE.Vector3(0.62, 0.7, 1).normalize();
    const introEndDir = new THREE.Vector3(0, 0.85, 5.2).normalize();
    let introT = introEnabled ? 0 : 1;
    if (introEnabled) {
      camera.position.copy(introStartDir).multiplyScalar(13);
    } else {
      camera.position.copy(introEndDir).multiplyScalar(earthDist);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.65;
    controls.addEventListener('start', () => {
      introT = 1;
    });

    // ---- Lighting: hard warm sun, deep cool fill, dark night side so city lights read. ----
    const keyLight = new THREE.DirectionalLight(0xffe9cc, 3.1);
    keyLight.position.copy(SUN_DIR).multiplyScalar(10);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight(0x1a2a44, 0.35));
    scene.add(new THREE.HemisphereLight(0x4f86c2, 0x010205, 0.3));
    const rimLight = new THREE.DirectionalLight(0x2fd1d3, 1.1);
    rimLight.position.set(-5, -2, -4);
    scene.add(rimLight);

    // ---- Textures (real NASA-derived maps; see docs/CREDITS.md). ----
    const loadingManager = new THREE.LoadingManager();
    let disposed = false;
    const markReady = () => {
      if (disposed || readyRef.current) return;
      readyRef.current = true;
      setProgress(1);
      setReady(true);
    };
    loadingManager.onProgress = (_url, loaded, total) => {
      if (!disposed) setProgress(total ? loaded / total : 0);
    };
    loadingManager.onLoad = markReady;
    loadingManager.onError = () => {
      // Never leave the user staring at the loader if a texture is missing.
      window.setTimeout(markReady, 400);
    };
    const readyFallback = window.setTimeout(markReady, 9000);

    const textureLoader = new THREE.TextureLoader(loadingManager);
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const loadTexture = (url: string, srgb: boolean): THREE.Texture => {
      const tex = textureLoader.load(url);
      tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      tex.anisotropy = maxAniso;
      return track(tex);
    };

    const earthDayTex = loadTexture(earthDayUrl, true);
    const earthNormalTex = loadTexture(earthNormalUrl, false);
    const earthRoughTex = loadTexture(earthRoughnessUrl, false);
    const earthLightsTex = loadTexture(earthLightsUrl, false);
    const earthCloudsTex = loadTexture(earthCloudsUrl, true);
    const moonTex = loadTexture(moonUrl, true);
    const marsTex = loadTexture(marsUrl, true);
    const marsBumpTex = loadTexture(marsBumpUrl, false);

    // ---- Deep space: nebula band + twinkling starfield. ----
    if (!lite) {
      const nebula = createNebula();
      track(nebula.geometry);
      track(nebula.material as THREE.Material);
      scene.add(nebula);
    }
    const stars = createStarField(lite ? 1400 : 4200, pixelRatio);
    track(stars.geometry);
    const starMat = track(stars.material as THREE.ShaderMaterial);
    scene.add(stars);

    // ---- 1. EARTH ----
    const earthGroup = new THREE.Group();
    const earthGeo = track(new THREE.SphereGeometry(1.45, 72, 72));
    const earthMat = track(
      new THREE.MeshStandardMaterial({
        map: earthDayTex,
        normalMap: earthNormalTex,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughnessMap: earthRoughTex,
        roughness: 1,
        metalness: 0.02,
      })
    );
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    const lightsGeo = track(new THREE.SphereGeometry(1.452, 72, 72));
    const lightsMat = track(createNightLightsMaterial(earthLightsTex));
    const lightsMesh = new THREE.Mesh(lightsGeo, lightsMat);
    lightsMesh.renderOrder = 1;
    earthMesh.add(lightsMesh);

    const cloudGeo = track(new THREE.SphereGeometry(1.478, 56, 56));
    const cloudMat = track(
      new THREE.MeshStandardMaterial({
        map: earthCloudsTex,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
        roughness: 1,
      })
    );
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudMesh.renderOrder = 2;
    earthGroup.add(cloudMesh);

    const limbGeo = track(new THREE.SphereGeometry(1.5, 56, 56));
    const limbMat = track(createAtmosphereMaterial('#7cc8ff', 0.85, 'limb'));
    const limbMesh = new THREE.Mesh(limbGeo, limbMat);
    limbMesh.renderOrder = 3;
    earthGroup.add(limbMesh);

    const haloGeo = track(new THREE.SphereGeometry(1.6, 56, 56));
    const haloMat = track(createAtmosphereMaterial('#3aa6c8', 1.0, 'halo'));
    earthGroup.add(new THREE.Mesh(haloGeo, haloMat));

    const orbitRingGeo = track(new THREE.TorusGeometry(2.05, 0.008, 8, 128));
    const orbitRingMat = track(
      new THREE.MeshBasicMaterial({ color: 0xd9c5a3, transparent: true, opacity: 0.32 })
    );
    const earthRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    earthRing.rotation.x = Math.PI * 0.42;
    earthRing.rotation.y = 0.25;
    earthGroup.add(earthRing);

    // Analog-station pins (emissive so the bloom pass makes them glow) with pulsing collars.
    const clickablePins: THREE.Mesh[] = [];
    const collars: Array<{ mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial }> = [];
    const pinGeo = track(new THREE.SphereGeometry(0.038, 16, 16));
    const collarGeo = track(new THREE.TorusGeometry(0.07, 0.008, 8, 32));

    EARTH_ANALOG_SITES.forEach((site) => {
      const pos = latLngToVector3(site.coordinates.lat, site.coordinates.lng, 1.46);
      const pinColor =
        site.primaryTwin === 'mars' ? 0xff7a4d : site.primaryTwin === 'moon' ? 0xdbe4ef : 0x38e0e2;

      const pinMat = track(
        new THREE.MeshStandardMaterial({
          color: pinColor,
          emissive: pinColor,
          emissiveIntensity: 2.2,
          roughness: 0.3,
        })
      );
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.copy(pos);
      pin.layers.set(1);
      pin.userData = { siteId: site.id };

      const collarMat = track(
        new THREE.MeshBasicMaterial({ color: 0xf7f8fa, transparent: true, opacity: 0.7 })
      );
      const collar = new THREE.Mesh(collarGeo, collarMat);
      collar.position.copy(pos);
      collar.lookAt(pos.clone().multiplyScalar(2));

      earthMesh.add(pin);
      earthMesh.add(collar);
      clickablePins.push(pin);
      collars.push({ mesh: collar, mat: collarMat });
    });

    scene.add(earthGroup);

    // ---- 2. MOON ----
    const moonGroup = new THREE.Group();
    moonGroup.position.set(4.6, 0.65, -2.2);
    const moonGeo = track(new THREE.SphereGeometry(0.82, 56, 56));
    const moonMat = track(
      new THREE.MeshStandardMaterial({
        map: moonTex,
        bumpMap: moonTex,
        bumpScale: 0.7,
        roughness: 0.95,
        metalness: 0.02,
      })
    );
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonGroup.add(moonMesh);
    const moonRingGeo = track(new THREE.TorusGeometry(1.18, 0.007, 8, 96));
    const moonRingMat = track(
      new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.35 })
    );
    const moonRing = new THREE.Mesh(moonRingGeo, moonRingMat);
    moonRing.rotation.x = Math.PI * 0.45;
    moonGroup.add(moonRing);
    scene.add(moonGroup);

    // ---- 3. MARS ----
    const marsGroup = new THREE.Group();
    marsGroup.position.set(-4.6, -0.45, -2.4);
    const marsGeo = track(new THREE.SphereGeometry(1.05, 56, 56));
    const marsMat = track(
      new THREE.MeshStandardMaterial({
        map: marsTex,
        bumpMap: marsBumpTex,
        bumpScale: 1.2,
        roughness: 0.92,
        metalness: 0.02,
      })
    );
    const marsMesh = new THREE.Mesh(marsGeo, marsMat);
    marsGroup.add(marsMesh);
    const marsHaloGeo = track(new THREE.SphereGeometry(1.14, 40, 40));
    const marsHaloMat = track(createAtmosphereMaterial('#e0764b', 0.9, 'halo'));
    marsGroup.add(new THREE.Mesh(marsHaloGeo, marsHaloMat));
    const marsRingGeo = track(new THREE.TorusGeometry(1.48, 0.007, 8, 96));
    const marsRingMat = track(
      new THREE.MeshBasicMaterial({ color: 0xd96b43, transparent: true, opacity: 0.35 })
    );
    const marsRing = new THREE.Mesh(marsRingGeo, marsRingMat);
    marsRing.rotation.x = Math.PI * 0.44;
    marsGroup.add(marsRing);
    scene.add(marsGroup);

    // ---- Post-processing: HDR render target + bloom + tone mapping (skipped on software GL). ----
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!lite) {
      const target = new THREE.WebGLRenderTarget(width, height, {
        type: THREE.HalfFloatType,
        samples: 4,
      });
      composer = new EffectComposer(renderer, target);
      composer.setPixelRatio(pixelRatio);
      composer.setSize(width, height);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.62, 0.7, 0.92);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
    }

    // ---- Framing: in "hero" mode the planet is moved out from behind the text column. ----
    const applyLayout = () => {
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      if (framingRef.current === 'hero') {
        const rtl = document.documentElement.dir === 'rtl';
        if (w >= 1024) {
          camera.setViewOffset(w, h, (rtl ? 1 : -1) * w * 0.2, 0, w, h);
          earthDist = 5.7;
          sideDist = 3.7;
        } else {
          camera.setViewOffset(w, h, 0, h * 0.2, w, h);
          earthDist = 6.4;
          sideDist = 4.2;
        }
      } else {
        camera.clearViewOffset();
        earthDist = 4.8;
        sideDist = 3.2;
      }
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer?.setSize(w, h);
    };
    applyLayout();

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // ---- Raycasting for Earth analog pins (only pins facing the camera are interactive). ----
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let lastRaycastMs = 0;

    const isFacingCamera = (pin: THREE.Object3D) => {
      pin.getWorldPosition(_pinWorld);
      _pinNormal.copy(_pinWorld).normalize();
      _toCamera.copy(camera.position).sub(_pinWorld).normalize();
      return _pinNormal.dot(_toCamera) > 0.12;
    };

    const pickPin = (e: MouseEvent | PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickablePins, false);
      return hits.find((hit) => isFacingCamera(hit.object))?.object ?? null;
    };

    const siteName = (siteId: string) => {
      const site = EARTH_ANALOG_SITES.find((s) => s.id === siteId);
      return site ? site.name[localeRef.current] : siteId;
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastRaycastMs < 50) return;
      lastRaycastMs = now;
      const hit = focusRef.current === 'earth' ? pickPin(e) : null;
      if (hit) {
        renderer.domElement.style.cursor = 'pointer';
        const rect = renderer.domElement.getBoundingClientRect();
        setHoveredPin({
          name: siteName(String(hit.userData.siteId)),
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      } else {
        renderer.domElement.style.cursor = 'grab';
        setHoveredPin(null);
      }
    };

    const onClick = (e: MouseEvent) => {
      if (focusRef.current !== 'earth') return;
      const hit = pickPin(e);
      if (hit) onSelectRef.current?.(String(hit.userData.siteId), { x: e.clientX, y: e.clientY });
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    const onResize = () => applyLayout();
    window.addEventListener('resize', onResize);

    // ---- Animation loop with software-WebGL pacing ----
    let frameId = 0;
    const clock = new THREE.Clock();

    // Stop rendering while the canvas is scrolled out of view or the tab is hidden.
    let inView = true;
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(container);

    // Adaptive quality: if frames stay slow after start-up, step down pixel ratio, then bloom.
    let slowFrames = 0;
    let qualityStep = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const rawDelta = clock.getDelta();
      const delta = Math.min(0.1, rawDelta);
      const t = clock.elapsedTime;

      if (!inView || document.hidden) {
        if (isSoftwareGl) {
          frameId = window.setTimeout(tick, 250);
        } else {
          frameId = requestAnimationFrame(tick);
        }
        return;
      }

      if (!lite && readyRef.current && introT >= 1 && t > 5 && qualityStep < 2) {
        slowFrames = rawDelta > 0.034 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
        if (slowFrames > 60) {
          slowFrames = 0;
          qualityStep += 1;
          if (qualityStep === 1 && pixelRatio > 1) {
            pixelRatio = 1;
            renderer.setPixelRatio(1);
            composer?.setPixelRatio(1);
            starMat.uniforms.uPx.value = 1;
            applyLayout();
          } else if (bloomPass) {
            bloomPass.enabled = false;
          }
        }
      }

      if (motionOk) {
        earthMesh.rotation.y += delta * 0.09;
        cloudMesh.rotation.y += delta * 0.115;
        moonMesh.rotation.y += delta * 0.08;
        marsMesh.rotation.y += delta * 0.1;
        stars.rotation.y += delta * 0.004;
        starMat.uniforms.uTime.value = t;
        collars.forEach(({ mesh, mat }, i) => {
          const pulse = Math.sin(t * 2.2 + i * 1.3);
          mesh.scale.setScalar(1 + 0.28 * pulse);
          mat.opacity = 0.55 + 0.25 * pulse;
        });
      }

      if (focusRef.current !== 'earth') introT = 1;

      if (introT < 1) {
        // Hold the opening frame until every texture is in, then glide down to the orbit.
        if (readyRef.current) introT = Math.min(1, introT + delta / INTRO_SECONDS);
        const e = 1 - (1 - introT) ** 3;
        _vec3
          .copy(introStartDir)
          .lerp(introEndDir, e)
          .normalize()
          .multiplyScalar(THREE.MathUtils.lerp(13, earthDist, e));
        camera.position.copy(_vec3);
        controls.target.set(0, 0, 0);
      } else {
        // Smoothly damp OrbitControls target toward active destination
        if (focusRef.current === 'earth') {
          _targetPos.set(0, 0, 0);
        } else if (focusRef.current === 'moon') {
          _targetPos.copy(moonGroup.position);
        } else {
          _targetPos.copy(marsGroup.position);
        }

        controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetPos.x, 4.5, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetPos.y, 4.5, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetPos.z, 4.5, delta);

        const desiredDist = focusRef.current === 'earth' ? earthDist : sideDist;
        _vec3.copy(camera.position).sub(controls.target);
        const currentDist = _vec3.length();
        const dampedDist = THREE.MathUtils.damp(currentDist, desiredDist, 3.8, delta);
        _vec3.normalize().multiplyScalar(dampedDist);
        camera.position.copy(controls.target).add(_vec3);
      }

      controls.update();
      if (composer) {
        composer.render(delta);
      } else {
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      window.clearTimeout(readyFallback);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      visibilityObserver.disconnect();
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      controls.dispose();
      composer?.dispose();
      for (const item of disposables) item.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[460px]">
      {failed && (
        <img
          src={HERO_ASSETS.earthOrbit}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div
        ref={mountRef}
        className={`w-full h-full cursor-grab active:cursor-grabbing transition-opacity duration-[1400ms] ease-out ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Cinematic boot screen: fades out once every texture has loaded. */}
      <div
        role="status"
        aria-live="polite"
        aria-hidden={ready}
        className={`pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-tt-void transition-opacity duration-[1200ms] ease-out ${
          ready ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="relative h-16 w-16" aria-hidden="true">
          <span className="absolute inset-0 rounded-full border border-tt-teal/25" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-tt-teal [animation-duration:1.6s] motion-reduce:animate-none" />
          <span className="absolute inset-[22px] rounded-full bg-tt-sand/70" />
        </div>
        <div className="flex flex-col items-center gap-1.5 font-mono-tabular text-xs tracking-[0.22em] text-tt-mist">
          <span>{locale === 'ar' ? 'جارٍ تهيئة المرصد' : 'INITIALIZING OBSERVATORY'}</span>
          <span dir="ltr" className="text-tt-teal">
            {Math.round(progress * 100)
              .toString()
              .padStart(3, '0')}
            %
          </span>
        </div>
      </div>

      {hoveredPin && (
        <div
          style={{ left: hoveredPin.x, top: hoveredPin.y - 38 }}
          className="pointer-events-none absolute -translate-x-1/2 rounded-md border border-tt-teal/50 bg-[#030509]/95 px-2.5 py-1 text-xs font-medium text-tt-star whitespace-nowrap shadow-[0_14px_40px_rgba(0,0,0,0.95)]"
        >
          {hoveredPin.name}
        </div>
      )}
    </div>
  );
};
