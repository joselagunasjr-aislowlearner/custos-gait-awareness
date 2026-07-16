import type { FootstepEvidence } from "../types";

export interface LocalAudioResult {
  footsteps: FootstepEvidence | null;
  durationSec: number;
  message: string;
  rawAudioRetained: false;
}

export function detectFootstepsFromEnvelope(
  envelope: number[],
  windowMs: number,
): { timestampsMs: number[]; energies: number[] } {
  if (envelope.length < 4) return { timestampsMs: [], energies: [] };
  const average = envelope.reduce((sum, value) => sum + value, 0) / envelope.length;
  const variance =
    envelope.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    envelope.length;
  const threshold = average + Math.sqrt(variance) * 1.35;
  const minimumGapWindows = Math.max(1, Math.round(260 / windowMs));
  const peaks: Array<{ index: number; energy: number }> = [];

  for (let index = 1; index < envelope.length - 1; index += 1) {
    const isPeak =
      envelope[index] >= threshold &&
      envelope[index] >= envelope[index - 1] &&
      envelope[index] > envelope[index + 1];
    if (!isPeak) continue;
    const previous = peaks.at(-1);
    if (previous && index - previous.index < minimumGapWindows) {
      if (envelope[index] > previous.energy) {
        peaks[peaks.length - 1] = { index, energy: envelope[index] };
      }
      continue;
    }
    peaks.push({ index, energy: envelope[index] });
  }

  return {
    timestampsMs: peaks.map((peak) => Math.round(peak.index * windowMs)),
    energies: peaks.map((peak) => Number(peak.energy.toFixed(4))),
  };
}

export async function analyzeLocalAudio(file: File): Promise<LocalAudioResult> {
  const bytes = await file.arrayBuffer();
  const context = new AudioContext();
  try {
    const buffer = await context.decodeAudioData(bytes.slice(0));
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) =>
      buffer.getChannelData(index),
    );
    const windowSize = Math.max(1, Math.round(buffer.sampleRate * 0.02));
    const envelope: number[] = [];
    for (let start = 0; start < buffer.length; start += windowSize) {
      let energy = 0;
      let count = 0;
      for (const channel of channels) {
        for (let sample = start; sample < Math.min(start + windowSize, buffer.length); sample += 1) {
          energy += channel[sample] ** 2;
          count += 1;
        }
      }
      envelope.push(count === 0 ? 0 : Math.sqrt(energy / count));
    }
    const detected = detectFootstepsFromEnvelope(envelope, 20);
    const enoughEvidence = detected.timestampsMs.length >= 4;
    return {
      footsteps: enoughEvidence
        ? {
            stepTimestampsMs: detected.timestampsMs,
            impactEnergies: detected.energies,
            confidence: Math.min(0.9, 0.45 + detected.timestampsMs.length * 0.04),
            status: "available",
            provenance: "measured",
          }
        : null,
      durationSec: Number(buffer.duration.toFixed(1)),
      message: enoughEvidence
        ? `${detected.timestampsMs.length} candidate footfalls were derived locally.`
        : "Not enough distinct footfalls were found for a defensible observation.",
      rawAudioRetained: false,
    };
  } finally {
    await context.close();
  }
}
