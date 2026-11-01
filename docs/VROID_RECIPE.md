# VRoid Studio Recipe: Ada Original (Spy-Chic)

A comprehensive guide for authoring the **Ada Original** avatar in VRoid Studio (v1.20+) or Blender, producing a standardized VRM model matching Milestone 1 specifications.

---

## 1. Hair Modeling (Short Bob with Side-Swept Bangs)

- **Style**: Sleek chin-length asymmetric bob with volume at the crown and left side-swept bangs.
- **Base Color**: `#15151A` (Deep near-black charcoal).
- **Shade Color**: `#0B0B0F` (Midnight velvet shade).
- **Highlight Color**: `#2A2C38` (Subtle steel blue sheen band).
- **Outline**: Thickness `15`, Outline Color `#040406`.
- **Spring Bones**:
  - Front Bangs: Stiffness `0.65`, Drag Force `0.30` (holds shape during movement).
  - Back/Side Bob: Stiffness `0.55`, Gravity `0.05` (subtle natural bounce during head turns).

---

## 2. Facial Features & Makeup

- **Eye Irises**:
  - Iris Color: `#9E5124` (Deep warm amber-hazel).
  - Highlight: Small dual circular catch-lights in upper-left quadrant.
- **Eyelashes & Eyeliner**:
  - Sharp black cat-eye eyeliner wing (`#000000`).
  - Separated anime lash spikes.
- **Eyebrows**:
  - Slender, arched black brows (`#15151A`) with expressive tilt.
- **Cheeks**:
  - Soft radial blush: `rgba(238, 90, 110, 0.40)`.
- **Lips**:
  - Defined Cupid's bow silhouette.
  - Base Color: `#C81E2F` (Rich crimson).
  - Depth Center: `#6E050F` (Dark velvet inner lip).
  - Gloss Highlight: Soft oval specular catch-light on center lower lip (`rgba(255, 220, 230, 0.55)`).

---

## 3. Outfit Layers & Textures

### Layer 1: Ribbed Turtleneck Sweater Dress
- **Base Cut**: High neck turtleneck with slender pencil-cut silhouette ending mid-thigh.
- **Texture**: Fine vertical knit ribbing normal map.
- **Base Color**: `#800020` / `#C81E2F` (Burgundy/Crimson red).
- **Shade Color**: `#5C0912`.
- **Roughness**: `0.55` (Knit wool texture).
- **Metalness**: `0.08`.

### Layer 2: Tactical Leather Chest Harness
- **Design**: Twin cross-body chest straps crossing just above bust line, connecting to shoulder loops.
- **Material**: Matte grain black leather (`#16161A`).
- **Hardware**: Twin brushed silver metallic buckles (`#C0C0C0`), metalness `0.85`, roughness `0.20`.
- **Waist**: Thin 1-inch black leather belt with silver rectangular buckle.

### Layer 3: Armwear & Gloves
- **Type**: Form-fitting tactical gloves reaching mid-forearm.
- **Color**: `#111216` (Deep black).
- **Material**: Semi-gloss leather, roughness `0.35`.

### Layer 4: Legwear & Boots
- **Stockings**: Semi-sheer midnight tights (`rgba(20, 20, 24, 0.88)`).
- **Boots**: Black thigh-high leather boots with reinforced heel, color `#141418`, roughness `0.38`.

### Layer 5: Tactical Comms Headset (Accessory)
- **Design**: Ultra-slim metallic black headband over right ear with articulated boom microphone angled toward lip corner.
- **Indicator**: Tiny cyan/amber status LED (`#00F3FF`) at mic tip.

---

## 4. VRM Export Settings

1. **Format**: VRM 0.x / VRM 1.0.
2. **Polygon Reduction**:
   - Total Triangles: Target 32,000 – 48,000 tris for smooth 60fps web rendering.
3. **Materials**:
   - Shader: `MToon` (Pixiv Toon Shader).
   - Texture Resolution: 1024x1024 (compressed sRGB).
4. **Blend Shapes / Expressions**:
   - Essential presets: `neutral`, `happy`, `angry`, `sad`, `relaxed`, `surprised`, `blink`, `blink_l`, `blink_r`, `aa`, `ih`, `ou`, `ee`, `oh`.
5. **Output Path**:
   - Commit public build as: `apps/web/public/models/ada.vrm`.
