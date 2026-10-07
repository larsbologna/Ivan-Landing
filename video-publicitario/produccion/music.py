# Música original: tensión en Re menor -> corte -> resolución en Fa mayor.
import mido, subprocess, os
B=os.path.dirname(os.path.abspath(__file__))+"/.."
TPB=960; BPM=90; SPB=60/BPM
mid=mido.MidiFile(ticks_per_beat=TPB)
def sec2tick(s): return int(round(s/SPB*TPB))
tracks={}
def tr(ch,prog,vol=100,rev=60,cho=0):
    t=mido.MidiTrack(); mid.tracks.append(t)
    t.append(mido.Message('program_change',channel=ch,program=prog,time=0))
    for cc,v in ((7,vol),(91,rev),(93,cho),(11,127)): t.append(mido.Message('control_change',channel=ch,control=cc,value=v,time=0))
    tracks[ch]={"t":t,"ev":[]}
def note(ch,n,start,dur,vel):
    tracks[ch]["ev"]+= [(sec2tick(start),mido.Message('note_on',channel=ch,note=n,velocity=vel)),(sec2tick(start+dur),mido.Message('note_off',channel=ch,note=n,velocity=0))]
def cc(ch,c,v,at): tracks[ch]["ev"].append((sec2tick(at),mido.Message('control_change',channel=ch,control=c,value=int(v))))
def ramp(ch,c,a,b,t0,t1,steps=24):
    for i in range(steps+1): cc(ch,c,a+(b-a)*i/steps,t0+(t1-t0)*i/steps)
tempo=mido.MidiTrack(); mid.tracks.append(tempo); tempo.append(mido.MetaMessage('set_tempo',tempo=mido.bpm2tempo(BPM)))
tr(0,0,108,70)      # piano
tr(1,89,92,90)      # warm pad
tr(2,42,90,60)      # cello
tr(3,44,70,80)      # tremolo strings
tr(4,49,85,95)      # slow strings
CUT=6.58
# --- Tensión (0 - 6.58) ---
ramp(1,11,40,100,0,3); note(1,50,0.0,CUT,60); note(1,57,0.0,CUT,52)        # D3 + A3 drone
ramp(2,11,60,110,0,CUT-0.3); note(2,38,0.0,CUT,70)                         # D2 cello
for t,n,v in [(0.05,69,58),(1.38,65,50),(2.70,64,54),(4.02,62,52),(4.70,65,46),(5.36,64,56),(6.02,69,50)]:
    note(0,n,t,1.6,v); note(0,n-24,t,1.6,int(v*0.6))
ramp(3,11,0,105,3.6,CUT); note(3,74,3.6,CUT-3.6,60); note(3,76,3.6,CUT-3.6,48)  # trémolo que crece (D5 + E5 disonante)
# --- Resolución (7.25 - 16) ---
S=7.25; bar=SPB*2   # cambio de acorde cada 2 tiempos (1.33 s)
prog=[[53,57,60,65],[52,55,60,64],[50,57,60,65],[46,53,57,62],[53,57,60,67]]  # F, C/E, Dm7, Bbmaj7, F(add9)
for i,ch_ in enumerate(prog):
    t0=S+i*bar; dur=bar if i<4 else 16.2-t0
    for n in ch_: note(4,n,t0,dur+0.15,50 if i<4 else 46); note(1,n,t0,dur+0.1,44)
    note(2,ch_[0]-12,t0,dur+0.1,60)
    if i<4:
        arp=[ch_[0]+12,ch_[1]+12,ch_[2]+12,ch_[3]+12]
        for k in range(4):
            note(0,arp[k],t0+k*SPB/2,SPB*0.9,46+ (6 if k==0 else 0))
            note(0,arp[(k+2)%4]+12,t0+k*SPB/2+SPB*2/4*1,SPB*0.5,32)
    else:
        for k,n in enumerate([65,69,72,77]): note(0,n,t0+k*0.12,3.2,52-k*4)
ramp(1,11,100,0,15.0,16.0); ramp(4,11,127,0,15.0,16.0); ramp(2,11,110,0,15.0,16.0)
for ch,d in tracks.items():
    ev=sorted(d["ev"],key=lambda e:(e[0], e[1].type=='note_on')); last=0
    for tk,m in ev: d["t"].append(m.copy(time=tk-last)); last=tk
mid.save(f"{B}/audio/music.mid")
subprocess.run(["fluidsynth","-ni","-g","0.7","-r","48000","-F",f"{B}/audio/music_raw.wav","/usr/share/sounds/sf2/FluidR3_GM.sf2",f"{B}/audio/music.mid"],check=True,capture_output=True)
print("ok")
