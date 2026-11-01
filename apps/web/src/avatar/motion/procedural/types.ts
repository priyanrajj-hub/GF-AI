import * as THREE from 'three'
import type { VRMHumanoid } from '@pixiv/three-vrm'

export interface KinematicContext {
  time: number
  delta: number
  humanoid: VRMHumanoid
  initialHipsY: number
  cuteRatio: number // 0 to 1
  liveRatio: number // 0 to 1
  bpm?: number
}

export interface BoneNodes {
  hips: THREE.Object3D | null
  spine: THREE.Object3D | null
  chest: THREE.Object3D | null
  neck: THREE.Object3D | null
  head: THREE.Object3D | null
  leftUpperArm: THREE.Object3D | null
  rightUpperArm: THREE.Object3D | null
  leftLowerArm: THREE.Object3D | null
  rightLowerArm: THREE.Object3D | null
  leftHand: THREE.Object3D | null
  rightHand: THREE.Object3D | null
  leftUpperLeg: THREE.Object3D | null
  rightUpperLeg: THREE.Object3D | null
  leftLowerLeg: THREE.Object3D | null
  rightLowerLeg: THREE.Object3D | null
  leftFoot: THREE.Object3D | null
  rightFoot: THREE.Object3D | null
}

export function getBoneNodes(humanoid: VRMHumanoid): BoneNodes {
  return {
    hips: humanoid.getNormalizedBoneNode('hips'),
    spine: humanoid.getNormalizedBoneNode('spine'),
    chest: humanoid.getNormalizedBoneNode('chest'),
    neck: humanoid.getNormalizedBoneNode('neck'),
    head: humanoid.getNormalizedBoneNode('head'),
    leftUpperArm: humanoid.getNormalizedBoneNode('leftUpperArm'),
    rightUpperArm: humanoid.getNormalizedBoneNode('rightUpperArm'),
    leftLowerArm: humanoid.getNormalizedBoneNode('leftLowerArm'),
    rightLowerArm: humanoid.getNormalizedBoneNode('rightLowerArm'),
    leftHand: humanoid.getNormalizedBoneNode('leftHand'),
    rightHand: humanoid.getNormalizedBoneNode('rightHand'),
    leftUpperLeg: humanoid.getNormalizedBoneNode('leftUpperLeg'),
    rightUpperLeg: humanoid.getNormalizedBoneNode('rightUpperLeg'),
    leftLowerLeg: humanoid.getNormalizedBoneNode('leftLowerLeg'),
    rightLowerLeg: humanoid.getNormalizedBoneNode('rightLowerLeg'),
    leftFoot: humanoid.getNormalizedBoneNode('leftFoot'),
    rightFoot: humanoid.getNormalizedBoneNode('rightFoot'),
  }
}
