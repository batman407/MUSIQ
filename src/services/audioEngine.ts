// Web Audio API Engine for MUSIQ
// Provides real polyphonic note playback, instrument synthesizers (Piano, Warm Synth, Choir),
// per-voice channel mixing, real-time audio analysis for waveforms, and metronome.

const NOTE_FREQUENCIES: Record<string, number> = {
  // Octave 2
  'C2': 65.41, 'C#2': 69.30, 'Db2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'Eb2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'Gb2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'Ab2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'Bb2': 116.54, 'B2': 123.47,
  // Octave 3
  'C3': 130.81, 'C#3': 138.59, 'Db3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'Gb3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'Ab3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'Bb3': 233.08, 'B3': 246.94,
  // Octave 4
  'C4': 261.63, 'C#4': 277.18, 'Db4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'Gb4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'Ab4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'Bb4': 466.16, 'B4': 493.88,
  // Octave 5
  'C5': 523.25, 'C#5': 554.37, 'Db5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'Eb5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'Gb5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'Ab5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'Bb5': 932.33, 'B5': 987.77,
  // Octave 6
  'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'F6': 1396.91, 'G6': 1567.98
};

export type SynthInstrument = 'piano' | 'synth' | 'choir';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isMuted: boolean = false;
  private activeNodes: { oscs: OscillatorNode[]; gain: GainNode }[] = [];
  private partGains: Map<string, GainNode> = new Map();

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, vol));
      this.masterGain.gain.linearRampToValueAtTime(clamped, this.ctx.currentTime + 0.05);
    }
  }

  // Play a single pitch note for preview/interactive keyboard
  public playNote(pitch: string, durationSeconds: number = 0.6, instrument: SynthInstrument = 'piano', partId?: string) {
    const ctx = this.ensureContext();
    const freq = NOTE_FREQUENCIES[pitch] || 440;
    const now = ctx.currentTime;

    const noteGain = ctx.createGain();
    const oscs: OscillatorNode[] = [];

    // Part routing or master
    let targetGain: AudioNode = this.masterGain!;
    if (partId) {
      if (!this.partGains.has(partId)) {
        const pGain = ctx.createGain();
        pGain.connect(this.masterGain!);
        this.partGains.set(partId, pGain);
      }
      targetGain = this.partGains.get(partId)!;
    }

    if (instrument === 'piano') {
      // Warm acoustic piano model: fundamental triangle + subtle sine overtone + lowpass filter
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now); // Octave overtone

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(3000, freq * 4), now);
      filter.frequency.exponentialRampToValueAtTime(Math.min(1200, freq * 1.5), now + durationSeconds);

      // ASDR: Fast attack, natural exponential decay
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.35, now + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(targetGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + durationSeconds + 0.05);
      osc2.stop(now + durationSeconds + 0.05);
      oscs.push(osc1, osc2);

    } else if (instrument === 'choir') {
      // Warm choir / vocal pad synth: two slightly detuned sines + subtle formant feel
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.002, now); // slight chorus/detune

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(Math.min(1800, freq * 1.8), now);
      filter.Q.setValueAtTime(2.0, now);

      // Choir envelope: softer attack (0.08s) and release
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.3, now + 0.08);
      noteGain.gain.setValueAtTime(0.25, now + durationSeconds * 0.7);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds + 0.15);

      osc1.connect(noteGain);
      osc2.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(targetGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + durationSeconds + 0.2);
      osc2.stop(now + durationSeconds + 0.2);
      oscs.push(osc1, osc2);

    } else {
      // Warm analog synth: saw wave with sweeping filter
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + durationSeconds);

      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.22, now + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(targetGain);

      osc.start(now);
      osc.stop(now + durationSeconds + 0.05);
      oscs.push(osc);
    }

    this.activeNodes.push({ oscs, gain: noteGain });
  }

  // Metronome tick
  public playMetronomeTick(isAccent: boolean = false) {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Configure part volumes for choir rehearsal (Solo, Full, My Part + Background)
  public setPartVolume(partId: string, volume: number) {
    const ctx = this.ensureContext();
    if (!this.partGains.has(partId)) {
      const gainNode = ctx.createGain();
      gainNode.connect(this.masterGain!);
      this.partGains.set(partId, gainNode);
    }
    const gainNode = this.partGains.get(partId)!;
    gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime);
  }

  public stopAll() {
    this.activeNodes.forEach(node => {
      node.oscs.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore already stopped
        }
      });
      try {
        node.gain.disconnect();
      } catch {
        // ignore
      }
    });
    this.activeNodes = [];
  }
}

export const audioEngine = new AudioEngine();
