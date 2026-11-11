const DAY = 86400000;
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error('Invalid date');
  const ms = Date.parse(value + 'T00:00:00Z');
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== value) throw Error('Invalid date');
  return ms;
}
function iso(ms) { return new Date(ms).toISOString().slice(0, 10); }
function integer(n, min, max) {
  if (!Number.isSafeInteger(n) || n < min || n > max) throw Error('Invalid day count');
}
export function isWorkingDay(value, holidays = []) {
  const day = new Date(date(value)).getUTCDay();
  return day !== 0 && day !== 6 && !holidays.includes(value);
}
export function shiftWorkingDays(value, offset, holidays = []) {
  integer(offset, -10000, 10000);
  let ms = date(value), remaining = Math.abs(offset), attempts = 0;
  while (remaining) {
    if (++attempts > 100000) throw Error('Working calendar search limit');
    ms += Math.sign(offset) * DAY;
    const next = iso(ms);
    date(next);
    if (isWorkingDay(next, holidays)) remaining--;
  }
  return iso(ms);
}
export function finishDate(step, holidays = []) {
  integer(step.duration, 1, 10000);
  return shiftWorkingDays(step.start, step.duration - 1, holidays);
}
export function validateSchedule(steps, dependencies = [], holidays = []) {
  const map = new Map(steps.map(s => [s.id, s]));
  if (map.size !== steps.length) throw Error('Duplicate step ID');
  for (const s of steps) {
    if (typeof s.id !== 'string' || !s.id || typeof s.name !== 'string' || !s.name.trim() || typeof s.locked !== 'boolean') throw Error('Invalid step');
    finishDate(s, holidays);
  }
  const edges = new Map(steps.map(s => [s.id, []]));
  const offsets = { 'same-day': 0, 'next-working-day': 1, 'previous-working-day': -1 };
  for (const d of dependencies) {
    if (!map.has(d.before) || !map.has(d.after) || !Object.hasOwn(offsets, d.relation)) throw Error('Invalid dependency');
    edges.get(d.before).push(d.after);
  }
  const visited = new Set(), active = new Set();
  function visit(id) {
    if (active.has(id)) throw Error('Dependency cycle');
    if (visited.has(id)) return;
    active.add(id);
    for (const next of edges.get(id)) visit(next);
    active.delete(id); visited.add(id);
  }
  for (const id of map.keys()) visit(id);
  for (const d of dependencies) {
    if (map.get(d.after).start !== shiftWorkingDays(map.get(d.before).start, offsets[d.relation], holidays)) throw Error('Dependency conflict');
  }
}
export function previewMove(steps, { id, offset, scope, selected = [] }, dependencies = [], holidays = []) {
  validateSchedule(steps, dependencies, holidays);
  integer(offset, -10000, 10000);
  const index = steps.findIndex(s => s.id === id);
  if (index < 0 || !['only', 'following', 'selected'].includes(scope)) throw Error('Invalid move');
  if (selected.some(key => !steps.some(s => s.id === key))) throw Error('Unknown selected step');
  const ids = new Set(scope === 'only' ? [id] : scope === 'following' ? steps.slice(index).map(s => s.id) : selected);
  if (!ids.has(id)) throw Error('Moved step must be selected');
  const result = steps.map(s => {
    const start = ids.has(s.id) ? shiftWorkingDays(s.start, offset, holidays) : s.start;
    if (start !== s.start && s.locked) throw Error('Locked step: ' + s.id);
    return { ...s, start };
  });
  validateSchedule(result, dependencies, holidays);
  return result;
}
export function countDays(start, through, mode = 'calendar', holidays = []) {
  const first = date(start), last = date(through);
  if (last < first || last - first > 36525 * DAY || !['calendar', 'working'].includes(mode)) throw Error('Invalid date range or mode');
  let count = 0;
  for (let ms = first; ms <= last; ms += DAY) if (mode === 'calendar' || isWorkingDay(iso(ms), holidays)) count++;
  return count;
}
export function calculateDuc(allowed, actual) {
  integer(allowed, 0, 36525); integer(actual, 0, 36525);
  const value = allowed - actual;
  return { value, tone: value < 0 ? 'green' : value > 0 ? 'red' : 'neutral' };
}
