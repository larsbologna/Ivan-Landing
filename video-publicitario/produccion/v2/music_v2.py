# Música original v2: tensión (La menor) -> descubrimiento (Do mayor) -> confianza.
import mido, subprocess, os
B = os.path.dirname(os.path.abspath(__file__)) + "/.."
TPB = 960; BPM = 96; SPB = 60 / BPM
END = 24.9; SOL = 12.2; PROOF = 18.5
mid = mido.MidiFile(ticks_per_beat=TPB)
def tk(s): return int(round(s / SPB * TPB))
T = {}
def tr(ch, prog, vol=100, rev=60):
    t = mido.MidiTrack(); mid.tracks.append(t)
    t.append(mido.Message('program_change', channel=ch, program=prog, time=0))
    for cc, v in ((7, vol), (91, rev), (11, 127)): t.append(mido.Message('control_change', channel=ch, control=cc, value=v, time=0))
    T[ch] = []
def note(ch, n, s, d, v):
    T[ch] += [(tk(s), mido.Message('note_on', channel=ch, note=n, velocity=v)), (tk(s + d), mido.Message('note_off', channel=ch, note=n, velocity=0))]
def ramp(ch, a, b, t0, t1, steps=20):
    for i in range(steps + 1): T[ch].append((tk(t0 + (t1 - t0) * i / steps), mido.Message('control_change', channel=ch, control=11, value=int(a + (b - a) * i / steps))))
tempo = mido.MidiTrack(); mid.tracks.append(tempo); tempo.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(BPM)))
tr(0, 0, 105, 60); tr(1, 89, 88, 90); tr(2, 42, 85, 50); tr(3, 49, 85, 90); tr(4, 11, 70, 70)  # piano, pad, cello, cuerdas, vibráfono
# Tensión: pedal de La + motivo de piano en corcheas suaves
note(1, 57, 0, SOL, 52); note(1, 64, 0, SOL, 40); note(2, 45, 0, SOL, 64); ramp(1, 60, 110, 0, SOL - 0.3)
mot = [69, 72, 76, 72, 69, 72, 77, 72]
k = 0; t = 0.0
while t < SOL - 0.4:
    note(0, mot[k % 8], t, SPB * 0.45, 34 + (k % 4 == 0) * 10); k += 1; t += SPB / 2
# Descubrimiento y confianza: progresión cada 2 tiempos
prog = [[48, 55, 60, 64], [47, 55, 59, 62], [45, 52, 57, 60], [41, 53, 57, 60],  # C, G/B, Am, F
        [41, 53, 57, 65], [40, 52, 55, 60], [38, 53, 57, 62], [43, 55, 59, 62], [48, 55, 60, 64]]  # F, C/E, Dm7, G, C
bar = SPB * 2
t0 = SOL
for i, c in enumerate(prog):
    s = t0 + i * bar
    if s > END: break
    d = bar if i < len(prog) - 1 else END - s + 0.4
    for n in c: note(3, n + 12, s, d + 0.1, 46); note(1, n + 12, s, d + 0.1, 40)
    note(2, c[0] - 12, s, d, 58)
    if i < len(prog) - 1:
        arp = [c[0] + 24, c[1] + 24, c[2] + 24, c[3] + 24]
        for j in range(4): note(0, arp[j], s + j * SPB / 2, SPB * 0.8, 40 if s < PROOF else 44)
    if s >= PROOF: note(4, c[2] + 24, s, bar, 36)
ramp(3, 127, 0, END - 1.0, END); ramp(1, 110, 0, END - 1.0, END)
for ch, ev in T.items():
    trk = mid.tracks[1 + list(T).index(ch)] if False else None
for idx, (ch, ev) in enumerate(T.items()):
    trk = mid.tracks[idx]; last = 0
    for t_, m in sorted(ev, key=lambda e: (e[0], e[1].type == 'note_on')):
        trk.append(m.copy(time=t_ - last)); last = t_
mid.save(f"{B}/audio_v2/music.mid")
subprocess.run(["fluidsynth", "-ni", "-g", "0.7", "-r", "48000", "-F", f"{B}/audio_v2/music_raw.wav", "/usr/share/sounds/sf2/FluidR3_GM.sf2", f"{B}/audio_v2/music.mid"], check=True, capture_output=True)
print("ok")
