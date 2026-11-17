import test from 'node:test';
import assert from 'node:assert/strict';
import { countOpen, dueLabel, followUpDraft, leadState, shiftISODate } from './core.mjs';

test('follow-up states include due today, overdue, and upcoming', () => {
  assert.equal(leadState({ followup: '2026-11-15', status: 'New' }, '2026-11-16'), 'overdue');
  assert.equal(leadState({ followup: '2026-11-16', status: 'New' }, '2026-11-16'), 'today');
  assert.equal(leadState({ followup: '2026-11-17', status: 'New' }, '2026-11-16'), 'upcoming');
  assert.equal(dueLabel('2026-11-16', '2026-11-16'), 'Follow up today');
  assert.equal(dueLabel('2026-11-14', '2026-11-16'), '2 days overdue');
});

test('won and closed leads are not included in open workload', () => {
  assert.equal(leadState({ followup: '2026-11-15', status: 'Won' }, '2026-11-16'), 'closed');
  assert.equal(countOpen([
    { followup: '2026-11-15', status: 'New' },
    { followup: '2026-11-16', status: 'Closed' },
  ]), 1);
});

test('date shifting keeps the date local across month boundaries', () => {
  assert.equal(shiftISODate('2026-11-30', 1), '2026-12-01');
  assert.equal(shiftISODate('2026-12-31', 1), '2027-01-01');
});

test('follow-up draft includes the lead and requested project', () => {
  const text = followUpDraft({ name: 'Jordan', need: 'painting' });
  assert.match(text, /Jordan/);
  assert.match(text, /painting/);
});
