import fs from 'fs';
import path from 'path';

const modelsDir = path.resolve('apps/web/public/models');

function parseGLTFHeader(filePath) {
  const buf = fs.readFileSync(filePath);
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546C67) { // 'glTF'
    return { isBinary: false, size: buf.length };
  }
  const version = buf.readUInt32LE(4);
  const length = buf.readUInt32LE(8);
  const chunk0Length = buf.readUInt32LE(12);
  const chunk0Type = buf.readUInt32LE(16);
  
  if (chunk0Type === 0x4E4F534A) { // 'JSON'
    const jsonStr = buf.toString('utf8', 20, 20 + chunk0Length);
    try {
      const gltf = JSON.parse(jsonStr);
      return {
        isBinary: true,
        version,
        totalLength: length,
        meshes: gltf.meshes?.length || 0,
        nodes: gltf.nodes?.length || 0,
        skins: gltf.skins?.length || 0,
        animations: gltf.animations?.length || 0,
        materials: gltf.materials?.map(m => m.name) || [],
        textures: gltf.textures?.length || 0,
        images: gltf.images?.length || 0,
        hasVRM: !!gltf.extensions?.VRM || !!gltf.extensions?.VRMC_vrm,
      };
    } catch(e) {
      return { error: e.message };
    }
  }
  return { unknownChunk: chunk0Type };
}

const files = fs.readdirSync(modelsDir);
for (const f of files) {
  const fp = path.join(modelsDir, f);
  if (fs.statSync(fp).isFile()) {
    console.log(`=== ${f} (${(fs.statSync(fp).size / 1024 / 1024).toFixed(2)} MB) ===`);
    console.log(parseGLTFHeader(fp));
  }
}
