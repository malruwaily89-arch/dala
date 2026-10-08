import subprocess, os, sys
from PIL import Image, ImageDraw
H=os.path.dirname(os.path.abspath(__file__)); os.chdir(H)
def run(c): print(c[:160]); subprocess.run(c,shell=True,check=True)
os.makedirs('out',exist_ok=True); os.makedirs('tmp',exist_ok=True)
S5,S6=17.0,32.8; SEG=[0,4.69,6.63,8.96,13.07,15.8]
def mask(path,w,h,r):
    im=Image.new('L',(w*4,h*4),0); ImageDraw.Draw(im).rounded_rectangle((0,0,w*4-1,h*4-1),r*4,fill=255); im.resize((w,h),Image.LANCZOS).save(path)
mask('tmp/mask_phone.png',495,1030,87); mask('tmp/mask_woman.png',700,640,64)
if '--frames' in sys.argv or not os.path.exists('fr_L3/f_01490.jpg'):
    run('python3 render2.py lead3.html X fr_L3 0 49.7')
run("ffmpeg -v error -y -framerate 30 -i fr_L3/f_%05d.jpg -an -c:v libx264 -preset medium -crf 15 -pix_fmt yuv420p -r 30 tmp/base.mp4")
# phone demo: segments (raw seconds, speed)
RAW=[(0.8,13.0,2.6),(13.0,16.5,1.8),(16.5,20.0,1.5),(20.0,31.5,2.8),(31.5,37.0,2.0)]
fc=[];cat=''
for i,(a,b,sp) in enumerate(RAW):
    fc.append(f"[0:v]trim=start={a}:end={b},setpts=(PTS-STARTPTS)/{sp},fps=30[v{i}]"); cat+=f"[v{i}]"
fc.append(f"{cat}concat=n={len(RAW)}:v=1:a=0,scale=495:1030:flags=lanczos,format=rgba[ph0]")
fc.append("[ph0][1:v]alphamerge[ph1]")
D=SEG[-1]
fc.append(f"[ph1]fade=t=in:st=0:d=0.35:alpha=1,fade=t=out:st={D-0.3}:d=0.3:alpha=1,setpts=PTS+{S5}/TB[phone]")
# woman clip
fc.append("[2:v]trim=start=0.3:end=3.5,setpts=PTS-STARTPTS,fps=30,scale=700:-2:flags=lanczos,crop=700:640:0:140,format=rgba[w0]")
fc.append("[w0][3:v]alphamerge[w1]")
fc.append("[w1]fade=t=in:st=0:d=0.3:alpha=1,fade=t=out:st=2.9:d=0.3:alpha=1,setpts=PTS+1.3/TB[woman]")
fc.append("[4:v][woman]overlay=190:780:eof_action=pass:enable='between(t,1.3,4.6)'[o1]")
fc.append(f"[o1][phone]overlay=292:440:eof_action=pass:enable='between(t,{S5},{S6})'[out]")
filt=';'.join(fc)
cmd=(f"ffmpeg -v error -y -i src/site-phone-demo.mp4 -loop 1 -i tmp/mask_phone.png -i src/site-woman.mp4 -loop 1 -i tmp/mask_woman.png -i tmp/base.mp4 "
     f"-filter_complex \"{filt}\" -map \"[out]\" -an -t 49.7 -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -r 30 -movflags +faststart out/mutrafa-promo-v6-9x16-silent.mp4")
run(cmd); print('DONE')
