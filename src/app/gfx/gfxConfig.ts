import { color, uniform } from "three/tsl";

export class GfxConfig {
  public initialFrequency = uniform(4.03);
  public initialAmplitude = uniform(0.25);
  public octaves = uniform(9);
  public heightRange = uniform(16.0);
  public slopeThreshold = uniform(0.2);
  public waterThreshold = uniform(0.1);
  public grassThreshold = uniform(0.4);
  public rockThreshold = uniform(0.8);
  public colorGround = uniform(color("#85d534"));
  public colorSnow = uniform(color("#ccc"));
  public colorRock = uniform(color("#bfbd8d"));
  public colorWater = uniform(color("#34a5d5"));
}
