import test from 'node:test';
import assert from 'node:assert/strict';
import { isWorkingDay, shiftWorkingDays, finishDate, validateSchedule, previewMove, countDays, calculateDuc } from '../src/domain/scheduling.mjs';
const sample = () => [
  { id: 'a', name: 'Excavation', start: '2026-11-13', duration: 1, locked: false },
  { id: 'b', name: 'Footings', start: '2026-11-16', duration: 2, locked: false }
];
const next = [{ before: 'a', after: 'b', relation: 'next-working-day' }];
test('weekends are not working days', () => assert.equal(isWorkingDay('2026-11-14'), false));
test('holidays are not working days', () => assert.equal(isWorkingDay('2026-11-16', ['2026-11-16']), false));
test('forward shift skips weekend', () => assert.equal(shiftWorkingDays('2026-11-13', 1), '2026-11-16'));
test('backward shift skips weekend', () => assert.equal(shiftWorkingDays('2026-11-16', -1), '2026-11-13'));
test('shift skips holiday', () => assert.equal(shiftWorkingDays('2026-11-13', 1, ['2026-11-16']), '2026-11-17'));
test('invalid date rejected', () => assert.throws(() => isWorkingDay('2026-02-30')));
test('fractional offset rejected', () => assert.throws(() => shiftWorkingDays('2026-11-13', 0.5)));
test('duration includes start', () => assert.equal(finishDate({ ...sample()[0], duration: 2 }), '2026-11-16'));
test('zero duration rejected', () => assert.throws(() => finishDate({ ...sample()[0], duration: 0 })));
test('following move preserves input', () => {
  const steps = sample(), original = structuredClone(steps);
  const result = previewMove(steps, { id: 'a', offset: 1, scope: 'following' }, next);
  assert.deepEqual(result.map(s => s.start), ['2026-11-16', '2026-11-17']);
  assert.deepEqual(steps, original);
});
test('lock blocks entire move without mutation', () => {
  const steps = sample(); steps[1].locked = true;
  const original = structuredClone(steps);
  assert.throws(() => previewMove(steps, { id: 'a', offset: 1, scope: 'following' }), /Locked/);
  assert.deepEqual(steps, original);
});
test('selected mode moves only selection', () => assert.equal(previewMove(sample(), { id: 'a', offset: 1, scope: 'selected', selected: ['a'] })[1].start, '2026-11-16'));
test('selected mode must include target', () => assert.throws(() => previewMove(sample(), { id: 'a', offset: 1, scope: 'selected', selected: ['b'] })));
test('unknown target rejected', () => assert.throws(() => previewMove(sample(), { id: 'missing', offset: 1, scope: 'only' })));
test('dependency-breaking move rejected', () => assert.throws(() => previewMove(sample(), { id: 'a', offset: 1, scope: 'only' }, next), /Dependency conflict/));
test('same-day dependency accepted', () => { const steps = sample(); steps[1].start = steps[0].start; validateSchedule(steps, [{ ...next[0], relation: 'same-day' }]); });
test('previous-working-day dependency accepted', () => validateSchedule(sample(), [{ before: 'b', after: 'a', relation: 'previous-working-day' }]));
test('dependency cycle rejected', () => assert.throws(() => validateSchedule(sample(), [next[0], { before: 'b', after: 'a', relation: 'same-day' }]), /cycle/));
test('duplicate IDs rejected', () => assert.throws(() => validateSchedule([sample()[0], sample()[0]]), /Duplicate/));
test('inclusive calendar count', () => assert.equal(countDays('2026-11-13', '2026-11-16'), 4));
test('inclusive working count excludes holidays', () => assert.equal(countDays('2026-11-13', '2026-11-16', 'working', ['2026-11-16']), 1));
test('negative date range rejected', () => assert.throws(() => countDays('2026-11-16', '2026-11-13')));
test('literal DUC formula and colors', () => {
  assert.deepEqual(calculateDuc(100, 80), { value: 20, tone: 'red' });
  assert.deepEqual(calculateDuc(100, 120), { value: -20, tone: 'green' });
  assert.deepEqual(calculateDuc(100, 100), { value: 0, tone: 'neutral' });
});
test('negative DUC input rejected', () => assert.throws(() => calculateDuc(-1, 10)));
