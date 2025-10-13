import {
  Discard,
  Fn,
  Loop,
  mx_noise_vec3,
  positionLocal,
  uint,
  varying,
  vec3,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { GfxConfig } from "./gfxConfig";
import { octaveNoiseVec3 } from "./utils/octaveNoise";

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
      // color: this.gfxConfig.waterSurfaceColor.value,
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
      warpStrength,
      warpFrequency,
    } = this.gfxConfig;
    this.material.positionNode = Fn(() => {
      const waterPos = positionLocal.xyz.toVar();
      const density = vec3(0.0).toVar();
      const frequency = initialFrequency.toVar();
      const amplitude = initialAmplitude.toVar();

      const ws = waterPos.toVar();
      const warp = mx_noise_vec3(ws.mul(warpFrequency)).mul(warpStrength);
      ws.addAssign(warp);

      const i = uint(1).toVar();
      Loop(i.lessThan(octaves), () => {
        //@ts-ignore
        const noise = octaveNoiseVec3(ws, frequency, amplitude);
        density.addAssign(noise);
        frequency.mulAssign(0.5);
        amplitude.mulAssign(2.0);
        i.addAssign(1);
      });
      waterPos.addAssign(density);
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
      return this.gfxConfig.waterSurfaceColor;
    })();
  }
}
