from pathlib import Path
import subprocess, json
ROOT=Path(__file__).resolve().parents[1]
TEMP=ROOT/'artifacts/private/tutorial'
for i in range(10):
    wav=TEMP/f'voice-{i:02d}.wav'
    probe=json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-of','json',str(wav)]))
    duration=float(probe['format']['duration'])
    # Fit narration within 29 seconds; leave a short pause before the next chapter.
    speed=max(1,duration/29)
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-framerate','12','-i',str(TEMP/f'frame-{i:02d}.png'),'-i',str(wav),'-vf','scale=1280:720','-af',f'atempo={speed:.5f},apad','-t','30','-c:v','libx264','-preset','fast','-tune','stillimage','-crf','24','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k',str(TEMP/f'segment-{i:02d}.mp4')],check=True)
    print(f'Segment {i+1}: narration {duration:.1f}s, output 30s',flush=True)
lst=TEMP/'concat.txt';lst.write_text('\n'.join(f"file 'segment-{i:02d}.mp4'" for i in range(10)))
out=ROOT/'delivery/extra-credit-tutorial.mp4'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(lst),'-c','copy','-movflags','+faststart',str(out)],check=True)
print(f'Video: {out} ({out.stat().st_size/1024/1024:.2f} MiB)',flush=True)
