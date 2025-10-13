import { Fn, mx_noise_float } from "three/tsl";

//@ts-ignore
export const octaveNoise = Fn(([p, freq, amp]) => {
  return mx_noise_float(p.mul(freq)).mul(amp);
});
