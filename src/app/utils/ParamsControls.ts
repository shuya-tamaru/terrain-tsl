import { GfxConfig } from "../gfx/gfxConfig";
import { GUI, Controller } from "lil-gui";
import * as THREE from "three/webgpu";
import type { Terrain } from "../gfx/terrain";

interface ColorPreset {
  colorSnow: string;
  colorRock: string;
  colorGround: string;
  colorForest: string;
  colorSand: string;
  colorWater: string;
  waterSurfaceColor: string;
}

export class ParamsControls {
  private gui!: GUI;
  private gfxConfig!: GfxConfig;
  private terrain!: Terrain;
  private presets = {
    mountain: true,
    snowMountain: false,
  };
  private mountainController!: Controller;
  private snowMountainController!: Controller;

  // Color controllers
  private colorControllers = {
    snow: null as Controller | null,
    rock: null as Controller | null,
    ground: null as Controller | null,
    forest: null as Controller | null,
    sand: null as Controller | null,
    water: null as Controller | null,
    waterSurface: null as Controller | null,
  };

  private colorPresets: Record<string, ColorPreset> = {
    mountain: {
      colorSnow: "#cccccc",
      colorRock: "#949089",
      colorGround: "#85d534",
      colorForest: "#1a522e",
      colorSand: "#deb887",
      colorWater: "#34a5d5",
      waterSurfaceColor: "#4db2ff",
    },
    snowMountain: {
      colorSnow: "#ffffff",
      colorRock: "#b0c4de",
      colorGround: "#e8f4f8",
      colorForest: "#4a7c7e",
      colorSand: "#f0f8ff",
      colorWater: "#1e90ff",
      waterSurfaceColor: "#87ceeb",
    },
  };

  constructor(gfxConfig: GfxConfig, terrain: Terrain) {
    this.gfxConfig = gfxConfig;
    this.terrain = terrain;
    this.initGUI();
  }

  private applyPreset(presetName: keyof typeof this.colorPresets) {
    const preset = this.colorPresets[presetName];
    this.gfxConfig.colorSnow.value.set(preset.colorSnow);
    this.gfxConfig.colorRock.value.set(preset.colorRock);
    this.gfxConfig.colorGround.value.set(preset.colorGround);
    this.gfxConfig.colorForest.value.set(preset.colorForest);
    this.gfxConfig.colorSand.value.set(preset.colorSand);
    this.gfxConfig.colorWater.value.set(preset.colorWater);
    this.gfxConfig.waterSurfaceColor.value.set(preset.waterSurfaceColor);

    // Update color controller displays
    if (this.colorControllers.snow) {
      this.colorControllers.snow.setValue(preset.colorSnow);
      this.colorControllers.snow.updateDisplay();
    }
    if (this.colorControllers.rock) {
      this.colorControllers.rock.setValue(preset.colorRock);
      this.colorControllers.rock.updateDisplay();
    }
    if (this.colorControllers.ground) {
      this.colorControllers.ground.setValue(preset.colorGround);
      this.colorControllers.ground.updateDisplay();
    }
    if (this.colorControllers.forest) {
      this.colorControllers.forest.setValue(preset.colorForest);
      this.colorControllers.forest.updateDisplay();
    }
    if (this.colorControllers.sand) {
      this.colorControllers.sand.setValue(preset.colorSand);
      this.colorControllers.sand.updateDisplay();
    }
    if (this.colorControllers.water) {
      this.colorControllers.water.setValue(preset.colorWater);
      this.colorControllers.water.updateDisplay();
    }
    if (this.colorControllers.waterSurface) {
      this.colorControllers.waterSurface.setValue(preset.waterSurfaceColor);
      this.colorControllers.waterSurface.updateDisplay();
    }
  }

  private initGUI() {
    this.gui = new GUI();
    const sceneFolder = this.gui.addFolder("Scene");
    const geometryFolder = this.gui.addFolder("Geometry");
    const terrainDeformationFolder = this.gui.addFolder("Terrain Deformation");
    const colorFolder = this.gui.addFolder("Color");
    const thresholdFolder = this.gui.addFolder("Threshold");

    //scene - presets
    this.mountainController = sceneFolder
      .add(this.presets, "mountain")
      .name("Mountain")
      .onChange((value: boolean) => {
        if (value) {
          this.presets.snowMountain = false;
          this.snowMountainController?.updateDisplay();
          this.applyPreset("mountain");
        }
      });
    this.snowMountainController = sceneFolder
      .add(this.presets, "snowMountain")
      .name("Snow Mountain")
      .onChange((value: boolean) => {
        if (value) {
          this.presets.mountain = false;
          this.mountainController?.updateDisplay();
          this.applyPreset("snowMountain");
        }
      });

    //terrain deformation
    terrainDeformationFolder
      .add(this.gfxConfig.initialFrequency, "value", 0, 10)
      .name("initialFrequency");
    terrainDeformationFolder
      .add(this.gfxConfig.initialAmplitude, "value", 0, 1)
      .name("initialAmplitude");
    terrainDeformationFolder
      .add(this.gfxConfig.octaves, "value", 1, 15, 1)
      .name("octaves");
    terrainDeformationFolder
      .add(this.gfxConfig.warpStrength, "value", 0, 16, 0.01)
      .name("warpStrength");
    terrainDeformationFolder
      .add(this.gfxConfig.warpFrequency, "value", 0, 1, 0.001)
      .name("warpFrequency");

    //threshold
    thresholdFolder
      .add(this.gfxConfig.rockThreshold, "value", 0, 1, 0.01)
      .name("Rock");
    thresholdFolder
      .add(this.gfxConfig.grassThreshold, "value", 0, 1, 0.01)
      .name("Grass");
    thresholdFolder
      .add(this.gfxConfig.forestThreshold, "value", 0, 1, 0.01)
      .name("Forest");
    thresholdFolder
      .add(this.gfxConfig.sandThreshold, "value", 0, 1, 0.01)
      .name("Sand");
    thresholdFolder
      .add(this.gfxConfig.waterThreshold, "value", 0, 1, 0.01)
      .name("Water");
    thresholdFolder
      .add(this.gfxConfig.heightRange, "value", 0, 32, 0.01)
      .name("heightRange");
    thresholdFolder
      .add(this.gfxConfig.slopeThreshold, "value", 0, 1)
      .name("slopeThreshold");

    //color
    this.colorControllers.snow = colorFolder
      .addColor(
        {
          color: this.gfxConfig.colorSnow.value.getHexString(
            THREE.SRGBColorSpace
          ),
        },
        "color"
      )
      .name("colorSnow")
      .onChange((value: THREE.Color) =>
        this.gfxConfig.colorSnow.value.set(value)
      );
    this.colorControllers.rock = colorFolder
      .addColor(
        {
          color: this.gfxConfig.colorRock.value.getHexString(
            THREE.SRGBColorSpace
          ),
        },
        "color"
      )
      .name("Rock")
      .onChange((value: THREE.Color) =>
        this.gfxConfig.colorRock.value.set(value)
      );
    this.colorControllers.ground = colorFolder
      .addColor(
        {
          color: this.gfxConfig.colorGround.value.getHexString(
            THREE.SRGBColorSpace
          ),
        },
        "color"
      )
      .name("Ground")
      .onChange((value: THREE.Color) =>
        this.gfxConfig.colorGround.value.set(value)
      );
    this.colorControllers.forest = colorFolder
      .addColor(
        {
          color: this.gfxConfig.colorForest.value.getHexString(
            THREE.SRGBColorSpace
          ),
        },
        "color"
      )
      .name("Forest")
      .onChange((value: THREE.Color) =>
        this.gfxConfig.colorForest.value.set(value)
      );
    this.colorControllers.sand = colorFolder
      .addColor(
        {
          color: this.gfxConfig.colorSand.value.getHexString(
            THREE.SRGBColorSpace
          ),
        },
        "color"
      )
      .name("Sand")
      .onChange((value: THREE.Color) =>
        this.gfxConfig.colorSand.value.set(value)
      );
    this.colorControllers.water = colorFolder
      .addColor(
        {
          color: this.gfxConfig.colorWater.value.getHexString(
            THREE.SRGBColorSpace
          ),
        },
        "color"
      )
      .name("Water")
      .onChange((value: THREE.Color) =>
        this.gfxConfig.colorWater.value.set(value)
      );
    this.colorControllers.waterSurface = colorFolder
      .addColor(
        {
          color: this.gfxConfig.waterSurfaceColor.value.getHexString(
            THREE.SRGBColorSpace
          ),
        },
        "color"
      )
      .name("Water Surface")
      .onChange((value: THREE.Color) =>
        this.gfxConfig.waterSurfaceColor.value.set(value)
      );
    geometryFolder
      .add(this.gfxConfig, "subdivisions", 100, 1000, 100)
      .name("Subdivisions")
      .onChange((value: number) => {
        this.gfxConfig.subdivisions = value;
        this.terrain.updateSubdivisions(value);
      });
  }
}
