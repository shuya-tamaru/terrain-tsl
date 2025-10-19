import {
  Discard,
  float,
  Fn,
  Loop,
  mix,
  mx_noise_vec3,
  mx_worley_noise_vec3,
  positionLocal,
  smoothstep,
  time,
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
      color: 0x001144,
      transmission: 0.6,
      roughness: 0.0,
      ior: 1.333,
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
      const basePos = positionLocal
        .add(vec3(time.mul(2), 0.0, time.mul(0.3)))
        .toVar();

      const warpFreq = float(0.03);
      const warpStrength = float(3.0);
      const warp = mx_noise_vec3(basePos.mul(warpFreq).add(time.mul(0.3))).mul(
        warpStrength
      );
      const ws = basePos.add(warp);
      const frequencyUV = float(0.02);

      const voronoi = mx_worley_noise_vec3(ws.mul(frequencyUV));
      const voronoi2 = mx_worley_noise_vec3(ws.mul(frequencyUV).mul(4.0));
      const voronoi3 = mx_worley_noise_vec3(ws.mul(frequencyUV).mul(10.0));
      const edge = smoothstep(
        0,
        0.99,
        voronoi.x.add(voronoi2.x).add(voronoi3.x).div(3.0)
      );
      const baseColor = mix(vec3(0.0, 0.2, 0.9), vec3(1.0), edge);

      const heightNormalized = vWaterPosition.y
        .add(heightRange)
        .div(heightRange.mul(2.0));

      const isWater = heightNormalized.lessThan(waterThreshold);
      Discard(isWater.not());
      return baseColor;
    })();
  }
}
