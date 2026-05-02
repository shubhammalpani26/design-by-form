import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

/**
 * Convert an uploaded 3D model file (.obj, .stl, .fbx) into a GLB Blob so
 * <model-viewer> (which only supports glTF/GLB) can render it.
 * Returns the file unchanged if it is already .glb / .gltf.
 */
export async function convertToGlb(file: File): Promise<File> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (ext === "glb" || ext === "gltf") return file;

  const buffer = await file.arrayBuffer();
  let object: THREE.Object3D;

  if (ext === "obj") {
    const text = new TextDecoder().decode(buffer);
    object = new OBJLoader().parse(text);
  } else if (ext === "stl") {
    const geometry = new STLLoader().parse(buffer);
    const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    object = new THREE.Mesh(geometry, material);
  } else if (ext === "fbx") {
    object = new FBXLoader().parse(buffer, "");
  } else {
    throw new Error(`Unsupported model format: .${ext}`);
  }

  const exporter = new GLTFExporter();
  const glb: ArrayBuffer = await new Promise((resolve, reject) => {
    exporter.parse(
      object,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(result);
        else reject(new Error("GLB export did not return binary data"));
      },
      (err) => reject(err),
      { binary: true }
    );
  });

  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([glb], `${baseName}.glb`, { type: "model/gltf-binary" });
}