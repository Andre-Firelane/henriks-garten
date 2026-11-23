"""Platzhalter-Ruf der Schneeeule (Eiswelt): tiefes "Huu ... hu-hu-huu" aus weichen Sinustönen mit leichtem Vibrato und
etwas Rauschen (Atem). Schreibt public/assets/sounds/animal_snowowl.wav (Mono, 22050 Hz).
Aufruf: python tools/owl-hoot.py   (braucht numpy) – durch eine echte Aufnahme ersetzen, sobald es eine gibt."""
import wave
import numpy as np

SR = 22050
rng = np.random.default_rng(7)


def hoot(dur, f0, f1, amp):
    t = np.arange(int(SR * dur)) / SR
    f = np.linspace(f0, f1, len(t)) * (1 + 0.012 * np.sin(2 * np.pi * 5.5 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    x += 0.06 * rng.standard_normal(len(t))  # Atem
    env = np.minimum(1, t / 0.06) * np.minimum(1, (dur - t) / 0.12)
    return amp * x * env ** 1.5


def gap(d):
    return np.zeros(int(SR * d))


sig = np.concatenate([hoot(0.55, 380, 340, 0.8), gap(0.35), hoot(0.16, 400, 380, 0.6), gap(0.08), hoot(0.16, 400, 380, 0.6), gap(0.08), hoot(0.45, 390, 330, 0.75), gap(0.2)])
sig = sig / np.abs(sig).max() * 0.85
pcm = (sig * 32767).astype('<i2')
with wave.open('public/assets/sounds/animal_snowowl.wav', 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('ok', len(sig) / SR, 's')
