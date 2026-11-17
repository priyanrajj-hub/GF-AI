import fs from 'fs';

const buf = fs.readFileSync('apps/web/public/models/ada.vrm');
const len = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + len));

console.log('=== All Mesh Names in ada.vrm ===');
gltf.meshes.forEach((m, i) => console.log(`[Mesh ${i}] ${m.name}`));

console.log('\n=== All Nodes with hair, cloth, skirt, face in name ===');
gltf.nodes.forEach((n, i) => {
  if (/hair|cloth|skirt|face|eye|ribbon|mituami|other/i.test(n.name)) {
    console.log(`[Node ${i}] ${n.name} (mesh: ${n.mesh !== undefined ? gltf.meshes[n.mesh]?.name : 'bone/group'})`);
  }
});
