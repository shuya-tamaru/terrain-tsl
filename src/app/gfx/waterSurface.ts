import {
  Discard,
  float,
  Fn,
  Loop,
  positionLocal,
  uint,
  varying,
  vec3,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { GfxConfig } from "./gfxConfig";
import { octaveNoise } from "./utils/octaveNoise";

export class WaterSurface {
  private scene: THREE.Scene;
  private gfxConfig: GfxConfig;
  private geometry!: THREE.PlaneGeometry;
  private material!: THREE.MeshPhysicalNodeMaterial;
  private mesh!: THREE.Mesh;

  constructor(scene: THREE.Scene, gfxConfig: GfxConfig) {
    this.scene = scene;
    this.gfxConfig = gfxConfig;
    this.createGeometry();
    this.createMaterial();
    this.createMesh();
    this.updateMaterialNode();
  }

  private createGeometry() {
    this.geometry = new THREE.PlaneGeometry(100, 100, 500, 500);
    this.geometry.rotateX(-Math.PI * 0.5);
  }

  private createMaterial() {
    this.material = new THREE.MeshPhysicalNodeMaterial({
      transmission: 1,
      roughness: 0.0,
      ior: 1.333,
      color: "#4db2ff",
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
  }

  private createMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }

  public addToScene() {
    this.scene.add(this.mesh);
  }

  private updateMaterialNode() {
    const vWaterPosition = varying(vec3());
    const {
      initialFrequency,
      initialAmplitude,
      octaves,
      heightRange,
      waterThreshold,
    } = this.gfxConfig;
    this.material.positionNode = Fn(() => {
      const waterPos = positionLocal.xyz.toVar();
      const height = float(0).toVar();
      const frequency = initialFrequency.toVar();
      const amplitude = initialAmplitude.toVar();

      const i = uint(1).toVar();
      Loop(i.lessThan(octaves), () => {
        //@ts-ignore
        const noise = octaveNoise(positionLocal, frequency, amplitude);
        height.addAssign(noise);
        frequency.mulAssign(0.5);
        amplitude.mulAssign(2.0);
        i.addAssign(1);
      });
      waterPos.y.addAssign(height);
      vWaterPosition.assign(waterPos);

      const position = positionLocal.xyz.toVar();

      const waterHeight = waterThreshold
        .mul(heightRange.mul(2.0))
        .sub(heightRange);
      position.y.addAssign(waterHeight);
      return position;
    })();

    this.material.colorNode = Fn(() => {
      const heightNormalized = vWaterPosition.y
        .add(heightRange)
        .div(heightRange.mul(2.0));

      const isWater = heightNormalized.lessThan(waterThreshold);
      Discard(isWater.not());
      return vec3(0.0, 0.3, 1.0);
    })();
  }
}
