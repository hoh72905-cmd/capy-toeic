"""Pick English–Vietnamese sentences from Tatoeba (https://tatoeba.org, CC BY 2.0 FR) for:
  - example sentences of the TOEIC Service List words (src/data/examples.json)
  - extra dictation lessons (src/data/listenMore.json)

Usage:
  download from https://downloads.tatoeba.org/exports/per_language/ :
    vie/vie_sentences.tsv.bz2, vie/vie-eng_links.tsv.bz2, eng/eng_sentences.tsv.bz2
  python3 -I scripts/build_tatoeba.py <folder with those files> <TSL teaching list .txt>
"""
import bz2, collections, json, re, sys
from pathlib import Path

src, teach = Path(sys.argv[1]), Path(sys.argv[2])
root = Path(__file__).resolve().parent.parent
tsl = json.load(open(root / 'src/data/tsl.json', encoding='utf-8'))['words']

vie = {}
for line in bz2.open(src / 'vie_sentences.tsv.bz2', 'rt', encoding='utf-8'):
    i, _, s = line.rstrip('\n').split('\t', 2)
    vie[i] = s
links = collections.defaultdict(list)
for line in bz2.open(src / 'vie-eng_links.tsv.bz2', 'rt', encoding='utf-8'):
    a, b = line.split()
    links[b].append(a)
eng = {}
for line in bz2.open(src / 'eng_sentences.tsv.bz2', 'rt', encoding='utf-8'):
    i, _, s = line.rstrip('\n').split('\t', 2)
    if i in links:
        eng[i] = s

# Sentences a study app should not show
BLOCK = re.compile(r"\b(sex\w*|kill\w*|murder\w*|die[ds]?|dying|dead|death|suicide|gun\w*|shoot\w*|bomb\w*|war|drunk|beer|wine|whisky|vodka|alcohol|"
                   r"drug\w*|naked|kiss\w*|hate[sd]?|stupid|idiot|fool|damn|hell|fuck\w*|shit|bitch|god|jesus|church|pray\w*|religion|"
                   r"blood\w*|knife|weapon\w*|prison|jail|police|steal\w*|stole|thief|cigarette\w*|smok\w*|fat|ugly|divorc\w*|pregnan\w*|"
                   r"girlfriend|boyfriend|marr\w*|wife|husband|love[ds]?|lover|bed|sleep with|cry|cried|scream\w*|hurt|pain|sick|ill|"
                   r"cancer|hospital|funeral|grave|ghost|devil|witch|monster|terror\w*|hostage|crime|criminal|arrest\w*)\b", re.I)

def clean(e, v):
    n = len(e.split())
    return (4 <= n <= 16 and not BLOCK.search(e) and e[0].isupper() and e[-1] in '.?!'
            and re.fullmatch(r"[A-Za-z0-9 ,.'’?!\-:;$%\"]+", e) and len(v) < 160)

pairs = []
for e_id, v_ids in links.items():
    if e_id not in eng:
        continue
    v = [vie[x] for x in v_ids if x in vie]
    if v and clean(eng[e_id], v[0]):
        pairs.append((int(e_id), eng[e_id], v[0]))
pairs.sort()

# Word forms (TSL list for teaching: headword, inflections…)
forms = {}
for line in open(teach, encoding='utf-8-sig'):
    if line.startswith('#') or not line.strip():
        continue
    ws = [w.strip().lower() for w in line.strip().split(',') if w.strip()]
    forms[ws[0]] = ws
rank = {w[0].lower(): i for i, w in enumerate(tsl)}
pats = {w[0]: re.compile(r"\b(" + '|'.join(re.escape(f) for f in forms.get(w[0].lower(), [w[0].lower()])) + r")\b", re.I) for w in tsl}

# Which TOEIC words each sentence contains
hits = collections.defaultdict(list)
for idx, (_, e, _) in enumerate(pairs):
    for w, p in pats.items():
        if p.search(e):
            hits[idx].append(w)

# 1) One example sentence per word: medium length, used once if possible
examples, used = {}, set()
by_word = collections.defaultdict(list)
for idx, ws in hits.items():
    for w in ws:
        by_word[w].append(idx)
for w in sorted(by_word, key=lambda x: rank[x.lower()]):
    cands = sorted(by_word[w], key=lambda i: (i in used, abs(len(pairs[i][1].split()) - 9)))
    i = cands[0]
    used.add(i)
    examples[w] = [pairs[i][1], pairs[i][2], pairs[i][0]]

# 2) Dictation lessons: sentences with TOEIC words, three levels by length
def level(e):
    n = len(e.split())
    return 1 if n <= 8 else 2 if n <= 11 else 3
pool = sorted((i for i in hits if 6 <= len(pairs[i][1].split()) <= 14),
              key=lambda i: (level(pairs[i][1]), min(rank[w.lower()] for w in hits[i])))
lessons, per_level = [], collections.defaultdict(list)
for i in pool:
    per_level[level(pairs[i][1])].append(i)
SCENES = ['🗣️', '🏙️', '🧳', '🛒', '🏠', '📅', '☕', '🚆', '📚', '🌤️']
ACCENTS = ['us', 'uk', 'au']
n = 0
for lv in (1, 2, 3):
    ids = per_level[lv][:150]  # up to 15 lessons per level
    for k in range(0, len(ids) - 9, 10):
        chunk = ids[k:k + 10]
        words = []
        for i in chunk:
            for w in hits[i]:
                if w not in words:
                    words.append(w)
        n += 1
        lessons.append({
            'id': f't{n}', 'title': 'Từ TOEIC: ' + ', '.join(words[:3]), 'part': f'Câu thông dụng · cấp {lv}',
            'scene': SCENES[n % len(SCENES)], 'accent': ACCENTS[n % 3], 'level': lv, 'tatoeba': True,
            's': [[pairs[i][1], pairs[i][2]] for i in chunk], 'src': [pairs[i][0] for i in chunk],
        })

note = {'source': 'Tatoeba (https://tatoeba.org)', 'license': 'CC BY 2.0 FR', 'ids': 'Tatoeba sentence numbers: https://tatoeba.org/sentences/show/<id>'}
(root / 'src/data/examples.json').write_text(json.dumps({**note, 'examples': examples}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
(root / 'src/data/listenMore.json').write_text(json.dumps({**note, 'lessons': lessons}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'{len(pairs)} clean pairs · {len(examples)} word examples · {len(lessons)} lessons ({sum(len(l["s"]) for l in lessons)} sentences)')
