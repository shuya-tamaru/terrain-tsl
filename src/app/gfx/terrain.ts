import * as THREE from "three/webgpu";
import { GfxConfig } from "./gfxConfig";
import {
  cross,
  dot,
  float,
  Fn,
  Loop,
  mx_noise_float,
  mx_noise_vec3,
  positionLocal,
  smoothstep,
  transformNormalToView,
  uint,
  varying,
  vec3,
} from "three/tsl";
import { octaveNoiseVec3 } from "./utils/octaveNoise";

export class Terrain {
  private scene: THREE.Scene;
  private gfxConfig: GfxConfig;
  private subdivisions: number;
  private geometry!: THREE.PlaneGeometry;
  private material!: THREE.MeshStandardNodeMaterial;
  private mesh!: THREE.Mesh;

  constructor(scene: THREE.Scene, gfxConfig: GfxConfig) {
    this.scene = scene;
    this.gfxConfig = gfxConfig;
    this.subdivisions = this.gfxConfig.subdivisions;
    this.createGeometry();
    this.createMaterial();
    this.createMesh();
    this.updateMaterialNode();
  }

  private createGeometry() {
    this.geometry = new THREE.PlaneGeometry(
      100,
      100,
      this.subdivisions,
      this.subdivisions
    );
    this.geometry.rotateX(-Math.PI / 2);
  }

  private createMaterial() {
    this.material = new THREE.MeshStandardNodeMaterial();
  }

  private createMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }

  public addToScene() {
    this.scene.add(this.mesh);
  }

  public updateSubdivisions(subdivisions: number) {
    this.subdivisions = subdivisions;
    this.geometry.dispose();
    this.mesh.geometry.dispose();
    this.geometry = new THREE.PlaneGeometry(
      100,
      100,
      this.subdivisions,
      this.subdivisions
    );
    this.geometry.rotateX(-Math.PI / 2);
    this.mesh.geometry = this.geometry;
  }

  private updateMaterialNode() {
    const {
      initialFrequency,
      initialAmplitude,
      octaves,
      heightRange,
      waterThreshold,
      sandThreshold,
      forestThreshold,
      grassThreshold,
      rockThreshold,
      slopeThreshold,
      colorWater,
      colorForest,
      colorGround,
      colorRock,
      colorSnow,
      colorSand,
      warpStrength,
      warpFrequency,
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

      const density = vec3(0.0).toVar();
      const densityA = vec3(0.0).toVar();
      const densityB = vec3(0.0).toVar();
      const frequency = initialFrequency.toVar();
      const amplitude = initialAmplitude.toVar();

      // warp前の座標をコピー
      const ws = positionLocal.xyz.toVar();
      const wsA = neighborA.toVar();
      const wsB = neighborB.toVar();

      // warp (domain warping)
      const warp = mx_noise_vec3(ws.mul(warpFrequency)).mul(warpStrength);
      const warpA = mx_noise_vec3(wsA.mul(warpFrequency)).mul(warpStrength);
      const warpB = mx_noise_vec3(wsB.mul(warpFrequency)).mul(warpStrength);
      ws.addAssign(warp);
      wsA.addAssign(warpA);
      wsB.addAssign(warpB);

      // fBmループ
      const i = uint(1).toVar();
      Loop(i.lessThan(octaves), () => {
        //@ts-ignore
        const noise = octaveNoiseVec3(ws, frequency, amplitude);
        //@ts-ignore
        const noiseA = octaveNoiseVec3(wsA, frequency, amplitude);
        //@ts-ignore
        const noiseB = octaveNoiseVec3(wsB, frequency, amplitude);

        density.addAssign(noise);
        densityA.addAssign(noiseA);
        densityB.addAssign(noiseB);

        frequency.mulAssign(0.5);
        amplitude.mulAssign(2.0);
        i.addAssign(1);
      });
      // apply height
      position.y.addAssign(density.y);
      neighborA.y.addAssign(densityA.y);
      neighborB.y.addAssign(densityB.y);

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

      const noise = mx_noise_float(vPosition.xz.mul(10), 1, 0).mul(0.03);

      const waterZone = smoothstep(0.0, waterThreshold, heightNormalized);
      const sandZone = smoothstep(
        waterThreshold,
        sandThreshold,
        heightNormalized
      );
      const forestZone = smoothstep(
        sandThreshold,
        forestThreshold,
        heightNormalized
      );
      const grassZone = smoothstep(
        forestThreshold,
        grassThreshold,
        heightNormalized
      );
      const rockZone = smoothstep(
        grassThreshold,
        rockThreshold,
        heightNormalized.add(noise)
      );
      const snowZone = smoothstep(
        rockThreshold,
        1.0,
        heightNormalized.add(noise).sub(slope.mul(slopeThreshold))
      );

      finalColor.assign(waterZone.mix(finalColor, colorWater));
      finalColor.assign(sandZone.mix(finalColor, colorSand));
      finalColor.assign(forestZone.mix(finalColor, colorForest));
      finalColor.assign(grassZone.mix(finalColor, colorGround));
      finalColor.assign(rockZone.mix(finalColor, colorRock));
      finalColor.assign(snowZone.mix(finalColor, colorSnow));

      return finalColor;
    })();
  }
}
