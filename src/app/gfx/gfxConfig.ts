import { color, uniform } from "three/tsl";

export class GfxConfig {
  //geometry
  public subdivisions = 800;
  //terrain deformation
  public initialFrequency = uniform(4.03);
  public initialAmplitude = uniform(0.25);
  public octaves = uniform(9);
  public warpStrength = uniform(8.0);
  public warpFrequency = uniform(0.09);

  //threshold
  public rockThreshold = uniform(0.8);
  public forestThreshold = uniform(0.2);
  public grassThreshold = uniform(0.4);
  public sandThreshold = uniform(0.08);
  public waterThreshold = uniform(0.05);

  public heightRange = uniform(16.0);
  public slopeThreshold = uniform(0.2);
  //colors
  public colorSnow = uniform(color("#cccccc"));
  public colorRock = uniform(color("#949089"));
  public colorGround = uniform(color("#85d534"));
  public colorForest = uniform(color("#1a522e"));
  public colorSand = uniform(color("#deb887"));
  public colorWater = uniform(color("#34a5d5"));
  public waterSurfaceColor = uniform(color("#a3c0d7"));
}
