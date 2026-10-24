import { describe, expect, it } from 'vitest';
import {
  adventureStep,
  applyAdventureOffline,
  assignTeamSlot,
  claimAdventureContract,
  claimBossReward,
  ensureAdventure,
  enemyToughness,
  selectZone,
  teamPower,
  upgradeTeam,
  winEnemy
} from './adventure';
import { recordingFx } from './fx';
import { freshState } from './state';

describe('aventure', () => {
  it('crée une aventure avec l’équipe de départ', () => {
    const S = freshState();
    const a = ensureAdventure(S);
    expect(a.team).toEqual(['fire', 'water', 'nature']);
    expect(teamPower(a)).toBeCloseTo((14 + 11 + 10) * 1.06 * 1.05 * 1.08);
  });

  it('répare une équipe incohérente et accorde Obsidienne achetée', () => {
    const S = freshState();
    const a = ensureAdventure(S);
    a.team = ['ghost'];
    ensureAdventure(S, true);
    expect(a.team).toHaveLength(3);
    expect(a.team.every((id) => a.owned.includes(id))).toBe(true);
    expect(a.owned).toContain('obsidian');
  });

  it('combat automatiquement et ouvre le boss après dix victoires', () => {
    const S = freshState();
    const a = ensureAdventure(S);
    const fx = recordingFx();
    let steps = 0;
    while (!a.pendingBoss && steps++ < 1000) adventureStep(a, fx, Date.now(), () => 0.9);
    expect(a.kills).toBe(10);
    expect(a.unlocked).toBe(2);
    adventureStep(a, fx);
    expect(a.kills).toBe(10); // en pause tant que la récompense n'est pas choisie
    expect(claimBossReward(a, 1, fx)).toBe(true);
    expect(a.fragments).toBe(20);
    expect(a.bossWins).toBe(1);
  });

  it('recrute Volt en atteignant la quatrième zone', () => {
    const S = freshState();
    const a = ensureAdventure(S);
    a.unlocked = 3;
    a.zone = 2;
    a.zoneKills = 9;
    winEnemy(a, recordingFx(), Date.now(), () => 1);
    expect(a.owned).toContain('storm');
  });

  it('renforce l’équipe contre or et matériaux', () => {
    const S = freshState();
    const a = ensureAdventure(S);
    expect(upgradeTeam(a, recordingFx())).toBe(true);
    expect(a.levels.fire).toBe(2);
    expect(a.gold).toBe(500 - 80);
  });

  it('change de zone et d’équipe', () => {
    const S = freshState();
    const a = ensureAdventure(S);
    expect(selectZone(a, 3)).toBe(false);
    expect(selectZone(a, 0)).toBe(true);
    expect(assignTeamSlot(a, 0, 'storm')).toBe(false);
    expect(assignTeamSlot(a, 0, 'nature')).toBe(true);
    expect(enemyToughness(0)).toBe(18);
  });

  it('réclame les contrats et le bonus 4/5', () => {
    const S = freshState();
    const a = ensureAdventure(S);
    const now = Date.now();
    const fx = recordingFx();
    selectZone(a, 0, now); // explore
    upgradeTeam(a, fx, now);
    a.daily.progress.kills = 12;
    a.daily.progress.eggs = 1;
    for (const id of ['kills', 'upgrades', 'explore', 'eggs']) expect(claimAdventureContract(a, id, fx, now)).toBe(true);
    expect(a.daily.claimed.bonus).toBe(1);
    expect(claimAdventureContract(a, 'boss', fx, now)).toBe(false);
  });

  it('plafonne les gains hors ligne à huit heures', () => {
    const S = freshState();
    const a = ensureAdventure(S, false, 1);
    const day = applyAdventureOffline(a, 24 * 3600 * 1000);
    a.lastSeen = 1;
    const eight = applyAdventureOffline(a, 8 * 3600 * 1000 + 1);
    expect(day.gold).toBe(eight.gold);
    expect(eight.materials).toBe(16);
  });
});
