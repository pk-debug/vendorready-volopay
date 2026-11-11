import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidISODate, calculateProgress, safeText, validEmail } from '../worker/domain.mjs';

test('dates are real ISO dates, not overflow dates', () => {
  assert.equal(isValidISODate('2026-11-20'), true);
  assert.equal(isValidISODate('2026-02-30'), false);
  assert.equal(isValidISODate('20/11/2026'), false);
});

test('empty checklist is not considered ready', () => {
  assert.equal(calculateProgress([]).status, 'not_started');
  assert.equal(calculateProgress([{is_completed: 1}]).status, 'ready');
  assert.equal(calculateProgress([{is_completed: 1},{is_completed: 0}]).percent, 50);
});

test('text input is trimmed and length restricted', () => {
  assert.equal(safeText('  Supplier  ', 100), 'Supplier');
  assert.equal(safeText('abcdef', 3), 'abc');
});

test('email validation', () => {
  assert.equal(validEmail('demo@example.com'), true);
  assert.equal(validEmail('not-an-email'), false);
});
