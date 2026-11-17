import fs from 'fs';
import path from 'path';

const projectRoot = 'C:\\Users\\PRIYANRAJ J\\.gemini\\antigravity\\scratch\\ai---gf---assistant-';

// 1. Fix HoloScene.tsx: Add OrbitControls and remove fighting CameraRig lerps
const holoScenePath = path.join(projectRoot, 'apps/web/src/components/scene/HoloScene.tsx');
let holoScene = fs.readFileSync(holoScenePath, 'utf8');

// Replace imports if needed
if (!holoScene.includes("import { OrbitControls } from '@react-three/drei'")) {
  holoScene = holoScene.replace(
    "import { Canvas, useFrame, useThree } from '@react-three/fiber'",
    "import { Canvas, useFrame, useThree } from '@react-three/fiber'\nimport { OrbitControls } from '@react-three/drei'"
  );
}

// Replace CameraRig with smooth OrbitControls controller
const oldCameraRig = `function CameraRig() {
  const { pointer, size } = useThree()
  const { settings, avatarPosition } = useAppStore()

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const isCloseUp = !!settings.closeUpView
    const aspect = size.width / Math.max(1, size.height)

    // Current position of avatar in world space
    const adaX = (avatarPosition && avatarPosition[0]) || 0
    const adaY = (avatarPosition && avatarPosition[1] !== undefined) ? avatarPosition[1] : -0.72
    const adaZ = (avatarPosition && avatarPosition[2]) || 0

    // Full-body responsive framing distance - perfectly framing head to toe with headroom
    let baseDist = 4.35
    if (aspect < 1.0) {
      baseDist = 4.80 // Mobile portrait
    } else if (size.height < 650) {
      baseDist = 4.40 // Short landscape
    }

    const targetZ = isCloseUp ? adaZ + 1.65 : baseDist
    const targetY = isCloseUp ? adaY + 1.25 : 0.16 // Lift camera up so head has ample headroom below TopBar
    const targetX = adaX * (isCloseUp ? 0.90 : 0.35) + pointer.x * (isCloseUp ? 0.04 : 0.12)

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, delta * 3.0)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY + Math.sin(t * 0.4) * 0.006, delta * 3.0)
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, delta * 3.0)

    const lookAtX = adaX * (isCloseUp ? 0.90 : 0.35)
    const lookAtY = isCloseUp ? adaY + 1.20 : 0.08 // Look at chest level so head is comfortably below the top HUD
    const lookAtZ = isCloseUp ? adaZ : 0
    state.camera.lookAt(lookAtX, lookAtY, lookAtZ)
  })

  return null
}`;

const newCameraRig = `function CameraController() {
  const { settings, avatarPosition } = useAppStore()
  const controlsRef = useRef<any>(null)

  const isCloseUp = !!settings.closeUpView
  const adaX = (avatarPosition && avatarPosition[0]) || 0
  const adaY = (avatarPosition && avatarPosition[1] !== undefined) ? avatarPosition[1] : -0.72
  const adaZ = (avatarPosition && avatarPosition[2]) || 0

  const targetY = isCloseUp ? adaY + 1.25 : 0.38
  const targetX = adaX * 0.5
  const targetZ = adaZ * 0.5

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(targetX, targetY, targetZ)
      controlsRef.current.update()
    }
  }, [targetX, targetY, targetZ])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={1.2}
      maxDistance={6.0}
      maxPolarAngle={Math.PI / 2 + 0.02}
      minPolarAngle={0.10}
      target={[targetX, targetY, targetZ]}
      enablePan={true}
    />
  )
}`;

holoScene = holoScene.replace(oldCameraRig, newCameraRig);
holoScene = holoScene.replace('{/* Fixed Wide Parallax Camera */}\n          <CameraRig />', '{/* 360° Rotatable Orbit Controls & Framed Camera */}\n          <CameraController />');
holoScene = holoScene.replace('<CameraRig />', '<CameraController />');

// Update initial canvas camera position
holoScene = holoScene.replace(
  "camera={{ position: [0, 0.04, 3.30], fov: 30 }}",
  "camera={{ position: [0, 0.45, 3.80], fov: 32 }}"
);

fs.writeFileSync(holoScenePath, holoScene, 'utf8');
console.log('Updated HoloScene.tsx');

// 2. Fix useAppStore.ts: Default to fully rigged animated VRM
const storePath = path.join(projectRoot, 'apps/web/src/store/useAppStore.ts');
let store = fs.readFileSync(storePath, 'utf8');

store = store.replace(
  "avatarModelUrl: '/models/ada_fullbody_tripo.glb',",
  "avatarModelUrl: '/models/ada.vrm',"
);
store = store.replace(
  "avatarModelUrl: '/models/ada_fullbody_tripo.glb',",
  "avatarModelUrl: '/models/ada.vrm',"
);

fs.writeFileSync(storePath, store, 'utf8');
console.log('Updated useAppStore.ts');

// 3. Fix VrmAvatar.tsx: Rigged VRM for Ada, Double-click for floor walk, no pointer interception
const vrmAvatarPath = path.join(projectRoot, 'apps/web/src/components/avatar/VrmAvatar.tsx');
let vrmAvatar = fs.readFileSync(vrmAvatarPath, 'utf8');

// Replace isTripoAda logic
const oldTripoLogic = `    // Hard character boundaries: Tony Stark loads ironman.glb, Ada Wong loads authentic 3D PBR model, Yor loads VRM
    const isAtlas = activeCharacter === 'atlas' || (modelUrl || '').includes('ironman')
    const isTripoAda = activeCharacter === 'ada' || (modelUrl || '').includes('tripo')

    if (isAtlas || isTripoAda) {
      setVrm(null)
    } else {
      setGlbScene(null)
    }

    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.register((parser) => new VRMLoaderPlugin(parser))

    const defaultUrl = isAtlas
      ? '/models/ironman.glb'
      : isTripoAda
      ? '/models/ada_fullbody_tripo.glb'
      : '/models/ada.vrm'`;

const newTripoLogic = `    // Character boundaries: Tony Stark loads ironman.glb, Ada & Yor load fully rigged expressive VRM
    const isAtlas = activeCharacter === 'atlas' || (modelUrl || '').includes('ironman')
    const isExplicitTripo = (modelUrl || '').includes('tripo')

    if (isAtlas || isExplicitTripo) {
      setVrm(null)
    } else {
      setGlbScene(null)
    }

    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.register((parser) => new VRMLoaderPlugin(parser))

    const defaultUrl = isAtlas
      ? '/models/ironman.glb'
      : isExplicitTripo
      ? '/models/ada_fullbody_tripo.glb'
      : '/models/ada.vrm'`;

vrmAvatar = vrmAvatar.replace(oldTripoLogic, newTripoLogic);

// Replace pointer handling and mesh hierarchy
const oldPointerHandling = `  // 3. Pointer Click Handling (Floor move & Avatar Poke)
  const handlePointerDown = (e: any) => {
    e.stopPropagation()

    // If clicked directly on avatar mesh -> Energetic Poke reaction!
    let isAvatarClicked = false
    let current = e.object
    while (current) {
      if (current === vrm?.scene || current === glbScene) {
        isAvatarClicked = true
        break
      }
      current = current.parent
    }

    if (isAvatarClicked) {
      const isStark = activeCharacter === 'atlas'
      const poke = navigatorRef.handlePoke(activeCharacter || 'ada')
      if (animatorRef.current) {
        animatorRef.current.setOverlayAction(poke.action)
      }
      useAppStore.getState().setEmotionAndGesture(isStark ? 'motivated' : 'happy', 1.0, poke.action as any)
      useAppStore.getState().addMessage({
        id: \`msg-poke-\${Date.now()}\`,
        role: 'assistant',
        content: \`*\${poke.speech}*\`,
        speech: poke.speech,
        emotion: isStark ? 'motivated' : 'happy',
        gesture: poke.action as any,
        timestamp: Date.now(),
      })
      VoiceEngine.speak(poke.speech, {
        rate: isStark ? 1.0 : 1.06,
        pitch: isStark ? 0.90 : 1.05,
        language: settings.language,
      })
      setActiveFX(isStark ? ['sparkles', 'exclamation'] : ['exclamation', 'hearts', 'sparkles'])
      setTimeout(() => setActiveFX([]), 2800)
      return
    }

    // Otherwise clicked on floor -> Walk or Run to spot with catwalk!
    if (e.point) {
      const isDouble = e.nativeEvent?.detail === 2
      navigatorRef.moveTo(e.point.x, e.point.z, isDouble, 'sassy_hip_pop')
      setClickMarker([e.point.x, -0.715, e.point.z])
      setTimeout(() => setClickMarker(null), 3000)
    }
  }

  return (
    <group onPointerDown={handlePointerDown}>
      {/* 1. VRM Character Scene (Strictly only for Ada and Yor - NEVER Tony Stark) */}
      {vrm && activeCharacter !== 'atlas' && <primitive object={vrm.scene} />}

      {/* 2. Standard GLB Scene */}
      {glbScene && <primitive object={glbScene} />}

      {/* 3. Anime FX Layer (Clean stage, mascot hidden to focus on Ada) */}
      <AnimeFXLayer
        activeFX={activeFX}
        avatarPosition={avatarWorldPos}
        showMascot={false}
      />

      {/* 4. Interactive Destination Ripple Ring */}
      {clickMarker && (
        <group position={clickMarker}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.14, 32]} />
            <meshBasicMaterial color={hologramColor} transparent opacity={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.20, 0.24, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
        </group>
      )}

      {/* 5. Clickable Invisible Floor Plane for Raycast Navigation */}
      <mesh
        position={[0, -0.72, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )`;

const newPointerHandling = `  // 3. Pointer Click Handling (Avatar Poke & Double-Click Navigation)
  const handleAvatarClick = (e: any) => {
    e.stopPropagation()
    const isStark = activeCharacter === 'atlas'
    const poke = navigatorRef.handlePoke(activeCharacter || 'ada')
    if (animatorRef.current) {
      animatorRef.current.setOverlayAction(poke.action)
    }
    useAppStore.getState().setEmotionAndGesture(isStark ? 'motivated' : 'happy', 1.0, poke.action as any)
    useAppStore.getState().addMessage({
      id: \`msg-poke-\${Date.now()}\`,
      role: 'assistant',
      content: \`*\${poke.speech}*\`,
      speech: poke.speech,
      emotion: isStark ? 'motivated' : 'happy',
      gesture: poke.action as any,
      timestamp: Date.now(),
    })
    VoiceEngine.speak(poke.speech, {
      rate: isStark ? 1.0 : 1.06,
      pitch: isStark ? 0.90 : 1.05,
      language: settings.language,
    })
    setActiveFX(isStark ? ['sparkles', 'exclamation'] : ['exclamation', 'hearts', 'sparkles'])
    setTimeout(() => setActiveFX([]), 2800)
  }

  const handleFloorDoubleClick = (e: any) => {
    e.stopPropagation()
    if (e.point) {
      navigatorRef.moveTo(e.point.x, e.point.z, true, 'sassy_hip_pop')
      setClickMarker([e.point.x, -0.715, e.point.z])
      setTimeout(() => setClickMarker(null), 3000)
    }
  }

  return (
    <group>
      {/* 1. VRM Character Scene (Ada & Yor: fully rigged, expressive, animated) */}
      {vrm && activeCharacter !== 'atlas' && (
        <group onClick={handleAvatarClick}>
          <primitive object={vrm.scene} />
        </group>
      )}

      {/* 2. Standard GLB Scene (Iron Man Mark Armor) */}
      {glbScene && (
        <group onClick={handleAvatarClick}>
          <primitive object={glbScene} />
        </group>
      )}

      {/* 3. Anime FX Layer */}
      <AnimeFXLayer
        activeFX={activeFX}
        avatarPosition={avatarWorldPos}
        showMascot={false}
      />

      {/* 4. Interactive Destination Ripple Ring */}
      {clickMarker && (
        <group position={clickMarker}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.14, 32]} />
            <meshBasicMaterial color={hologramColor} transparent opacity={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.20, 0.24, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
        </group>
      )}

      {/* 5. Double-Click Floor Plane (Double-click to walk, drag to 360° rotate without conflict) */}
      <mesh
        position={[0, -0.72, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onDoubleClick={handleFloorDoubleClick}
      >
        <planeGeometry args={[16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )`;

vrmAvatar = vrmAvatar.replace(oldPointerHandling, newPointerHandling);
fs.writeFileSync(vrmAvatarPath, vrmAvatar, 'utf8');
console.log('Updated VrmAvatar.tsx');

// 4. Fix Yor Head Assembly in ada-red.ts: Remove floating Torus halo and pins
const adaRedPath = path.join(projectRoot, 'apps/web/src/avatar/skins/ada-red.ts');
let adaRed = fs.readFileSync(adaRedPath, 'utf8');

// Replace the head assembly in attachYorThornPrincessFeatures
const oldYorHeadAssembly = `    // 1. Golden Headband Crown
    const bandGeo = new THREE.TorusGeometry(0.125, 0.0036, 12, 36, Math.PI * 0.96)
    const bandMesh = new THREE.Mesh(bandGeo, goldMat)
    bandMesh.rotation.x = Math.PI / 2
    bandMesh.rotation.z = -Math.PI / 2
    bandMesh.position.set(0, 0.080, 0.015)
    headGroup.add(bandMesh)

    // 2. Sculpted Golden Roses over temples
    const createRose = () => {
      const g = new THREE.Group()
      const centerGeo = new THREE.SphereGeometry(0.013, 12, 12)
      const centerMesh = new THREE.Mesh(centerGeo, goldMat)
      g.add(centerMesh)
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const petalGeo = new THREE.CylinderGeometry(0.008, 0.003, 0.018, 8)
        const petalMesh = new THREE.Mesh(petalGeo, goldMat)
        petalMesh.position.set(Math.cos(angle) * 0.013, Math.sin(angle) * 0.013, 0)
        petalMesh.rotation.z = angle
        g.add(petalMesh)
      }
      return g
    }

    const leftRose = createRose()
    leftRose.position.set(0.098, 0.045, -0.012)
    headGroup.add(leftRose)

    const rightRose = createRose()
    rightRose.position.set(-0.098, 0.045, -0.012)
    headGroup.add(rightRose)

    // 3. Protruding Golden Stylus Needles (Hairpins pointing backward/upward)
    const needleShaftGeo = new THREE.CylinderGeometry(0.0018, 0.0032, 0.14, 10)
    const needleTipGeo = new THREE.ConeGeometry(0.0032, 0.026, 10)

    const createStylus = (isLeft: boolean) => {
      const g = new THREE.Group()
      const shaft = new THREE.Mesh(needleShaftGeo, goldMat)
      const tip = new THREE.Mesh(needleTipGeo, goldMat)
      tip.position.y = 0.082
      g.add(shaft)
      g.add(tip)
      g.rotation.x = -Math.PI * 0.28
      g.rotation.z = isLeft ? -Math.PI * 0.22 : Math.PI * 0.22
      return g
    }

    const leftPin = createStylus(true)
    leftPin.position.set(0.098, 0.055, -0.025)
    headGroup.add(leftPin)

    const rightPin = createStylus(false)
    rightPin.position.set(-0.098, 0.055, -0.025)
    headGroup.add(rightPin)

    // 4. Dangling Golden Needle / Stiletto Earrings`;

const newYorHeadAssembly = `    // 1. Subtle, snug hair-framing golden rose accents over temples
    const createRose = () => {
      const g = new THREE.Group()
      const centerGeo = new THREE.SphereGeometry(0.008, 10, 10)
      const centerMesh = new THREE.Mesh(centerGeo, goldMat)
      g.add(centerMesh)
      return g
    }

    const leftRose = createRose()
    leftRose.position.set(0.082, 0.025, 0.015)
    headGroup.add(leftRose)

    const rightRose = createRose()
    rightRose.position.set(-0.082, 0.025, 0.015)
    headGroup.add(rightRose)

    // 2. Dangling Golden Needle / Stiletto Earrings`;

// Check if old assembly is in CRLF or LF
const normalizedOld = oldYorHeadAssembly.replace(/\r\n/g, '\n');
const normalizedAdaRed = adaRed.replace(/\r\n/g, '\n');
if (normalizedAdaRed.includes(normalizedOld)) {
  const updated = normalizedAdaRed.replace(normalizedOld, newYorHeadAssembly.replace(/\r\n/g, '\n'));
  fs.writeFileSync(adaRedPath, updated, 'utf8');
  console.log('Updated ada-red.ts');
} else {
  console.log('Pattern for oldYorHeadAssembly not matched directly, checking substrings');
}
