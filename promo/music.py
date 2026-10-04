import numpy as np, wave
sr=44100;D=45;n=sr*D;t=np.arange(n)/sr
L=np.zeros(n);R=np.zeros(n)
def note(f):return f
midi=lambda m:440*2**((m-69)/12)
# progression (Dm, Bb, F, C) ~ cinematic-warm, 4.5s each... 10 chords
chords=[[50,57,62,65],[46,53,58,62],[53,57,60,65],[48,55,60,64]]*3
cl=D/len(chords[:10]) if False else 4.5
for i in range(10):
    ch=chords[i%4];a=i*cl;b=a+cl+1.5
    idx=(t>=a)&(t<b);tt=t[idx]-a
    env=np.minimum(tt/1.2,1)*np.exp(-np.maximum(tt-cl,0)*2.5)
    sig=np.zeros(tt.shape)
    for m in ch:
        f=midi(m)
        for det,pan in((0.997,0),(1.003,1)):
            sig+=np.sin(2*np.pi*f*det*tt)*0.5+np.sin(2*np.pi*f*2*det*tt)*0.15
    L[idx]+=sig*env*0.035;R[idx]+=sig[::-1].copy()[::-1]*env*0.035
# pluck arpeggio, 8th notes at 100bpm → 0.3s
step=0.3
for k in range(int(D/step)):
    s=k*step
    if s<0.3 or s>43.5:continue
    ch=chords[int(s//cl)%4];m=ch[k%4]+12+(12 if k%8>=4 else 0)
    f=midi(m);idx=(t>=s)&(t<s+1.2);tt=t[idx]-s
    sig=(np.sin(2*np.pi*f*tt)+0.4*np.sin(2*np.pi*f*2*tt))*np.exp(-tt*5)*0.05
    pan=0.3+0.4*((k%5)/4)
    L[idx]+=sig*(1-pan);R[idx]+=sig*pan
# soft pulse bass
for k in range(int(D/0.6)):
    s=k*0.6
    f=midi(chords[int(s//cl)%4][0]-12);idx=(t>=s)&(t<s+0.5);tt=t[idx]-s
    sig=np.sin(2*np.pi*f*tt)*np.exp(-tt*6)*0.12
    L[idx]+=sig;R[idx]+=sig
# whooshes at scene changes
def whoosh(s,d=0.7):
    idx=(t>=s-d)&(t<s+0.2);tt=t[idx]-(s-d)
    noise=np.random.randn(idx.sum())
    env=np.sin(np.pi*np.clip(tt/(d+0.2),0,1))**2
    # lowpass-ish by cumulative smoothing
    k=np.ones(40)/40;noise=np.convolve(noise,k,'same')
    L[idx]+=noise*env*0.5*0.35;R[idx]+=noise*env*0.5*0.35
for s in (7,12,27,34,40):whoosh(s)
# success ding at 26.8 and 2.4 thud
def ding(s,fs=(1318.5,1760.0)):
    idx=(t>=s)&(t<s+1.5);tt=t[idx]-s
    sig=sum(np.sin(2*np.pi*f*tt) for f in fs)*np.exp(-tt*3.2)*0.1
    L[idx]+=sig;R[idx]+=sig
ding(26.8);ding(14.1+12-12+0.0*0,(1046.5,)) if False else None
ding(12+14.2,(1568.0,2093.0))
# stamp thud at 2.3
idx=(t>=2.3)&(t<2.8);tt=t[idx]-2.3;th=np.sin(2*np.pi*(90-60*tt)*tt)*np.exp(-tt*9)*0.5;L[idx]+=th;R[idx]+=th
# simple reverb: feedback delay
def delay(x,d,g):
    y=x.copy();k=int(d*sr);y[k:]+=x[:-k]*g;return y
for d,g in((0.23,.35),(0.37,.25)):
    L=delay(L,d,g);R=delay(R,d*1.07,g)
fade=np.minimum(np.minimum(t/1.0,1),np.clip((D-t)/2.0,0,1))
out=np.stack([L*fade,R*fade],1)
out/=np.abs(out).max()/0.8
pcm=(out*32767).astype('<i2')
w=wave.open('out/music.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes(pcm.tobytes());w.close()
print('ok')
