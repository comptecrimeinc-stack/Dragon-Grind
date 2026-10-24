import { describe, expect, it } from 'vitest';
import { decimal2, escapeHtml, formatAdventure, formatDuration, formatNumber, plural } from './format';

describe('formatNumber', () => {
  it('garde les petits nombres lisibles', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(7.5)).toBe('7,5');
    expect(formatNumber(999.9)).toBe('999');
  });

  it('utilise les suffixes français', () => {
    expect(formatNumber(1500)).toBe('1,5 k');
    expect(formatNumber(2_000_000)).toBe('2 M');
    expect(formatNumber(3.25e9)).toBe('3,25 Md');
  });

  it('passe en notation scientifique au-delà des suffixes', () => {
    expect(formatNumber(1.5e45)).toBe('1,50e45');
  });

  it('gère les valeurs spéciales et négatives', () => {
    expect(formatNumber(Infinity)).toBe('∞');
    expect(formatNumber(NaN)).toBe('0');
    expect(formatNumber(-1500)).toBe('−1,5 k');
  });
});

describe('utilitaires de texte', () => {
  it('accorde le pluriel', () => {
    expect(plural(1, 'braise')).toBe('1 braise');
    expect(plural(3, 'braise')).toBe('3 braises');
  });

  it('formate les durées et les décimales', () => {
    expect(formatDuration(3 * 3600 + 5 * 60)).toBe('3 h 5 min');
    expect(formatDuration(600)).toBe('10 min');
    expect(decimal2(1.6)).toBe('1,60');
  });

  it('échappe le HTML', () => {
    expect(escapeHtml('<b a="1">&\'</b>')).toBe('&lt;b a=&quot;1&quot;&gt;&amp;&#39;&lt;/b&gt;');
  });

  it('formate les montants de l’aventure', () => {
    expect(formatAdventure(2_500)).toBe('2,5 k');
    expect(formatAdventure(12_500)).toBe('13 k');
    expect(formatAdventure(-4)).toBe('0');
  });
});
