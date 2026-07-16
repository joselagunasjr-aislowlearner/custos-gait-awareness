import { writeFileSync } from "node:fs";

const sampleRate = 16_000;
const durationSec = 4;
const sampleCount = sampleRate * durationSec;
const samples = new Float32Array(sampleCount);
const footfallsSec = [0.35, 0.88, 1.42, 1.95, 2.49, 3.02, 3.56];

for (const time of footfallsSec) {
  const center = Math.round(time * sampleRate);
  const length = Math.round(sampleRate * 0.13);
  for (let offset = 0; offset < length && center + offset < samples.length; offset += 1) {
    const envelope = Math.exp(-offset / (sampleRate * 0.025));
    const lowThump = Math.sin((2 * Math.PI * 78 * offset) / sampleRate);
    const texture = Math.sin((2 * Math.PI * 310 * offset) / sampleRate) * 0.18;
    samples[center + offset] += (lowThump + texture) * envelope * 0.72;
  }
}

const dataSize = samples.length * 2;
const buffer = Buffer.alloc(44 + dataSize);
buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(dataSize, 40);
samples.forEach((sample, index) => {
  const clamped = Math.max(-1, Math.min(1, sample));
  buffer.writeInt16LE(Math.round(clamped * 32767), 44 + index * 2);
});

writeFileSync(new URL("../public/sample-footsteps.wav", import.meta.url), buffer);
