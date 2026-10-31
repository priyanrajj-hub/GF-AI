import * as THREE from 'three'

export const HologramVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uGlitch;

  // Simple pseudo-random hash
  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 worldPos = modelMatrix * vec4(position, 1.0);

    // Apply occasional glitch jitter when uGlitch is active
    if (uGlitch > 0.05) {
      float jitter = (hash(worldPos.y * 10.0 + uTime * 20.0) - 0.5) * uGlitch * 0.12;
      worldPos.x += jitter;
      worldPos.z += jitter * 0.5;
    }

    vWorldPosition = worldPos.xyz;
    vec4 mvPosition = viewMatrix * worldPos;
    vViewPosition = -mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
  }
`

export const HologramFragmentShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  uniform float uTime;
  uniform vec3 uHoloColor;
  uniform vec3 uRimColor;
  uniform float uSolid; // 0.0 for pure hologram, 1.0 for solid
  uniform float uFlicker;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    // Fresnel rim glow
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);

    // Upward moving horizontal scanlines
    float scanline = sin((vWorldPosition.y + uTime * 0.6) * 55.0) * 0.5 + 0.5;
    scanline = pow(scanline, 1.8);

    // Subtle high-frequency holographic flicker
    float flicker = 1.0 - sin(uTime * 35.0) * 0.04 * uFlicker;

    // Compose holographic radiance
    vec3 holo = mix(uHoloColor * 0.7, uRimColor, fresnel * 0.85);
    holo += uHoloColor * (scanline * 0.35);
    holo *= flicker;

    // Solid fallback color
    vec3 solidColor = mix(vec3(0.12, 0.15, 0.22), uHoloColor * 0.5, 0.4);

    vec3 finalColor = mix(holo, solidColor, uSolid * 0.65);
    float alpha = mix(clamp(fresnel * 0.75 + scanline * 0.25 + 0.35, 0.3, 0.95), 1.0, uSolid);

    gl_FragColor = vec4(finalColor, alpha);
  }
`

export function createHologramMaterial(colorHex = '#00f3ff', rimHex = '#ff007f'): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: HologramVertexShader,
    fragmentShader: HologramFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uGlitch: { value: 0 },
      uHoloColor: { value: new THREE.Color(colorHex) },
      uRimColor: { value: new THREE.Color(rimHex) },
      uSolid: { value: 0.0 },
      uFlicker: { value: 1.0 },
    },
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
  })
}
