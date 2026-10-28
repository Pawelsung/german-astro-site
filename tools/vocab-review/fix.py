"""Apply review fixes to 完整單字總整理_新版校訂補充.json.
Usage: python3 -I fix.py <in.json> <examples.json> <out_full.json> <out_site.json> <out_log.json>
"""
import json, re, sys, copy, collections

src, ex_path, out_full, out_site, out_log = sys.argv[1:6]
data = json.load(open(src))
examples = json.load(open(ex_path))
plurals = dict(l.strip().split(' ', 1) for l in open(ex_path.replace('examples.json', 'plurals.txt')) if l.strip())
log = collections.defaultdict(list)

def note(w, field, old, new, why):
    w.setdefault('review', {}).setdefault('siteFixes', []).append({'field': field, 'old': old, 'new': new, 'reason': why})
    log[why].append(f"{w.get('article') or ''} {w['word']}".strip())

# ---- 1. word / article / pos fixes -------------------------------------
WORD_FIX = {
    # id: (article, word, translationZh or None, pos or None, reason)
    'kinetic sculpture': ('die', 'kinetische Skulptur', '動態雕塑', 'noun', '英文術語改為德文'),
    'moire pattern': ('das', 'Moiré-Muster', '摩爾紋', 'noun', '英文術語改為德文'),
    'N20 motor': ('der', 'N20-Motor', 'N20 微型馬達', 'noun', '英文術語改為德文'),
    'eye tracking': ('das', 'Eye-Tracking', '眼動追蹤', 'noun', '英文術語改為德文'),
    'complex gears': ('das', 'Zahnradgetriebe', '齒輪組；齒輪傳動裝置', 'noun', '英文術語改為德文'),
    'DC accelerator': ('der', 'Gleichstrombeschleuniger', '直流加速器', 'noun', '英文術語改為德文'),
    'nuts': ('die', 'Mutter', '螺帽（機械零件；拼法與「母親」相同）', 'noun', '英文術語改為德文'),
    'Berg steigen': (None, 'auf einen Berg steigen', '爬山', None, '片語改為自然說法'),
    'zwei bis dreimal pro Woche': (None, 'zwei- bis dreimal pro Woche', None, None, '拼寫修正'),
    'Mathe': ('die', 'Mathe', None, None, '補冠詞'),
}
POS_FIX = {'obwohl': 'conjunction', 'fürs': 'contraction', 'falls': 'conjunction'}
MEANING_FIX = {
    'gleich': '馬上；立刻；一樣的',
    'mal': '（語氣詞）一下；次；乘以',
    'polnisch': '波蘭的；波蘭語的',
    'Franken': '瑞士法郎（貨幣）；弗蘭肯地區（依語境）',
    'geboren sein': '出生',
    'das Frühlingsfest': '春季節慶；（華人）春節',
    'das Objekt': '受詞；物體',
    'ab': '從……起；起價（格依用法而定）',
    'der Krimi': '推理／犯罪作品',
    'das Geld': '錢',
}
# plural forms that are not normal usage
PLURAL_DROP = {'Kleidung', 'Begabtenerziehung', 'Begabtenförderung', 'Hochbegabtenförderung', 'Physikforschung',
               'Mobbing-Prävention', 'Belebung', 'Flucht', 'Werbung', 'Alltag', 'Regensachen', 'Deutschen', 'Ferien',
               'Meeresfrüchte'}

# ---- 2. verb forms ---------------------------------------------------------
VERB_FIX = {
    'fahren': dict(auxiliary='sein', perfekt_3sg='ist gefahren（帶受詞時 hat gefahren）'),
    'wandern': dict(auxiliary='sein', perfekt_3sg='ist gewandert'),
    'hängen': dict(praeteritum_3sg='hing（不及物）／hängte（及物）', participleII='gehangen／gehängt', auxiliary='haben',
                   perfekt_3sg='hat gehangen（掛著）／hat gehängt（掛上）'),
    'bummeln': dict(praeteritum_3sg='bummelte', participleII='gebummelt', auxiliary='sein', perfekt_3sg='ist gebummelt'),
    'reiten': dict(praeteritum_3sg='ritt', participleII='geritten', auxiliary='sein', perfekt_3sg='ist geritten（不強調移動時也可 hat）'),
    'planschen': dict(praeteritum_3sg='planschte', participleII='geplanscht', auxiliary='haben', perfekt_3sg='hat geplanscht'),
    'tauchen': dict(praeteritum_3sg='tauchte', participleII='getaucht', auxiliary='sein', perfekt_3sg='ist getaucht（也常用 hat getaucht）'),
    'verbrennen': dict(praeteritum_3sg='verbrannte', participleII='verbrannt', auxiliary='haben／sein',
                       perfekt_3sg='hat verbrannt（燒掉某物）／ist verbrannt（被燒毀）'),
    'sich Sorgen machen um': dict(participleII='gemacht', praeteritum_3sg='machte sich Sorgen um'),
    'sich testen lassen': dict(participleII='testen lassen（雙不定式）'),
}

# ---- 3. meaning cleanup ----------------------------------------------------
EDITORIAL = re.compile(r'（[^（）]*(原文|原筆記|原註|原句|應校正|依原文|不是「|並非|未必|疑似|語境不足|應區分)[^（）]*）')
GRAMMAR_NOTE = re.compile(r'（((過去式|過去分詞|ist |hat |er wirft|及物|不及物|erkannte)[^（）]*|gestellt|gelegt|gelegen|gestanden|gesessen)）')
SOURCE_NOTE = re.compile(r'原文|原筆記|原註|原句|依原文|應校正|疑似|語境不足|應區分')
GRAMMAR_ONLY = re.compile(r'^(過去式|過去分詞|ist |hat |er wirft|erkannte|gestellt|gelegt|gelegen|gestanden|gesessen)')
PLURAL_NOTE = re.compile(r'（複數(?: ([^（）]+))?）')

def clean_meaning(w):
    t = w.get('translationZh') or ''
    notes = []
    for m in EDITORIAL.finditer(t): notes.append(m.group(0)[1:-1])
    t = EDITORIAL.sub('', t)
    for m in GRAMMAR_NOTE.finditer(t): notes.append(m.group(0)[1:-1])
    t = GRAMMAR_NOTE.sub('', t)
    pm = PLURAL_NOTE.search(t)
    if pm:
        if pm.group(1) and not w.get('plural'): w['plural'] = 'die ' + pm.group(1)
        if not pm.group(1): notes.append('只有複數形' if w.get('pos') == 'noun' else '複數')
        t = PLURAL_NOTE.sub('', t)
    segs, seen = [], set()
    for s in re.split('[；;]', t):
        s = s.strip()
        if s and s not in seen: seen.add(s); segs.append(s)
    # drop a segment fully contained in a longer one (e.g. 期待…… vs 期待（未來的事）)
    def covered(s, o):
        base = s.rstrip('…')
        return s != o and base and o.startswith(base) and o[len(base):][:1] in ('（', '…')
    segs = [s for s in segs if not any(covered(s, o) for o in segs)] or segs
    # notes about the handwritten source stay in translationZh only; verb-form notes are
    # already shown from practice when the paradigm is filled in
    has_forms = bool((w.get('practice') or {}).get('perfekt_3sg'))
    notes = [n for n in notes if not SOURCE_NOTE.search(n) and not (has_forms and GRAMMAR_ONLY.match(n))]
    return '；'.join(segs), notes

for lesson in data['lessons']:
    for w in lesson['vocabulary']:
        word = w['word']
        if word in WORD_FIX:
            art, nw, nm, npos, why = WORD_FIX[word]
            w['originalWord'] = word
            note(w, 'word', [w.get('article'), word], [art, nw], why)
            w['article'], w['word'] = art, nw
            if nm: w['translationZh'] = nm
            if npos: w['pos'] = npos
            if nw == 'Mutter': w['plural'] = 'die Muttern'
            if art and w.get('practice', {}).get('type') != 'noun':
                w['practice'] = {'type': 'noun', 'article': art, 'practicePromptZh': '練習：冠詞 + 單數、複數、Akkusativ/Dativ 例句。'}
        if word in POS_FIX and w['pos'] != POS_FIX[word]:
            note(w, 'pos', w['pos'], POS_FIX[word], '詞性修正'); w['pos'] = POS_FIX[word]
        key = f"{w.get('article')} {w['word']}" if w.get('article') else w['word']
        for k in (key, w['word']):
            if k in MEANING_FIX and w.get('translationZh') != MEANING_FIX[k]:
                note(w, 'translationZh', w.get('translationZh'), MEANING_FIX[k], '中文釋義修正')
                w['translationZh'] = MEANING_FIX[k]
                break
        if w['pos'] == 'noun' and w['word'] in PLURAL_DROP and w.get('plural'):
            note(w, 'plural', w['plural'], None, '移除不常用或同形的複數')
            w['plural'] = None
        if w['pos'] == 'verb' and w['word'] in VERB_FIX:
            pr = w.setdefault('practice', {})
            for f, v in VERB_FIX[w['word']].items():
                if pr.get(f) != v: note(w, 'practice.' + f, pr.get(f), v, '補齊／修正動詞形態'); pr[f] = v
        if w['word'] == 'passieren' and isinstance(w.get('practice', {}).get('present'), dict):
            note(w, 'practice.present', '六人稱都填 es passiert', '改為用法說明', '修正現在式表')
            w['practice'].pop('present'); w['practice']['usageNoteZh'] = '多用第三人稱：es passiert／etwas ist passiert。'
        # meaning used by the site (original translationZh is kept as-is)
        if w.get('translationZh'):
            m, notes = clean_meaning(w)
            if m != w['translationZh']:
                w['meaning'] = m
                log['中文釋義清理（重複、複數與校訂註記移出）'].append(key)
            if notes:
                pr = w.setdefault('practice', {})
                old = pr.get('usageNoteZh')
                pr['usageNoteZh'] = '；'.join(([old] if old else []) + notes)
        sid = w['id'][-4:]
        if sid in plurals and w['pos'] == 'noun' and not w.get('plural'):
            w['plural'] = 'die ' + plurals[sid]
            if isinstance(w.get('practice'), dict) and w['practice'].get('type') == 'noun': w['practice']['plural'] = w['plural']
            w['review']['flags'] = [f for f in w['review'].get('flags', []) if f != 'plural_not_attested']
            note(w, 'plural', None, w['plural'], '補上名詞複數')
        if w['word'] == 'Mathe' and isinstance(w.get('practice'), dict): w['practice']['article'] = 'die'
        # examples
        origin = w.get('review', {}).get('fieldOrigins', {}).get('exampleDe')
        if sid in examples and origin in ('authored_template', 'authored_metalinguistic'):
            de, zh = examples[sid]
            note(w, 'exampleDe', w.get('exampleDe'), de, '樣板例句改寫為實際語境例句')
            w['exampleDe'], w['exampleZh'] = de, zh
            w['review']['fieldOrigins'] = {'exampleDe': 'authored_reviewed_example', 'exampleZh': 'authored_reviewed_example'}

data['meta']['updatedAt'] = '2026-10-28'
data['meta']['siteReview'] = {
    'date': '2026-10-28',
    'summaryZh': '網站上架前複核：英文術語改德文、補冠詞與動詞形態、清理中文釋義重複與校訂註記（另存 meaning，原 translationZh 不動）、158 筆常用詞樣板例句改寫為實際語境例句。',
    'changes': {k: len(v) for k, v in log.items()},
}
json.dump(data, open(out_full, 'w'), ensure_ascii=False, indent=2)
open(out_full, 'a').write('\n')

# ---- site version ------------------------------------------------------
KEEP = ['id', 'article', 'word', 'plural', 'meaning', 'translationZh', 'exampleDe', 'exampleZh', 'pos', 'practice']
site_lessons, dropped, no_example = [], [], 0
for lesson in data['lessons']:
    if lesson['lessonId'] == 'notes_review':
        dropped += [w['word'] for w in lesson['vocabulary']]; continue
    vocab = []
    for w in lesson['vocabulary']:
        if not w.get('translationZh'): dropped.append(w['word']); continue
        s = {k: copy.deepcopy(w[k]) for k in KEEP if w.get(k) not in (None, '', {}, [])}
        if 'meaning' in s: s.pop('translationZh')
        origin = w.get('review', {}).get('fieldOrigins', {}).get('exampleDe')
        if origin in ('authored_template', 'authored_metalinguistic'):
            s.pop('exampleDe', None); s.pop('exampleZh', None); no_example += 1
        if isinstance(s.get('practice'), dict):
            s['practice'].pop('practicePromptZh', None)
            if not s['practice']: s.pop('practice')
        vocab.append(s)
    site_lessons.append({'lessonId': lesson['lessonId'], 'title': lesson['title'], 'lessonTag': lesson['lessonTag'], 'vocabulary': vocab})
count = sum(len(l['vocabulary']) for l in site_lessons)
site = {
    'meta': {'name': '課程筆記單字（依出現頻率）', 'source': data['meta']['source'], 'updatedAt': '2026-10-28', 'itemCount': count,
             'noteZh': '依筆記中出現次數分組，不是課本課次。9 筆無法辨識的待確認詞條未收錄；樣板例句未放上網站。'},
    'lessons': site_lessons,
}
json.dump(site, open(out_site, 'w'), ensure_ascii=False, indent=2)
open(out_site, 'a').write('\n')
log_out = {'changes': log, 'droppedFromSite': dropped, 'siteCount': count, 'siteWordsWithoutExample': no_example}
json.dump(log_out, open(out_log, 'w'), ensure_ascii=False, indent=1)
print('site', count, 'dropped', len(dropped), 'noExample', no_example)
for k, v in log.items(): print(f'{k}: {len(v)}')
