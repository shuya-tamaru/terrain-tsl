import * as THREE from "three/webgpu";
import { GfxConfig } from "./gfxConfig";
import {
  cross,
  dot,
  float,
  Fn,
  Loop,
  mx_noise_float,
  positionLocal,
  smoothstep,
  transformNormalToView,
  uint,
  varying,
  vec3,
} from "three/tsl";
import { octaveNoise } from "./utils/octaveNoise";

export class Mountain {
  private scene: THREE.Scene;
  private gfxConfig: GfxConfig;
  private geometry!: THREE.PlaneGeometry;
  private material!: THREE.MeshStandardNodeMaterial;
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
    this.geometry.rotateX(-Math.PI / 2);
  }

  private createMaterial() {
    this.material = new THREE.MeshStandardNodeMaterial({
      color: "#85d534",
    });
  }

  private createMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }

  public addToScene() {
    this.scene.add(this.mesh);
  }

  private updateMaterialNode() {
    const {
      initialFrequency,
      initialAmplitude,
      octaves,
      heightRange,
      waterThreshold,
      grassThreshold,
      rockThreshold,
      slopeThreshold,
      colorWater,
      colorGround,
      colorRock,
      colorSnow,
    } = this.gfxConfig;

    const vPosition = varying(vec3());
    const vNormal = varying(vec3());

    this.material.positionNode = Fn(() => {
      const normalLookUpShift = float(0.01);
      const position = positionLocal.xyz.toVar();
      const neighborA = positionLocal.xyz
        .add(vec3(normalLookUpShift, 0.0, 0.0))
        .toVar();
      const neighborB = positionLocal.xyz
        .add(vec3(0.0, 0.0, normalLookUpShift.negate()))
        .toVar();

      const height = float(0).toVar();
      const heightA = float(0).toVar();
      const heightB = float(0).toVar();
      const frequency = initialFrequency.toVar();
      const amplitude = initialAmplitude.toVar();

      const i = uint(1).toVar();
      Loop(i.lessThan(octaves), () => {
        //@ts-ignore
        const noise = octaveNoise(positionLocal, frequency, amplitude);
        //@ts-ignore
        const noiseA = octaveNoise(neighborA, frequency, amplitude);
        //@ts-ignore
        const noiseB = octaveNoise(neighborB, frequency, amplitude);
        height.addAssign(noise);
        heightA.addAssign(noiseA);
        heightB.addAssign(noiseB);
        frequency.mulAssign(0.5);
        amplitude.mulAssign(2.0);
        i.addAssign(1);
      });

      position.y.addAssign(height);
      neighborA.y.addAssign(heightA);
      neighborB.y.addAssign(heightB);

      const toA = neighborA.sub(position).normalize();
      const toB = neighborB.sub(position).normalize();

      vNormal.assign(cross(toA, toB));
      vPosition.assign(position);

      return position;
    })();

    this.material.normalNode = transformNormalToView(vNormal);

    this.material.colorNode = Fn(() => {
      const finalColor = colorWater.toVar();

      const slope = dot(vNormal, vec3(0, 1, 0));
      const heightNormalized = vPosition.y
        .add(heightRange)
        .div(heightRange.mul(2.0));

      const noise = mx_noise_float(vPosition.xz.mul(10), 1, 0).mul(0.1);

      const waterZone = smoothstep(0.0, waterThreshold, heightNormalized);
      const grassZone = smoothstep(
        waterThreshold,
        grassThreshold,
        heightNormalized.add(noise)
      );
      const rockZone = smoothstep(
        grassThreshold,
        rockThreshold,
        heightNormalized
      );
      const snowZone = smoothstep(
        rockThreshold,
        1.0,
        heightNormalized.sub(slope.mul(slopeThreshold))
      );

      finalColor.assign(waterZone.mix(finalColor, colorWater));
      finalColor.assign(grassZone.mix(finalColor, colorGround));
      finalColor.assign(rockZone.mix(finalColor, colorRock));
      finalColor.assign(snowZone.mix(finalColor, colorSnow));

      return finalColor;
    })();
  }
}
