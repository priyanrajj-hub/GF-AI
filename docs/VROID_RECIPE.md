# VRoid Studio Recipe: Custom Ada Companion Avatar

Follow this exact guide to create and export the definitive custom **Ada** VRM avatar in [VRoid Studio](https://vroid.com/en/studio) (free on Windows/macOS/Steam).

---

## 1. Hair: Spy-Chic Short Bob
- **Base Style:** Select the **Short Bob** preset from the Hair library.
- **Bangs:** Choose **Side-Swept Bangs** angling gently across the forehead to the right cheek.
- **Color Palette:**
  - Base Color: `#0B0B0F` (Pitch Charcoal Black)
  - Shade Color: `#050508`
  - Highlight / Rim Sheen: `#1a2035` (Very subtle deep blue-violet sheen)
- **Spring Bones:**
  - Group hair into 3-4 bone chains with **Stiffness = 0.75**, **Drag Force = 0.4**, **Gravity = 0.05** so it sways naturally during movement and dances without clipping through the neck.

---

## 2. Outfit: Red & Black Spy Elegance
- **Clothing Category:** One-piece / Dress or Jacket & Pants.
- **Dress / Top:**
  - Main Fabric Color: `#C1121F` (Deep Crimson Red)
  - Shade Color: `#59060E` (Dark Velvet)
  - Silhouette: Fitted, clean lines, no bows or frilly accessories.
- **Accents:**
  - Collar / Trim: Pitch Black (`#0a0a0d`) with subtle gold clasp accents (`#d4af37`).
  - Gloves: Black wrist-length or fingerless gloves.
  - Legs: Sheer black tights or fitted black leggings.
  - Footwear: Classic black spy boots or elegant low heels (`#0a0a0d`).

---

## 3. Face & Expression Tuning
- **Eyes:**
  - Shape: Slightly sharper, narrower anime eyes with confident arch.
  - Iris: Hazel / Warm Amber (`#8c531b`) or Cyber Hazel.
  - Eyeliner: Clean black winged liner (`#0a0a0d`).
- **Mouth & Lips:**
  - Default Expression: Confident subtle smirk / calm warm smile.
  - Lip Color: Deep red tint (`#9e1b27`).
- **Accessories:**
  - Ensure all ribbons, pastel clips, and oversized bows are removed.

---

## 4. VRM Export Settings
1. Click **Export** in the top right of VRoid Studio -> **Export as VRM**.
2. **Optimization Settings:**
   - Reduce Polygons: Medium (target 35,000 - 55,000 polys).
   - Texture Atlas: Target 2048x2048 or 4096x4096 compressed.
   - Total file size: Keep under **15 MB**.
3. **VRM Meta Information:**
   - Title: `Ada`
   - Version: `1.0` (or `0.0`)
   - Author: `Your Name`
   - Allowed User: `Only Author` or `Everyone`
   - Commercial Use: Allowed
4. Save the file directly to:
   ```
   apps/web/public/models/ada.vrm
   ```
5. Reload `http://localhost:5173` — the app will automatically mount your custom Ada avatar!
