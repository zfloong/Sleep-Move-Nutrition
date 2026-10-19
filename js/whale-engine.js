/* ============================================================
   Sleep-Move-Nutrition · 深海 3D 粒子巨鲸引擎 (Volumetric 3D Particle Whale)
   灵感与核心算法源自 DeepSeek Harness / dsh-particle-whale 逆向工程
   融合「狂野生长」生命律动两极调控（采集·极光青 ⟷ 施压·熔岩金）
   ============================================================ */
(function (global) {
  'use strict';

  if (!global.THREE) {
    console.error('[WhaleEngine] THREE is required before loading whale-engine.js');
    return;
  }

  const THREE = global.THREE;

  // 官方 DeepSeek 巨鲸流线矢量路径 (viewBox 0 0 24 18)
  const WHALE_PATH =
    'M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519' +
    'C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697' +
    ' 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771' +
    ' 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569' +
    'C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163' +
    ' 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382' +
    ' 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326' +
    ' 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516' +
    ' 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651' +
    ' 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671' +
    ' 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121' +
    ' 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075' +
    ' 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524' +
    ' 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675' +
    ' 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286' +
    ' 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332' +
    ' 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016' +
    ' 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595' +
    ' 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125' +
    ' 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245' +
    ' 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381' +
    ' 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931' +
    ' 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646' +
    ' 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182' +
    ' 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182' +
    ' 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712' +
    ' 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548' +
    ' 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749' +
    ' 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081' +
    ' 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182' +
    ' 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083' +
    ' 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673' +
    ' 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314' +
    ' 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215' +
    ' 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476' +
    ' 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159' +
    ' 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262' +
    ' 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349' +
    ' 15.1546 12.058 15.1731 11.1749 14.4746V14.4736ZM12.141 8.25988' +
    'C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338' +
    ' 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938' +
    ' 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988' +
    'C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639' +
    ' 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793' +
    ' 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143' +
    ' 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691' +
    'C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438' +
    ' 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636' +
    ' 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136' +
    'C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335' +
    ' 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184' +
    ' 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287' +
    'C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009' +
    ' 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493' +
    ' 15.1415 9.79893Z';

  const GRID_SIZE = 60;
  const PARTICLE_SPACING = 0.18;

  // -------------------------------------------------------------
  // 1. 欧氏距离场 (EDT) 算法：将 2D 剪影膨胀为饱满的 3D 纺锤体体积点阵
  // -------------------------------------------------------------
  function generateWhaleVolumetricData(gridSize) {
    const canvas = document.createElement('canvas');
    canvas.width = gridSize;
    canvas.height = gridSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, gridSize, gridSize);

    const scale = Math.min(gridSize / 24, gridSize / 18);
    const renderW = 24 * scale;
    const renderH = 18 * scale;
    ctx.setTransform(scale, 0, 0, scale, (gridSize - renderW) / 2, (gridSize - renderH) / 2);
    ctx.fillStyle = '#fff';
    ctx.fill(new Path2D(WHALE_PATH));

    const imgData = ctx.getImageData(0, 0, gridSize, gridSize).data;
    const half = gridSize / 2;
    const mask = new Float32Array(gridSize * gridSize);
    for (let i = 0; i < gridSize * gridSize; i++) {
      const idx = i * 4;
      mask[i] = (imgData[idx] * 0.299 + imgData[idx + 1] * 0.587 + imgData[idx + 2] * 0.114) / 255;
    }

    const distMap = new Float32Array(gridSize * gridSize);
    let maxD = 1;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (mask[y * gridSize + x] <= 0.2) continue;
        let minDist = 999;
        for (let ny = 0; ny < gridSize; ny += 2) {
          for (let nx = 0; nx < gridSize; nx += 2) {
            if (mask[ny * gridSize + nx] <= 0.2) {
              const d = Math.hypot(x - nx, y - ny);
              if (d < minDist) minDist = d;
            }
          }
        }
        distMap[y * gridSize + x] = minDist;
        if (minDist > maxD && minDist < 900) maxD = minDist;
      }
    }

    const positions = [];
    const normals = [];
    const scattered = [];
    const opacities = [];
    const edges = [];
    const jitters = [];

    const addParticle = (px, py, pz, nx, ny, nz, op, ed) => {
      positions.push(px, py, pz);
      normals.push(nx, ny, nz);
      opacities.push(op);
      edges.push(ed);

      jitters.push(
        (Math.random() - 0.5) * 0.08,
        (Math.random() - 0.5) * 0.08,
        (Math.random() - 0.5) * 0.08
      );

      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(2 * Math.random() - 1);
      const dist = 6.0 * (0.3 + 0.7 * Math.random());
      scattered.push(
        Math.sin(theta) * Math.cos(phi) * dist,
        Math.sin(theta) * Math.sin(phi) * dist,
        Math.cos(theta) * dist * 0.8
      );
    };

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const val = mask[y * gridSize + x];
        if (val <= 0.2) continue;

        const px = (x - half) * PARTICLE_SPACING;
        const py = (half - y) * PARTICLE_SPACING;
        const normD = Math.min(1.0, distMap[y * gridSize + x] / maxD);
        const hFactor = Math.sqrt(normD);

        const spinePos = (px + 2.2) / 5.2;
        const bodyProfile = Math.sin(Math.max(0.0, Math.min(Math.PI, spinePos * Math.PI)));
        const localMaxZ = hFactor * (0.35 + 0.75 * bodyProfile);

        let emptyNeighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize || mask[ny * gridSize + nx] <= 0.2) {
              emptyNeighbors++;
            }
          }
        }
        const edgeFactor = emptyNeighbors / 8.0;

        if (localMaxZ > 0.08) {
          const zFront = localMaxZ * (0.75 + 0.25 * Math.random());
          const nFront = new THREE.Vector3(0, py * 0.2, 1.0).normalize();
          addParticle(px, py, zFront, nFront.x, nFront.y, nFront.z, val, edgeFactor);

          const zBack = -localMaxZ * (0.75 + 0.25 * Math.random());
          const nBack = new THREE.Vector3(0, py * 0.2, -1.0).normalize();
          addParticle(px, py, zBack, nBack.x, nBack.y, nBack.z, val, edgeFactor);
        } else {
          const nEdge = new THREE.Vector3(px * 0.2, py * 0.2, (Math.random() - 0.5) * 0.4).normalize();
          addParticle(px, py, (Math.random() - 0.5) * 0.05, nEdge.x, nEdge.y, nEdge.z, val, edgeFactor);
        }
      }
    }

    return {
      count: positions.length / 3,
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      scatteredPositions: new Float32Array(scattered),
      opacities: new Float32Array(opacities),
      edges: new Float32Array(edges),
      jitters: new Float32Array(jitters)
    };
  }

  // -------------------------------------------------------------
  // 2. 深海星尘星河数据生成
  // -------------------------------------------------------------
  function generateGalaxyData(count = 700) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const twinkles = new Float32Array(count * 2);

    const colA = new THREE.Color(0x2dd4bf); // 极光冰青
    const colB = new THREE.Color(0x38bdf8); // 深海天蓝
    const colC = new THREE.Color(0xffedd5); // 晨露微金
    const tmp = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const isRibbon = Math.random() < 0.65;
      let x = 0, y = 0, z = 0;
      if (isRibbon) {
        const t = (Math.random() - 0.5) * 32.0;
        x = t;
        y = -t * 0.32 + (Math.random() - 0.5) * 6.5;
        z = (Math.random() - 0.5) * 14.0 - 2.0;
      } else {
        x = (Math.random() - 0.5) * 36.0;
        y = (Math.random() - 0.5) * 22.0;
        z = (Math.random() - 0.5) * 16.0 - 4.0;
      }
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const r = Math.random();
      if (r < 0.45) tmp.copy(colA);
      else if (r < 0.8) tmp.copy(colB);
      else tmp.copy(colC);

      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;

      sizes[i] = 1.2 + Math.random() * 2.8;
      twinkles[i * 2] = 0.5 + Math.random() * 2.0;
      twinkles[i * 2 + 1] = Math.random() * Math.PI * 2;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('aTwinkle', new THREE.BufferAttribute(twinkles, 2));
    return geom;
  }

  // -------------------------------------------------------------
  // 3. GLSL 着色器
  // -------------------------------------------------------------
  const WHALE_VS = `
    attribute float aOpacity;
    attribute float aIndex;
    attribute float aEdge;
    attribute vec3 aNormal;
    attribute vec3 aScattered;
    attribute vec3 aJitter;

    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uMouseRadius;
    uniform float uMouseStrength;
    uniform float uMouseDistort;
    uniform float uAssembly;
    uniform float uLoose;
    uniform float uScatter;
    uniform float uIntensity; // 施压 vs 采集 活力强度
    uniform vec3 uLightPos;
    uniform float uLightRange;
    uniform float uShadeMin;
    uniform float uShadeMax;

    varying float vOpacity;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vAssembly;
    varying float vLight;
    varying float vIntensity;

    void main() {
      vOpacity = aOpacity;
      vAssembly = uAssembly;
      vIntensity = uIntensity;

      vec3 targetCenter = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      vec3 localOffset = (instanceMatrix * vec4(position, 1.0)).xyz - targetCenter;

      float pulse = 1.0 + 0.14 * (1.0 + uIntensity * 0.8) * sin(uTime * (2.8 + uIntensity * 1.5) + aIndex * 0.35);
      localOffset *= pulse;

      float assembly = smoothstep(0.0, 1.0, uAssembly);
      vec3 center = mix(aScattered, targetCenter, assembly);
      vec3 pos = center + localOffset;

      float loose = uLoose * assembly;
      if (loose > 0.001) {
        pos += aJitter * loose * (0.8 + 0.5 * uIntensity);

        float spineProg = clamp((targetCenter.x + 2.2) / 5.2, 0.0, 1.0);
        float tailFactor = spineProg * spineProg;

        float swimFreq = mix(1.15, 2.4, uIntensity);
        float wavePhase = uTime * swimFreq - targetCenter.x * 0.88;

        float waveY = sin(wavePhase) * (0.02 + 0.18 * tailFactor);
        float waveZ = cos(wavePhase * 0.85) * (0.015 + 0.13 * tailFactor);

        pos.y += waveY * loose;
        pos.z += waveZ * loose;
      }

      if (uScatter > 0.001) {
        vec3 scOffset = (aScattered - center) * (uScatter * mix(0.6, 1.25, aEdge));
        scOffset.z += sin(uTime * 1.4 + aIndex * 0.5) * uScatter * 1.2;
        pos += scOffset;
      }

      if (assembly > 0.7) {
        vec2 toMouse = center.xy - uMouse;
        float distM = length(toMouse);
        if (distM < uMouseRadius && distM > 0.001) {
          float t = 1.0 - distM / uMouseRadius;
          float force = t * t * t * uMouseStrength;
          vec2 rDir = toMouse / distM;
          float nAngle = sin(aIndex * 0.37 + uTime * 0.5) * uMouseDistort;
          vec2 push = vec2(rDir.x * cos(nAngle) - rDir.y * sin(nAngle), rDir.x * sin(nAngle) + rDir.y * cos(nAngle));
          pos.xy += push * force * 2.2;
          pos.z += sin(aIndex * 1.5 + uTime) * force * 1.2;
        }
      }

      vec4 worldPos = modelMatrix * vec4(pos, 1.0);
      vWorldPos = worldPos.xyz;
      vNormal = normalize((modelMatrix * vec4(aNormal, 0.0)).xyz);

      float lDist = distance(worldPos.xyz, uLightPos);
      float lit = clamp(1.0 - lDist / uLightRange, 0.0, 1.0);
      vLight = mix(uShadeMin, uShadeMax, lit * lit);

      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  const WHALE_FS = `
    varying float vOpacity;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vAssembly;
    varying float vLight;
    varying float vIntensity;

    uniform float uTime;
    uniform vec3 uColorA; // 采集色 (极光青)
    uniform vec3 uColorB; // 施压色 (暖阳金)

    void main() {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(vec3(0.0, 0.0, 1.0));
      float NdotV = abs(dot(N, V));
      float fresnel = pow(1.0 - NdotV, 2.2);

      vec3 L = normalize(vec3(0.35, 0.85, 0.95));
      float diff = max(0.2, dot(N, L));
      vec3 H = normalize(L + V);
      float spec = pow(max(0.0, dot(N, H)), 8.0) * 0.50;

      float pulseSpeed = mix(1.1, 2.8, vIntensity);
      float pulseWave = sin(uTime * pulseSpeed - vWorldPos.x * 2.2 + vWorldPos.y * 1.5) * 0.5 + 0.5;
      float glow = mix(0.12, 0.42, vIntensity) * pulseWave;

      float baseAlpha = mix(0.40, 0.85, vAssembly) + fresnel * 0.35 + glow;
      float alpha = vOpacity * baseAlpha;

      vec3 targetColor = mix(uColorA, uColorB, vIntensity);
      vec3 color = targetColor * (diff * vLight + spec) + fresnel * mix(vec3(0.25, 0.75, 0.95), vec3(1.0, 0.7, 0.3), vIntensity) * vLight;
      color = mix(color, color * vec3(1.15, 1.08, 0.95), clamp(vLight - 1.0, 0.0, 1.0));

      gl_FragColor = vec4(color, alpha);
    }
  `;

  const GALAXY_VS = `
    attribute vec3 aColor;
    attribute float aSize;
    attribute vec2 aTwinkle;
    uniform float uTime;
    varying vec3 vColor;
    varying float vTwinkle;

    void main() {
      vColor = aColor;
      float tw = sin(uTime * aTwinkle.x + aTwinkle.y) * 0.5 + 0.5;
      vTwinkle = 0.4 + 0.6 * tw;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * (160.0 / -mvPosition.z) * vTwinkle;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const GALAXY_FS = `
    varying vec3 vColor;
    varying float vTwinkle;
    uniform float uOpacity;

    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      float alpha = smoothstep(0.5, 0.0, d) * uOpacity * vTwinkle;
      gl_FragColor = vec4(vColor, alpha);
    }
  `;

  // -------------------------------------------------------------
  // 4. 引擎主类：WhaleBioEngine
  // -------------------------------------------------------------
  class WhaleBioEngine {
    constructor(container) {
      this.container = container;
      this.width = container.clientWidth || window.innerWidth;
      this.height = container.clientHeight || window.innerHeight;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(46, this.width / this.height, 0.1, 100);
      this.camera.position.set(0, 0, 14.5);

      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(this.width, this.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      container.appendChild(this.renderer.domElement);

      this.stateIntensity = 0.0; // 0 = 采集态, 1 = 施压态
      this.targetIntensity = 0.0;

      this.initGalaxy();
      this.initWhale();
      this.initKinematics();
      this.bindEvents();

      this.clock = new THREE.Clock();
      this.animState = 'assembling'; // scattering, assembling, idle
      this.animTimer = 0.0;

      this.animate = this.animate.bind(this);
      this.raf = requestAnimationFrame(this.animate);
    }

    initGalaxy() {
      // 纯净深海模式：不再注入杂乱的五彩星尘粒子，保持深海深邃与点线网格的纯粹美感
      this.galaxyPoints = null;
    }

    initWhale() {
      const pixelData = generateWhaleVolumetricData(GRID_SIZE);
      const indexArray = new Float32Array(pixelData.count);
      for (let i = 0; i < pixelData.count; i++) indexArray[i] = i;

      const geometry = new THREE.BoxGeometry(0.065, 0.065, 0.020);
      geometry.setAttribute('aOpacity', new THREE.InstancedBufferAttribute(pixelData.opacities, 1));
      geometry.setAttribute('aIndex', new THREE.InstancedBufferAttribute(indexArray, 1));
      geometry.setAttribute('aNormal', new THREE.InstancedBufferAttribute(pixelData.normals, 3));
      geometry.setAttribute('aScattered', new THREE.InstancedBufferAttribute(pixelData.scatteredPositions, 3));
      geometry.setAttribute('aEdge', new THREE.InstancedBufferAttribute(pixelData.edges, 1));
      geometry.setAttribute('aJitter', new THREE.InstancedBufferAttribute(pixelData.jitters, 3));

      this.whaleMaterial = new THREE.ShaderMaterial({
        vertexShader: WHALE_VS,
        fragmentShader: WHALE_FS,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uLightPos: { value: new THREE.Vector3(5.0, 6.0, 5.0) },
          uLightRange: { value: 20.0 },
          uShadeMin: { value: 0.38 },
          uShadeMax: { value: 1.90 },
          uColorA: { value: new THREE.Color(0x2dd4bf) }, // 采集：极光冰青
          uColorB: { value: new THREE.Color(0xff7e2a) }, // 施压：晨曦流金
          uMouse: { value: new THREE.Vector2(999, 999) },
          uMouseRadius: { value: 5.5 },
          uMouseStrength: { value: 0.8 },
          uMouseDistort: { value: 5.0 },
          uAssembly: { value: 0 },
          uLoose: { value: 1.0 },
          uScatter: { value: 0 },
          uIntensity: { value: 0.0 }
        }
      });

      this.instancedMesh = new THREE.InstancedMesh(geometry, this.whaleMaterial, pixelData.count);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < pixelData.count; i++) {
        dummy.position.set(
          pixelData.positions[i * 3],
          pixelData.positions[i * 3 + 1],
          pixelData.positions[i * 3 + 2]
        );
        const s = 0.65 + 0.70 * Math.random();
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      this.instancedMesh.instanceMatrix.needsUpdate = true;

      this.whaleGroup = new THREE.Group();
      this.whaleGroup.add(this.instancedMesh);
      this.scene.add(this.whaleGroup);
    }

    initKinematics() {
      this.mouse = {
        clientX: 999, clientY: 999,
        smoothX: 999, smoothY: 999,
        hasMoved: false
      };
      this.invMatrix = new THREE.Matrix4();
      this.localMouse = new THREE.Vector3();

      this.swimAgent = {
        pos: new THREE.Vector3(0, 0, 0),
        vel: new THREE.Vector3(-0.015, 0, 0),
        yaw: Math.PI,
        pitch: 0,
        roll: 0,
        targetYaw: Math.PI
      };
    }

    bindEvents() {
      this.onResize = () => {
        this.width = this.container.clientWidth || window.innerWidth;
        this.height = this.container.clientHeight || window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
      };
      window.addEventListener('resize', this.onResize, { passive: true });

      this.onMouseMove = (e) => {
        this.mouse.hasMoved = true;
        const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
        const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
        const v = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(this.camera);
        const dir = v.sub(this.camera.position).normalize();
        const dist = -this.camera.position.z / dir.z;
        const worldP = this.camera.position.clone().add(dir.multiplyScalar(dist));
        this.mouse.clientX = worldP.x;
        this.mouse.clientY = worldP.y;
      };
      window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    }

    // 触发星云爆散重组（换季或点击时触发震撼冲击）
    triggerScatter() {
      this.animState = 'scattering';
      this.animTimer = 0.0;
    }

    // 切换状态：'gather' (0) 或 'hi' (1)
    setState(stateName) {
      this.targetIntensity = (stateName === 'hi') ? 1.0 : 0.0;
      this.triggerScatter();
    }

    animate() {
      this.raf = requestAnimationFrame(this.animate);
      const delta = Math.min(this.clock.getDelta(), 0.05);
      const elapsed = this.clock.getElapsedTime();

      // 状态平滑过渡 (采集 ⟷ 施压)
      this.stateIntensity += (this.targetIntensity - this.stateIntensity) * 0.06;
      this.whaleMaterial.uniforms.uIntensity.value = this.stateIntensity;

      // 1. 散开与重组动画
      if (this.animState === 'scattering') {
        this.animTimer += delta;
        const p = Math.min(1.0, this.animTimer / 0.32);
        const easeP = Math.sin(p * Math.PI * 0.5);
        this.whaleMaterial.uniforms.uScatter.value = easeP;
        this.whaleMaterial.uniforms.uAssembly.value = 1.0 - easeP * 0.85;
        if (p >= 1.0) {
          this.animState = 'assembling';
          this.animTimer = 0.0;
        }
      } else if (this.animState === 'assembling') {
        this.animTimer += delta;
        const p = Math.min(1.0, this.animTimer / 1.1);
        const easeIn = 1.0 - Math.pow(1.0 - p, 3);
        this.whaleMaterial.uniforms.uScatter.value = 1.0 - easeIn;
        this.whaleMaterial.uniforms.uAssembly.value = easeIn;
        if (p >= 1.0) {
          this.animState = 'idle';
          this.whaleMaterial.uniforms.uScatter.value = 0.0;
          this.whaleMaterial.uniforms.uAssembly.value = 1.0;
        }
      }

      // 2. 星河深海尘埃背景
      if (this.galaxyMaterial) {
        this.galaxyMaterial.uniforms.uTime.value = elapsed;
        if (this.mouse.hasMoved) {
          this.galaxyPoints.position.x = this.mouse.smoothX * 0.03;
          this.galaxyPoints.position.y = this.mouse.smoothY * 0.03;
        }
      }

      this.whaleMaterial.uniforms.uTime.value = elapsed;

      // 3. 鼠标排斥场
      if (this.mouse.hasMoved) {
        this.mouse.smoothX += (this.mouse.clientX - this.mouse.smoothX) * 0.18;
        this.mouse.smoothY += (this.mouse.clientY - this.mouse.smoothY) * 0.18;
        this.invMatrix.copy(this.whaleGroup.matrixWorld).invert();
        this.localMouse.set(this.mouse.smoothX, this.mouse.smoothY, 0).applyMatrix4(this.invMatrix);
        this.whaleMaterial.uniforms.uMouse.value.set(this.localMouse.x, this.localMouse.y);

        this.whaleMaterial.uniforms.uLightPos.value.set(
          5.0 + this.mouse.smoothX * 0.1,
          6.0 + this.mouse.smoothY * 0.1,
          5.0
        );
      }

      // 4. 巨鲸中央优雅悬浮动力学 (Hover Mode · 原地起伏呼吸与视差微倾)
      // 保持巨鲸稳定处于视口中央，不漫天漂移乱窜，深邃而庄严
      const breathBob = Math.sin(elapsed * 0.65) * 0.28;
      const mouseParallaxX = this.mouse.hasMoved ? (this.mouse.smoothX * 0.04) : 0;
      const mouseParallaxY = this.mouse.hasMoved ? (this.mouse.smoothY * 0.03) : 0;

      // 视觉锚点：居于视口中央偏上 (约 +0.3)，完美处于节奏栏与三大支柱卡片间的黄金留白区
      const targetX = mouseParallaxX;
      const targetY = 0.30 + breathBob + mouseParallaxY;
      const targetZ = 0.0;

      this.swimAgent.pos.x += (targetX - this.swimAgent.pos.x) * 0.05;
      this.swimAgent.pos.y += (targetY - this.swimAgent.pos.y) * 0.05;
      this.swimAgent.pos.z += (targetZ - this.swimAgent.pos.z) * 0.05;

      this.whaleGroup.position.copy(this.swimAgent.pos);

      // 优雅微仰俯与微横滚（保持头部朝左优雅舒展，随鼠标灵动微偏）
      const targetRotZ = Math.sin(elapsed * 0.45) * 0.04 + (this.mouse.hasMoved ? -this.mouse.smoothX * 0.012 : 0);
      const targetRotX = Math.sin(elapsed * 0.60) * 0.08 + (this.mouse.hasMoved ? -this.mouse.smoothY * 0.025 : 0);
      const targetRotY = Math.cos(elapsed * 0.50) * 0.14 + (this.mouse.hasMoved ? this.mouse.smoothX * 0.035 : 0);

      this.whaleGroup.rotation.z += (targetRotZ - this.whaleGroup.rotation.z) * 0.05;
      this.whaleGroup.rotation.x += (targetRotX - this.whaleGroup.rotation.x) * 0.05;
      this.whaleGroup.rotation.y += (targetRotY - this.whaleGroup.rotation.y) * 0.05;

      // 宏伟尺寸
      const baseScale = Math.min(1.15, Math.max(0.75, window.innerWidth / 1200));
      this.whaleGroup.scale.setScalar(baseScale * (1.0 + this.stateIntensity * 0.15));

      this.renderer.render(this.scene, this.camera);
    }

    dispose() {
      cancelAnimationFrame(this.raf);
      window.removeEventListener('resize', this.onResize);
      window.removeEventListener('mousemove', this.onMouseMove);
      if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.remove();
        this.renderer.dispose();
      }
    }
  }

  global.WhaleBioEngine = WhaleBioEngine;
})(window);
