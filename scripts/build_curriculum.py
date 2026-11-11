"""Turn the Kaggle "English Test Prep Data: TOEIC, IELTS, TOEFL" CSVs into src/data/curriculum.js.

Dataset: https://www.kaggle.com/datasets/duongduong123/english-test-prep-data-toeic-ielts-toefl
Author: duongduong123 · License: Open Database License (ODbL)

Only the TOEIC Listening & Reading part is kept: grammar, the vocabulary topics that
TOEIC lessons depend on, listening Part 1–4 and reading Part 5–7 lessons.

Usage: python3 scripts/build_curriculum.py <folder with the unzipped CSVs>
"""
import csv, json, re, sys
from pathlib import Path

src = Path(sys.argv[1])
out = Path(__file__).resolve().parent.parent / 'src' / 'data' / 'curriculum.js'

def rows(name):
    with open(src / name, encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))

def clean(s):
    s = re.sub(r'\s+', ' ', s).strip()
    s = s.replace(' ,', ',')
    for a, b in [('temse', 'tense'), ('Noquestions', 'No questions'), ('questios', 'questions'), ('  ', ' ')]:
        s = s.replace(a, b)
    return s[0].upper() + s[1:] if s else s

# TOEIC Listening & Reading competencies
COMPS = {
    'CPT_1': ('grammar', 'A1'), 'CPT_2': ('grammar', 'A2'), 'CPT_3': ('grammar', 'B1'), 'CPT_4': ('grammar', 'B2'),
    'CPT_5': ('listening', None), 'CPT_6': ('listening', None), 'CPT_7': ('listening', None), 'CPT_8': ('listening', None),
    'CPT_9': ('reading', None), 'CPT_10': ('reading', None), 'CPT_11': ('reading', None), 'CPT_12': ('reading', None),
}
levels = [r for r in rows('Level_entity.csv') if r['Certificate'] == 'TOEIC L-R']
cefr_band = {r['CERF_Level']: (int(r['From_Score_equivalent']), int(r['To_Score_equivalent'])) for r in levels}

comps = []
for r in rows('Competency_Entity.csv'):
    cid = r['Competency_id']
    if cid not in COMPS:
        continue
    cat, cefr = COMPS[cid]
    if cefr:  # grammar: band on the total score
        lo, hi = cefr_band[cefr]
        comps.append({'id': cid, 'cat': cat, 'name': r['Competency_Name'], 'scope': 'total', 'from': lo, 'to': hi, 'cefr': cefr})
    else:  # listening / reading: band on the section score (5–495)
        lo, hi = map(int, re.findall(r'(\d+)\s*-\s*(\d+)', r['Competency_Name'])[0])
        comps.append({'id': cid, 'cat': cat, 'name': r['Competency_Name'], 'scope': 'section', 'from': lo, 'to': hi})

lesson_comps = {}
for f in ['NEED_LEARN_GRAMMAR_LESSON.csv', 'NEED_LEARN_LISTEN_SKILL_LESSON.csv', 'NEED_LEARN_READING_SKILL_LESSON.csv']:
    for r in rows(f):
        if r['Competency_ID'] in COMPS:
            lesson_comps.setdefault(r['Lesson_ID'], []).append(r['Competency_ID'])

pre = {}
for f in ['NEED_LEARN_PRE_LESSON1.csv', 'NEED_LEARN_PRE_LESSON2.csv']:
    for r in rows(f):
        pre.setdefault(r['Lesson_ID'], []).append(r['Pre_Lesson_ID'])

# Links to exercises that already exist in the app
def grammar_link(n):
    ranges = [((1, 2), 'pronoun'), ((26, 27), 'pronoun'), ((4, 19), 'tenses'), ((25, 25), 'wordform'), ((55, 56), 'wordform'),
              ((31, 34), 'sva'), ((35, 37), 'preposition'), ((67, 68), 'preposition'), ((40, 47), 'gerund'),
              ((60, 61), 'comparison'), ((62, 64), 'conjunction'), ((70, 75), 'passive'), ((80, 82), 'conditional'), ((87, 90), 'relative')]
    for (a, b), t in ranges:
        if a <= n <= b:
            return {'page': 'practice', 'ref': t}
READING_LINK = {'LS266': 'preposition', 'LS267': 'wordform', 'LS268': 'conjunction', 'LS269': 'relative', 'LS270': 'relative', 'LS271': 'pronoun'}
def listening_link(n):
    for (a, b), l in [((227, 232), 'l1'), ((233, 242), 'l2'), ((243, 250), 'l3'), ((251, 259), 'l4')]:
        if a <= n <= b:
            return {'page': 'listen', 'ref': l}
VOCAB_TOPIC = {
    'LS112': 'Nhân sự', 'LS123': 'Nhân sự', 'LS124': 'Nhân sự', 'LS137': 'Nhân sự', 'LS113': 'Tài chính', 'LS148': 'Tài chính',
    'LS131': 'Kinh doanh', 'LS140': 'Kinh doanh', 'LS141': 'Kinh doanh', 'LS133': 'Marketing', 'LS142': 'Marketing',
    'LS114': 'Du lịch', 'LS127': 'Du lịch', 'LS603': 'Du lịch', 'LS102': 'Mua sắm', 'LS121': 'Mua sắm', 'LS161': 'Mua sắm',
    'LS132': 'Mua sắm', 'LS600': 'Mua sắm', 'LS135': 'Sản xuất', 'LS129': 'Sản xuất', 'LS126': 'Hội họp', 'LS162': 'Hội họp',
    'LS130': 'Hội họp', 'LS99': 'Văn phòng', 'LS118': 'Văn phòng', 'LS138': 'Văn phòng',
}

def num(lid):
    return int(re.sub(r'\D', '', lid))

lessons, seen = [], {}
def add(r, cat, link):
    lid = r['Lesson_ID'].strip()
    name = clean(r['Lesson'])
    if lid in seen:  # the CSV reuses a few IDs: merge the names
        if name.lower() not in seen[lid]['name'].lower():
            seen[lid]['name'] += ' / ' + name
        return
    item = {'id': lid, 'cat': cat, 'name': name, 'days': int(r['Time_to_learn'] or 1),
            'diff': float(r.get('Difficulty') or 0), 'comps': lesson_comps.get(lid, []), 'pre': pre.get(lid, [])}
    if link:
        item['link'] = link
    seen[lid] = item
    lessons.append(item)

for r in rows('Grammar.csv'):
    add(r, 'grammar', grammar_link(num(r['Lesson_ID'])))
for r in rows('Listening_Skill.csv'):
    if 227 <= num(r['Lesson_ID']) <= 262:
        add(r, 'listening', listening_link(num(r['Lesson_ID'])))
for r in rows('Reading_Skill.csv'):
    if 264 <= num(r['Lesson_ID']) <= 288:
        lid = r['Lesson_ID'].strip()
        add(r, 'reading', {'page': 'practice', 'ref': READING_LINK[lid]} if lid in READING_LINK else None)
toeic_ids = {l['id'] for l in lessons}
needed_vocab = {p for l in lessons for p in l['pre']}
for r in rows('Vocabulary.csv'):
    lid = r['Lesson_ID'].strip()
    if lid in needed_vocab:
        add(r, 'vocab', {'page': 'vocab', 'ref': 't:' + VOCAB_TOPIC[lid]} if lid in VOCAB_TOPIC else None)
# keep only prerequisites that exist in this TOEIC subset
ids = {l['id'] for l in lessons}
for l in lessons:
    l['pre'] = [p for p in l['pre'] if p in ids]

data = {
    'source': {
        'title': 'English Test Prep Data: TOEIC, IELTS, TOEFL',
        'author': 'duongduong123',
        'url': 'https://www.kaggle.com/datasets/duongduong123/english-test-prep-data-toeic-ielts-toefl',
        'license': 'Open Database License (ODbL)',
    },
    'levels': [{'cefr': k, 'from': v[0], 'to': v[1]} for k, v in cefr_band.items()],
    'comps': comps,
    'lessons': lessons,
}
out.write_text('// Generated by scripts/build_curriculum.py from a Kaggle dataset (ODbL). Do not edit by hand.\n'
               'export const CURRI = ' + json.dumps(data, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
from collections import Counter
print(out, Counter(l['cat'] for l in lessons), sum(1 for l in lessons if 'link' in l), 'linked')
