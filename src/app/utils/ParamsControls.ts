import { GfxConfig } from "../gfx/gfxConfig";
import { GUI } from "lil-gui";

export class ParamsControls {
  private gui!: GUI;
  private gfxConfig!: GfxConfig;

  constructor(gfxConfig: GfxConfig) {
    this.gfxConfig = gfxConfig;
    this.initGUI();
  }

  private initGUI() {
    this.gui = new GUI();
    this.gui
      .add(this.gfxConfig.initialFrequency, "value", 0, 10)
      .name("initialFrequency");
    this.gui
      .add(this.gfxConfig.initialAmplitude, "value", 0, 1)
      .name("initialAmplitude");
    this.gui.add(this.gfxConfig.octaves, "value", 1, 15, 1).name("octaves");
    this.gui
      .add(this.gfxConfig.slopeThreshold, "value", 0, 1)
      .name("slopeThreshold");
    this.gui
      .add(this.gfxConfig.waterThreshold, "value", 0, 1, 0.01)
      .name("waterThreshold");
    this.gui
      .add(this.gfxConfig.grassThreshold, "value", 0, 1, 0.01)
      .name("grassThreshold");
    this.gui
      .add(this.gfxConfig.rockThreshold, "value", 0, 1, 0.01)
      .name("rockThreshold");
    this.gui
      .add(this.gfxConfig.heightRange, "value", 0, 32, 0.01)
      .name("heightRange");
    this.gui.addColor(this.gfxConfig.colorGround, "value").name("colorGround");
    this.gui.addColor(this.gfxConfig.colorSnow, "value").name("colorSnow");
    this.gui.addColor(this.gfxConfig.colorRock, "value").name("colorRock");
    this.gui.addColor(this.gfxConfig.colorWater, "value").name("colorWater");
  }
}
