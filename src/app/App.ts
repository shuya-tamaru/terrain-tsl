import { CameraManager } from "./core/CameraManager";
import { ControlsManager } from "./core/ControlManager";
import { RendererManager } from "./core/RendererManager";
import { SceneManager } from "./core/SceneManager";
import { GfxConfig } from "./gfx/gfxConfig";
import { Terrain } from "./gfx/terrain";
import * as THREE from "three/webgpu";
import { WaterSurface } from "./gfx/waterSurface";
import { ParamsControls } from "./utils/ParamsControls";

export class App {
  private sceneManager!: SceneManager;
  private cameraManager!: CameraManager;
  private rendererManager!: RendererManager;
  private controlsManager!: ControlsManager;

  private gfxConfig!: GfxConfig;
  private terrain!: Terrain;
  private waterSurface!: WaterSurface;

  private environmentMap: THREE.Texture;
  private animationId?: number;

  private width: number;
  private height: number;
  private aspect: number;

  constructor(environmentMap: THREE.Texture) {
    this.environmentMap = environmentMap;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.aspect = this.width / this.height;

    this.initApp();
  }

  private initApp() {
    this.initializeInstances();
    this.addObjectsToScene();
    this.setupEventListeners();
    this.startAnimation();
  }

  private initializeInstances() {
    this.sceneManager = new SceneManager(this.environmentMap);
    this.cameraManager = new CameraManager(this.aspect);
    this.rendererManager = new RendererManager(this.width, this.height);
    this.controlsManager = new ControlsManager(
      this.cameraManager.camera,
      this.rendererManager.renderer.domElement
    );
    this.gfxConfig = new GfxConfig();
    this.terrain = new Terrain(this.sceneManager.scene, this.gfxConfig);
    this.waterSurface = new WaterSurface(
      this.sceneManager.scene,
      this.gfxConfig
    );
    new ParamsControls(this.gfxConfig);
  }

  private addObjectsToScene(): void {
    this.terrain.addToScene();
    this.waterSurface.addToScene();
  }

  private handleResize = (): void => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.aspect = this.width / this.height;
    this.cameraManager.updateAspect(this.aspect);
    this.rendererManager.resize(this.width, this.height);
  };

  private setupEventListeners(): void {
    window.addEventListener("resize", this.handleResize);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controlsManager.update();
    this.rendererManager.render(
      this.sceneManager.scene,
      this.cameraManager.camera
    );
  };

  private startAnimation(): void {
    this.animate();
  }

  public cleanup(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener("resize", this.handleResize);
  }
}
