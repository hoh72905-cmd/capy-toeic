"""Data for the "Giao tiếp" (conversation) section → src/data/convo.json

  - Translation drills (Vietnamese → English) from Tatoeba (https://tatoeba.org, CC BY 2.0 FR).
    Every English sentence linked to the same Vietnamese sentence is kept as an accepted answer,
    so the many ways of saying one thing are all graded as right.
  - Reflex drills (hear a line → pick the natural reply) from DailyDialog
    (Li et al., 2017, http://yanran.li/dailydialog, CC BY-NC-SA 4.0).
  - CEFR level A1–C2 estimated from sentence length and word frequency bands of the
    New General Service List (Browne, Culligan & Phillips, CC BY-SA 4.0).

Usage:
  python3 -I scripts/build_conversation.py <tatoeba folder> <dailydialog train.csv> <NGSL folder>
"""
import bz2, collections, csv, json, random, re, sys
from pathlib import Path

tato, dd_csv, ngsl_dir = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
root = Path(__file__).resolve().parent.parent
random.seed(7)
LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

# ---- word frequency bands (1 = most common … 4 = TOEIC/supplement; 5 = rare) ----
band = {}
for b, name in [(1, '1st_NGSL_basewrd.txt'), (2, '2nd_NGSL_basewrd.txt'), (3, '3rd_NGSL_basewrd.txt'), (4, 'Suplemental_basewrd.txt'), (4, 'TSL_basewrd.txt')]:
    for line in open(ngsl_dir / name, encoding='utf-8', errors='ignore'):
        w = line.strip().lower()
        if w and re.fullmatch(r"[a-z'-]+", w) and w not in band:
            band[w] = b
NAMES = {'tom', 'mary', 'john', 'alice', 'ken', 'bob', 'jack', 'jane', 'mike'}

def difficulty(s):
    # names, places and numbers do not make a sentence harder
    toks = re.findall(r"[A-Za-z']+", s.replace('’', "'"))
    words = [t.lower() for i, t in enumerate(toks) if i == 0 or not t[0].isupper() or t == 'I']
    words = [w for w in words if w not in NAMES]
    if not words:
        return 0
    bands = [band.get(w, band.get(re.sub(r"'(s|re|ve|ll|d|t|m)$", '', w), 5)) for w in words]
    return len(words) * 0.5 + sum({1: 0, 2: 1.4, 3: 2.6, 4: 2.6, 5: 3.6}[b] for b in bands)

BLOCK = re.compile(r"\b(sex\w*|kill\w*|murder\w*|die[ds]?|dying|dead|death|suicide|gun\w*|shoot\w*|bomb\w*|war|drunk|beer|wine|whisky|vodka|alcohol|"
                   r"drug\w*|weed|pot|cocaine|naked|kiss\w*|hate[sd]?|stupid|idiot|fool|damn|hell|fuck\w*|shit|bitch|god|jesus|church|pray\w*|religion|"
                   r"blood\w*|knife|weapon\w*|prison|jail|police|steal\w*|stole|thief|cigarette\w*|smok\w*|fat|ugly|divorc\w*|pregnan\w*|"
                   r"sleep with|cry|cried|scream\w*|cancer|funeral|grave|ghost|devil|witch|monster|terror\w*|hostage|crime|criminal|arrest\w*|"
                   r"girlfriend|boyfriend|sexy|lover|dumb|shut up|nigg\w*|gay|lesbian|racist)\b", re.I)

# Conversation-like: talks to/with someone (I/you/we, questions, requests)
CONVO = re.compile(r"\b(i|i'm|i've|i'll|i'd|you|you're|your|we|we're|let's|let us|please|could|would|shall|can)\b", re.I)

# ---- Tatoeba: Vietnamese sentence → all English translations ----
vie, eng = {}, {}
for line in bz2.open(tato / 'vie_sentences.tsv.bz2', 'rt', encoding='utf-8'):
    i, _, s = line.rstrip('\n').split('\t', 2)
    vie[i] = s
v2e = collections.defaultdict(set)
for line in bz2.open(tato / 'vie-eng_links.tsv.bz2', 'rt', encoding='utf-8'):
    a, b = line.split()
    v2e[a].add(b)
need = {e for es in v2e.values() for e in es}
for line in bz2.open(tato / 'eng_sentences.tsv.bz2', 'rt', encoding='utf-8'):
    i, _, s = line.rstrip('\n').split('\t', 2)
    if i in need:
        eng[i] = s

def ok_en(s):
    n = len(s.split())
    return 2 <= n <= 22 and not BLOCK.search(s) and re.fullmatch(r"[A-Za-z0-9 ,.'’?!\-:;$%\"]+", s) and s[0].isupper() and s[-1] in '.?!'

items = []
for v_id, e_ids in v2e.items():
    if v_id not in vie:
        continue
    vs = vie[v_id]
    answers = sorted({eng[e].replace('’', "'") for e in e_ids if e in eng and ok_en(eng[e])}, key=len)
    if not answers or len(vs) > 140 or BLOCK.search(vs):
        continue
    first = answers[0]
    conv = bool(CONVO.search(first)) or first.endswith('?')
    if not conv:
        continue  # the section trains conversation: keep sentences said to/with someone
    items.append({'id': int(v_id), 'vi': vs, 'en': answers[:6], 'q': first.endswith('?'), 'd': difficulty(first)})

# Spread over CEFR levels by difficulty (Tatoeba is mostly A1–B1, so the upper levels are the hardest sentences found)
items.sort(key=lambda x: x['d'])
SHARE = [0.20, 0.24, 0.24, 0.17, 0.10, 0.05]
cut, acc = [], 0
for s in SHARE:
    acc += s
    cut.append(int(acc * len(items)))
for k, it in enumerate(items):
    it['lv'] = next(i for i, c in enumerate(cut) if k < c)
PER_LEVEL = [320, 340, 340, 260, 170, 110]
tr = []
for lv in range(6):
    pool = [x for x in items if x['lv'] == lv]
    pool.sort(key=lambda x: (-len(x['en']), x['id']))  # prefer items with several accepted answers
    chosen = pool[:PER_LEVEL[lv]]
    random.shuffle(chosen)  # mix topics within a level
    tr += [[x['id'], lv, x['vi'], x['en'], 1 if x['q'] else 0] for x in chosen]

# ---- DailyDialog: question / request → reply ----
QUOTED = re.compile(r"'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"")
def clean_dd(s):
    s = s.replace(' ’ ', "'").replace('’', "'").replace(' , ', ', ').replace(' .', '.').replace(' ?', '?').replace(' !', '!')
    s = re.sub(r"\s+'\s*", "'", s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s[:1].upper() + s[1:]
# a wrong reply must not be one that fits almost any question
LOOSE = re.compile(r"^(yes|yeah|no|nope|ok|okay|sure|of course|certainly|i'd love|thank|fine|good|great|all right|alright|maybe|perhaps|i think|i don't|i have no idea|not really|i'm afraid|well|oh|that's|it's ok)", re.I)
GENERIC = re.compile(r"^(yes|yeah|no|ok|okay|sure|thanks|thank you|really|right|fine|good|great|all right|of course|certainly|me too|i see|what)\W*$", re.I)
pairs = []
with open(dd_csv, encoding='utf-8') as f:
    for row in csv.DictReader(f):
        turns = [clean_dd(a or b) for a, b in QUOTED.findall(row['dialog'])]
        acts = [int(x) for x in re.findall(r'\d', row['act'])]
        if len(acts) != len(turns):
            continue
        for k in range(len(turns) - 1):
            a, b = turns[k], turns[k + 1]
            if acts[k] not in (2, 3):  # 2 = question, 3 = directive
                continue
            if not (3 <= len(a.split()) <= 14 and 2 <= len(b.split()) <= 14):
                continue
            if BLOCK.search(a) or BLOCK.search(b) or not ok_en(a) or not ok_en(b) or GENERIC.match(b):
                continue
            pairs.append({'a': a, 'b': b, 'd': (difficulty(a) + difficulty(b)) / 2})
seen, uniq = set(), []
for p in pairs:
    k = p['a'].lower()
    if k not in seen:
        seen.add(k); uniq.append(p)
uniq.sort(key=lambda x: x['d'])
cut, acc = [], 0
for s in SHARE:
    acc += s
    cut.append(int(acc * len(uniq)))
for k, p in enumerate(uniq):
    p['lv'] = next(i for i, c in enumerate(cut) if k < c)
RF_PER_LEVEL = [100, 110, 110, 90, 60, 40]
rf = []
for lv in range(6):
    pool = [p for p in uniq if p['lv'] == lv]
    random.shuffle(pool)
    chosen = pool[:RF_PER_LEVEL[lv]]
    others = [p for p in uniq if abs(p['lv'] - lv) <= 1]
    for n, p in enumerate(chosen):
        first = p['a'].split()[0].lower()
        # wrong replies: from other dialogs, opening with a different word, similar length
        cands = [o['b'] for o in random.sample(others, min(60, len(others)))
                 if o['a'].split()[0].lower() != first and o['b'] != p['b'] and abs(len(o['b']) - len(p['b'])) < 40
                 and not LOOSE.match(o['b']) and not o['b'].endswith('?')]
        if len(cands) < 3:
            continue
        rf.append([len(rf) + 1, lv, p['a'], p['b'], cands[:3]])

out = {
    'sources': {
        'tatoeba': 'Tatoeba (https://tatoeba.org) — CC BY 2.0 FR; ids are Vietnamese sentence numbers: https://tatoeba.org/sentences/show/<id>',
        'dailydialog': 'DailyDialog, Li et al. 2017 (http://yanran.li/dailydialog) — CC BY-NC-SA 4.0; the reflex drills derived from it are shared under the same license',
        'ngsl': 'New General Service List (Browne, Culligan & Phillips) — CC BY-SA 4.0, used to estimate levels',
    },
    'tr': tr, 'rf': rf,
}
(root / 'src/data/convo.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
cnt = collections.Counter(x[1] for x in tr); cr = collections.Counter(x[1] for x in rf)
print('translation items', len(tr), {LEVELS[k]: cnt[k] for k in range(6)}, 'multi-answer', sum(len(x[3]) > 1 for x in tr), 'questions', sum(x[4] for x in tr))
print('reflex', len(rf), {LEVELS[k]: cr[k] for k in range(6)}, 'from', len(uniq), 'pairs')
