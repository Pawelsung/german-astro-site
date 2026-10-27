import test from 'node:test';
import assert from 'node:assert/strict';
import { FUNCTIONS, STAGES, konjunktivExercises } from '../src/data/lesson7-konjunktiv.ts';
import { KONJUNKTIV_VERBS, formExercises, konjunktivForm, pastForm } from '../src/lib/konjunktiv.mjs';

const verb = (infinitive) => KONJUNKTIV_VERBS.find((item) => item.infinitive === infinitive);
const all = (infinitive, form) => [0, 1, 2, 3, 4, 5].map((person) => form(verb(infinitive), person));

// Written out by hand, independent of the stem rules.
test('Konjunktiv II forms match the reference tables', () => {
  assert.deepEqual(all('sein', konjunktivForm), ['wäre', 'wärst', 'wäre', 'wären', 'wärt', 'wären']);
  assert.deepEqual(all('haben', konjunktivForm), ['hätte', 'hättest', 'hätte', 'hätten', 'hättet', 'hätten']);
  assert.deepEqual(all('werden', konjunktivForm), ['würde', 'würdest', 'würde', 'würden', 'würdet', 'würden']);
  assert.deepEqual(all('können', konjunktivForm), ['könnte', 'könntest', 'könnte', 'könnten', 'könntet', 'könnten']);
  assert.deepEqual(all('müssen', konjunktivForm), ['müsste', 'müsstest', 'müsste', 'müssten', 'müsstet', 'müssten']);
  assert.deepEqual(all('dürfen', konjunktivForm), ['dürfte', 'dürftest', 'dürfte', 'dürften', 'dürftet', 'dürften']);
  assert.deepEqual(all('sollen', konjunktivForm), ['sollte', 'solltest', 'sollte', 'sollten', 'solltet', 'sollten']);
  assert.deepEqual(all('wollen', konjunktivForm), ['wollte', 'wolltest', 'wollte', 'wollten', 'wolltet', 'wollten']);
  assert.deepEqual(all('mögen', konjunktivForm), ['möchte', 'möchtest', 'möchte', 'möchten', 'möchtet', 'möchten']);
  assert.deepEqual(all('wissen', konjunktivForm), ['wüsste', 'wüsstest', 'wüsste', 'wüssten', 'wüsstet', 'wüssten']);
  assert.deepEqual(all('kommen', konjunktivForm), ['käme', 'kämst', 'käme', 'kämen', 'kämt', 'kämen']);
  // Duden: https://www.duden.de/konjugation/gehen — gingst/gingt are indicative past forms.
  assert.deepEqual(all('gehen', konjunktivForm), ['ginge', 'gingest', 'ginge', 'gingen', 'ginget', 'gingen']);
  assert.deepEqual(all('geben', konjunktivForm), ['gäbe', 'gäbst', 'gäbe', 'gäben', 'gäbt', 'gäben']);
});

test('Präteritum forms used as distractors are real Präteritum forms', () => {
  assert.deepEqual(all('sein', pastForm), ['war', 'warst', 'war', 'waren', 'wart', 'waren']);
  assert.deepEqual(all('haben', pastForm), ['hatte', 'hattest', 'hatte', 'hatten', 'hattet', 'hatten']);
  assert.deepEqual(all('werden', pastForm), ['wurde', 'wurdest', 'wurde', 'wurden', 'wurdet', 'wurden']);
  assert.deepEqual(all('kommen', pastForm), ['kam', 'kamst', 'kam', 'kamen', 'kamt', 'kamen']);
  assert.deepEqual(all('gehen', pastForm), ['ging', 'gingst', 'ging', 'gingen', 'gingt', 'gingen']);
});

test('form drill: four distinct options, only one right for the person', () => {
  const items = formExercises();
  assert.equal(items.length, KONJUNKTIV_VERBS.length * 6);
  for (const item of items) {
    assert.equal(item.options.length, 4, item.id);
    assert.equal(new Set(item.options).size, 4, item.id);
    assert.equal(item.options[0], konjunktivForm(item.verb, item.person), item.id);
    // ich and er share a form, as do wir and sie; neither may show up as a "wrong" option for the other.
    const sameForm = [0, 1, 2, 3, 4, 5].filter((p) => konjunktivForm(item.verb, p) === item.options[0]);
    for (const option of item.options.slice(1)) {
      assert.ok(!sameForm.some((p) => konjunktivForm(item.verb, p) === option), `${item.id}: ${option}`);
    }
  }
});

test('usage exercises are well formed', () => {
  const stageIds = new Set(STAGES.map((stage) => stage.id));
  const ids = new Set();
  for (const item of konjunktivExercises) {
    assert.ok(!ids.has(item.id), `duplicate ${item.id}`);
    ids.add(item.id);
    assert.ok(stageIds.has(item.stage), item.id);
    assert.equal(item.options.length, 4, item.id);
    assert.equal(new Set(item.options).size, 4, item.id);
    assert.ok(item.trans && item.explain, item.id);
    if (item.stage === 'function') {
      assert.deepEqual([...item.options].sort(), [...FUNCTIONS].sort(), item.id);
      assert.ok(!item.sentence.includes('___'), item.id);
    } else if (item.stage === 'transform') {
      assert.ok(item.fact && !item.sentence, item.id);
    } else {
      assert.equal(item.sentence.split('___').length, 2, `${item.id} needs one blank`);
    }
  }
});
