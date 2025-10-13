import { Fn, mx_noise_float, mx_noise_vec3 } from "three/tsl";

//@ts-ignore
export const octaveNoise = Fn(([p, freq, amp]) => {
  return mx_noise_float(p.mul(freq)).mul(amp);
});

//@ts-ignore
export const octaveNoiseVec3 = Fn(([p, freq, amp]) => {
  return mx_noise_vec3(p.mul(freq)).mul(amp);
});
