"""Pre-render the app's audio (listening lessons + vocabulary) to MP3 with Piper TTS,
so every phone and laptop has sound, even without English voices installed or offline.

Voices (https://huggingface.co/rhasspy/piper-voices):
  en_US-ljspeech-medium   – LJ Speech, public domain
  en_US-libritts_r-medium – LibriTTS-R, CC BY 4.0 (speaker 922)
  en_GB-cori-medium       – Hi-Fi TTS (NVIDIA), CC BY 4.0
  en_GB-vctk-medium       – VCTK (Univ. of Edinburgh), CC BY 4.0 (speakers p254, p326)

Usage:
  pip install piper-tts lameenc
  node scripts/list_audio.mjs > /tmp/items.json
  python3 scripts/build_audio.py /tmp/items.json <folder with the .onnx voices>
Only new or changed texts are rendered; files no longer used are removed.
"""
import hashlib, json, sys
from pathlib import Path
import lameenc
from piper import PiperVoice, SynthesisConfig

items = json.load(open(sys.argv[1]))
vdir = Path(sys.argv[2])
root = Path(__file__).resolve().parent.parent
out = root / 'public' / 'audio'
out.mkdir(parents=True, exist_ok=True)

VOICES = {  # name: (model, speaker)
    'us1': ('en_US-ljspeech-medium', None), 'us2': ('en_US-libritts_r-medium', '922'),
    'uk1': ('en_GB-cori-medium', None), 'uk2': ('en_GB-vctk-medium', 'p254'),
    'au1': ('en_GB-vctk-medium', 'p326'), 'au2': ('en_GB-cori-medium', None),
    # more North American voices (VCTK speaker accents: p294 US/San Francisco, p360 US/New Jersey,
    # p303 Canada/Toronto, p316 Canada/Alberta)
    'us3': ('en_GB-vctk-medium', 'p294'), 'us4': ('en_GB-vctk-medium', 'p360'),
    'ca1': ('en_GB-vctk-medium', 'p303'), 'ca2': ('en_GB-vctk-medium', 'p316'),
}
loaded = {}
def voice(name):
    model, spk = VOICES[name]
    if model not in loaded:
        loaded[model] = (PiperVoice.load(str(vdir / f'{model}.onnx')),
                         json.load(open(vdir / f'{model}.onnx.json')).get('speaker_id_map', {}))
    v, spk_map = loaded[model]
    return v, (spk_map[spk] if spk else None)

def render(text, name, slow):
    v, sid = voice(name)
    cfg = SynthesisConfig(speaker_id=sid, length_scale=1.12 if slow else 1.0, noise_scale=0.6)
    chunks = list(v.synthesize(text, syn_config=cfg))
    sr = chunks[0].sample_rate
    pcm = b''.join(c.audio_int16_bytes for c in chunks)
    pcm = b'\x00\x00' * int(sr * 0.12) + pcm + b'\x00\x00' * int(sr * 0.2)  # short silence around the clip
    enc = lameenc.Encoder()
    enc.set_bit_rate(40); enc.set_in_sample_rate(sr); enc.set_channels(1); enc.set_quality(2)
    return enc.encode(pcm) + enc.flush()

manifest, used, made = {}, set(), 0
for it in items:
    h = hashlib.sha1(f"{it['voice']}|{it.get('slow', False)}|{it['text']}".encode()).hexdigest()[:12]
    name = f'{h}.mp3'
    used.add(name)
    manifest[it['key']] = name
    f = out / name
    if not f.exists():
        f.write_bytes(render(it['text'], it['voice'], it.get('slow', False)))
        made += 1
# a tiny silent clip used to unlock audio on phones at the first tap
if not (out / 'silence.mp3').exists():
    e = lameenc.Encoder(); e.set_bit_rate(32); e.set_in_sample_rate(22050); e.set_channels(1)
    (out / 'silence.mp3').write_bytes(e.encode(b'\x00\x00' * 2205) + e.flush())
used.add('silence.mp3')
for f in out.glob('*.mp3'):
    if f.name not in used:
        f.unlink()
(root / 'src' / 'data' / 'audio.json').write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')))
print(f'{len(items)} clips, {made} rendered now, total {sum(p.stat().st_size for p in out.glob("*.mp3")) // 1024} KB')
