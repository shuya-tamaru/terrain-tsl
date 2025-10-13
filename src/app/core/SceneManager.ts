import * as THREE from "three/webgpu";

export class SceneManager {
  public scene: THREE.Scene;

  constructor(environmentMap: THREE.Texture) {
    this.scene = new THREE.Scene();
    this.scene.background = environmentMap;
    this.scene.environment = environmentMap;
    this.scene.backgroundBlurriness = 0.5;
  }

  public add(object: THREE.Object3D) {
    this.scene.add(object);
  }

  public remove(object: THREE.Object3D) {
    this.scene.remove(object);
  }
}
