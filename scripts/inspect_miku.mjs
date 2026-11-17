import fs from 'fs';

const buf = fs.readFileSync('apps/web/public/models/miku.vrm');
const jsonLen = buf.readUInt32LE(12);
const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
const gltf = JSON.parse(jsonStr);

console.log('--- MATERIALS ---');
gltf.materials?.forEach((m, i) => {
  console.log(`${i}: ${m.name} | alphaMode: ${m.alphaMode} | doubleSided: ${m.doubleSided}`);
});

console.log('\n--- MESHES & PRIMITIVES ---');
gltf.meshes?.forEach((mesh, mi) => {
  console.log(`Mesh ${mi}: ${mesh.name}`);
  mesh.primitives?.forEach((p, pi) => {
    console.log(`  prim ${pi}: mat ${p.material} (${gltf.materials?.[p.material]?.name}) | targets: ${p.targets?.length || 0}`);
  });
});

console.log('\n--- VRM EXTENSION ---');
const vrmExt = gltf.extensions?.VRM;
if (vrmExt) {
  console.log('blendShapeMaster:', vrmExt.blendShapeMaster?.blendShapeGroups?.map(g => ({ name: g.name, presetName: g.presetName })));
  console.log('materialProperties:', vrmExt.materialProperties?.map(m => ({ name: m.name, renderQueue: m.renderQueue, shader: m.shader })));
}
