// Audio Service for Vendeei
// Synthesizes pleasant chimes using Web Audio API to avoid external file dependencies.

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Play a cheerful, ascending notification chime when a new order comes in.
 */
export function playOrderEnteredSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;

  // Resume context if suspended due to browser autoplay policies
  if (ctx.state === 'suspended') {
    ctx.resume().catch(err => console.error('Erro ao resumir AudioContext:', err));
  }

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (cheerful chime)
  const duration = 0.15;

  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + index * 0.08);

    // Fade-out envelope
    gainNode.gain.setValueAtTime(0.1, now + index * 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now + index * 0.08);
    osc.stop(now + index * 0.08 + duration);
  });
}

/**
 * Play a soft, descending low chime when an order is canceled.
 */
export function playOrderCanceledSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(err => console.error('Erro ao resumir AudioContext:', err));
  }

  const now = ctx.currentTime;
  const notes = [392.00, 311.13, 261.63]; // G4, Eb4, C4 (descending warn chime)
  const duration = 0.25;

  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle'; // softer warning tone
    osc.frequency.setValueAtTime(freq, now + index * 0.12);

    gainNode.gain.setValueAtTime(0.12, now + index * 0.12);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now + index * 0.12);
    osc.stop(now + index * 0.12 + duration);
  });
}
