const db = require('../database/db');
const charactersData = require('../data/characters.json');
const enemiesData = require('../data/enemies.json');

class CombatEngine {
  constructor(userId, bossId, difficultyLevel = 60) {
    this.userId = userId;
    this.bossId = bossId;
    this.difficultyLevel = difficultyLevel;

    this.userTeamData = db.getUserTeam(userId);
    this.userInv = db.getUserInventory(userId);

    this.sp = 3;
    this.maxSp = 5;
    this.turn = 1;
    this.maxTurns = 30;
    this.isFinished = false;
    this.winner = null;
    this.logs = [];

    this.initBattle();
  }

  initBattle() {
    const baseEnemy = enemiesData.find(e => e.id === this.bossId) || enemiesData[0];

    const lvlDiff = this.difficultyLevel - 1;
    const hpFactor = 1.0 + (this.difficultyLevel / 80) * 4.5;
    const atkFactor = 1.0 + lvlDiff * 0.015;
    const defFactor = 1.0 + lvlDiff * 0.008;

    this.enemy = {
      ...baseEnemy,
      level: this.difficultyLevel,
      maxHp: Math.round(baseEnemy.hp * hpFactor),
      currentHp: Math.round(baseEnemy.hp * hpFactor),
      atk: Math.round(baseEnemy.atk * atkFactor),
      def: Math.round(baseEnemy.def * defFactor),
      toughness: 100,
      maxToughness: 100,
      weaknesses: baseEnemy.weakness || ["Fire", "Quantum"],
      isAlive: true
    };

    const slots = [this.userTeamData.slot1, this.userTeamData.slot2, this.userTeamData.slot3, this.userTeamData.slot4];

    this.team = slots.map((charId, idx) => {
      const baseChar = charactersData.find(c => c.id === charId) || charactersData[0];
      const invRecord = this.userInv.find(i => i.char_id === charId) || {
        level: 1,
        weapon_level: 1,
        basic_lvl: 1,
        skill_lvl: 1,
        ult_lvl: 1,
        eidolon: 0,
        light_cone: 'In the Night (5★)',
        artifact_set: 'Bộ Thiện Xạ Trường Hoang'
      };

      const userWpns = db.getUserWeapons(this.userId);
      const equippedWpn = userWpns.find(w => w.char_id === charId) || { level: invRecord.weapon_level || 1, superimpose: 1 };
      const wpnLvl = Math.max(invRecord.weapon_level || 1, equippedWpn.level || 1);
      const superimpose = equippedWpn.superimpose || 1;

      const lvlScale = 1.0 + (invRecord.level - 1) * 0.08;
      const wpnScale = 1.0 + (wpnLvl - 1) * 0.05;
      const superimposeBonus = 1.0 + (superimpose - 1) * 0.08;

      let baseAtk = Math.round(baseChar.baseAtk * lvlScale * wpnScale * superimposeBonus);
      let baseHp = Math.round(baseChar.baseHp * lvlScale * wpnScale);
      let baseDef = Math.round(baseChar.baseDef * lvlScale * wpnScale);

      // Relic Set Bonus (+15% ATK)
      if (invRecord.artifact_set) {
        baseAtk = Math.round(baseAtk * 1.15);
      }

      const eidolonBonus = 1.0 + invRecord.eidolon * 0.05;
      const finalAtk = Math.round(baseAtk * eidolonBonus);
      const finalHp = Math.round(baseHp * eidolonBonus);

      return {
        slot: idx + 1,
        id: baseChar.id,
        name: baseChar.name,
        element: baseChar.element,
        path: baseChar.path,
        level: invRecord.level,
        maxHp: finalHp,
        currentHp: finalHp,
        atk: finalAtk,
        def: baseDef,
        speed: baseChar.speed,
        maxEnergy: baseChar.maxEnergy || 100,
        currentEnergy: Math.floor((baseChar.maxEnergy || 100) * 0.5),
        shield: 0,
        eidolon: invRecord.eidolon,
        basicLvl: invRecord.basic_lvl || 1,
        skillLvl: invRecord.skill_lvl || 1,
        ultLvl: invRecord.ult_lvl || 1,
        skills: baseChar.skills,
        icon: baseChar.icon,
        critRate: 0.25 + (superimpose - 1) * 0.03,
        critDmg: 0.60 + (superimpose - 1) * 0.05,
        isAlive: true,
        actionValue: Math.round(10000 / baseChar.speed)
      };
    });

    this.currentActor = null;
    this.determineNextActor();
  }

  determineNextActor() {
    if (this.isFinished) return;

    const aliveTeam = this.team.filter(c => c.isAlive);
    if (aliveTeam.length === 0) {
      this.isFinished = true;
      this.winner = 'enemy';
      this.logs.push(`💀 **Toàn bộ đội hình của bạn đã gục ngã! Thất bại trong thử thách.**`);
      return;
    }

    if (!this.enemy.isAlive) {
      this.isFinished = true;
      this.winner = 'player';
      this.logs.push(`🎉 **Kẻ địch ${this.enemy.name} đã bị tiêu diệt hoàn toàn! Bạn chiến thắng!**`);
      this.handleVictoryRewards();
      return;
    }

    const actors = [...aliveTeam];
    if (this.enemy.isAlive) {
      if (!this.enemy.actionValue) {
        this.enemy.actionValue = Math.round(10000 / this.enemy.speed);
      }
      actors.push(this.enemy);
    }

    actors.sort((a, b) => a.actionValue - b.actionValue);
    this.currentActor = actors[0];
  }

  advanceToNextTurn() {
    if (this.isFinished) return;

    const minAv = this.currentActor.actionValue;

    this.team.forEach(c => {
      if (c.isAlive) c.actionValue -= minAv;
    });

    if (this.enemy.isAlive) {
      this.enemy.actionValue -= minAv;
    }

    this.turn++;
    if (this.turn > this.maxTurns) {
      this.isFinished = true;
      this.winner = 'draw';
      this.logs.push(`⏳ **Hết 30 vòng đấu! Trận chiến kết thúc với tỷ số Hòa.**`);
      return;
    }

    this.determineNextActor();
  }

  handleVictoryRewards() {
    const user = db.getUser(this.userId);
    user.materials.char_exp_book = (user.materials.char_exp_book || 0) + 6;
    user.materials.weapon_exp_crystal = (user.materials.weapon_exp_crystal || 0) + 6;
    user.materials.artifact_dust = (user.materials.artifact_dust || 0) + 12;

    const expResult = db.addPlayerExp(this.userId, 450);

    const relicSets = [
      { name: 'Bộ Thiên Tài Kim Loại', slot: 'Head' },
      { name: 'Bộ Thợ Lặn Ranh Ma', slot: 'Hands' },
      { name: 'Bộ Chim Ưng Ranh Ma', slot: 'Body' },
      { name: 'Bộ Vệ Binh Băng Tuyết', slot: 'Feet' }
    ];

    const relicSet = relicSets[Math.floor(Math.random() * relicSets.length)];
    const mainStats = ['ATK%', 'HP%', 'DEF%', 'CRIT Rate%', 'CRIT DMG%', 'SPD'];
    const chosenMainStat = mainStats[Math.floor(Math.random() * mainStats.length)];
    const mainVal = chosenMainStat.includes('%') ? (5.0 + Math.random() * 3.0) : (10 + Math.floor(Math.random() * 5));

    const subPool = ['ATK%', 'DEF%', 'HP%', 'CRIT Rate%', 'CRIT DMG%', 'SPD'];
    const subStats = [];
    while (subStats.length < 3) {
      const pick = subPool[Math.floor(Math.random() * subPool.length)];
      if (!subStats.some(s => s.name === pick) && pick !== chosenMainStat) {
        const val = pick.includes('%') ? (2.5 + Math.random() * 2.0) : (2 + Math.floor(Math.random() * 3));
        subStats.push({ name: pick, value: parseFloat(val.toFixed(1)) });
      }
    }

    const droppedArtifact = db.addArtifact(this.userId, {
      setName: `${relicSet.name} (5★)`,
      slot: 'Head',
      mainStat: chosenMainStat,
      mainValue: parseFloat(mainVal.toFixed(1)),
      subStats: subStats
    });

    this.logs.push(`🎁 **PHẦN THƯỞNG CHIẾN THẮNG**:`);
    this.logs.push(`- +450 EXP Thám Hiểm ${expResult.leveledUp ? `🎉 **LÊN CẤP ${expResult.newLevel}!** (+300 Jades)` : ''}`);
    this.logs.push(`- +6 Sách EXP | +6 Tinh Thể Vũ Khí | +12 Bụi Di Vật`);
    this.logs.push(`- 🛡️ Rớt Di Vật 5★: **${droppedArtifact.setName}** (${droppedArtifact.mainStat} +${droppedArtifact.mainValue})!`);
  }

  // REBALANCED HSR DAMAGE MITIGATION FORMULA
  calculateDamage(attackerAtk, defenderDef, multiplier, critRate = 0.25, critDmg = 0.60) {
    const isCrit = Math.random() < critRate;
    const critMult = isCrit ? (1 + critDmg) : 1.0;
    const rawDmg = attackerAtk * multiplier * critMult;
    const defMitigation = 1000 / (1000 + defenderDef);
    const variance = 0.95 + Math.random() * 0.1;
    return {
      damage: Math.max(50, Math.floor(rawDmg * defMitigation * variance)),
      isCrit
    };
  }

  executeBasicAttack() {
    if (this.isFinished || this.currentActor === this.enemy) return;

    const char = this.currentActor;
    const skill = char.skills.basic;
    const skillMultiplier = skill.multiplier * (1 + (char.basicLvl - 1) * 0.25);
    const res = this.calculateDamage(char.atk, this.enemy.def, skillMultiplier, char.critRate, char.critDmg);

    this.enemy.currentHp = Math.max(0, this.enemy.currentHp - res.damage);
    if (this.enemy.currentHp === 0) this.enemy.isAlive = false;

    this.sp = Math.min(this.maxSp, this.sp + 1);
    char.currentEnergy = Math.min(char.maxEnergy, char.currentEnergy + skill.energyGain);

    const critTag = res.isCrit ? ' 💥 [CRIT!]' : '';
    this.logs.push(`⚔️ **${char.name}** dùng **${skill.name} (Lv.${char.basicLvl})** gây **${res.damage}** sát thương!${critTag} (+1 SP)`);

    char.actionValue = Math.round(10000 / char.speed);
    this.advanceToNextTurn();
  }

  executeSkill() {
    if (this.isFinished || this.currentActor === this.enemy) return;
    if (this.sp < 1) {
      this.logs.push(`⚠️ Không đủ điểm Chiến kỹ (SP)!`);
      return false;
    }

    const char = this.currentActor;
    const skill = char.skills.skill;
    this.sp -= 1;
    char.currentEnergy = Math.min(char.maxEnergy, char.currentEnergy + skill.energyGain);

    const skillMultiplier = skill.multiplier * (1 + (char.skillLvl - 1) * 0.30);

    if (skill.isHeal) {
      this.team.filter(c => c.isAlive).forEach(ally => {
        const healAmt = Math.floor((char.maxHp * 0.25 + 250) * (1 + (char.skillLvl - 1) * 0.12));
        ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
      });
      this.logs.push(`💚 **${char.name}** dùng **${skill.name} (Lv.${char.skillLvl})** hồi lượng lớn HP toàn đội! (-1 SP)`);
    } else if (skill.isShield) {
      this.team.filter(c => c.isAlive).forEach(ally => {
        ally.shield = Math.floor((char.def * 1.5 + 300) * (1 + (char.skillLvl - 1) * 0.12));
      });
      this.logs.push(`🛡️ **${char.name}** dùng **${skill.name} (Lv.${char.skillLvl})** tạo khiên kiên cố cho toàn đội! (-1 SP)`);
    } else {
      const res = this.calculateDamage(char.atk, this.enemy.def, skillMultiplier, char.critRate + 0.10, char.critDmg + 0.15);
      this.enemy.currentHp = Math.max(0, this.enemy.currentHp - res.damage);
      if (this.enemy.currentHp === 0) this.enemy.isAlive = false;

      const critTag = res.isCrit ? ' 💥 [CRIT!]' : '';
      this.logs.push(`💥 **${char.name}** dùng **${skill.name} (Lv.${char.skillLvl})** gây **${res.damage}** sát thương!${critTag} (-1 SP)`);
    }

    char.actionValue = Math.round(10000 / char.speed);
    this.advanceToNextTurn();
    return true;
  }

  executeUltimate(charSlot) {
    if (this.isFinished) return false;

    const char = this.team.find(c => c.slot === charSlot);
    if (!char || !char.isAlive || char.currentEnergy < char.maxEnergy) {
      return false;
    }

    const ult = char.skills.ultimate;
    char.currentEnergy = 0;
    const ultMultiplier = ult.multiplier * (1 + (char.ultLvl - 1) * 0.35);

    if (ult.isHeal) {
      this.team.filter(c => c.isAlive).forEach(ally => {
        const healAmt = Math.floor((char.maxHp * 0.40 + 500) * (1 + (char.ultLvl - 1) * 0.15));
        ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
      });
      this.logs.push(`✨ **[TUYỆT KỸ] ${char.name} (Lv.${char.ultLvl})** thi triển **${ult.name}** phục hồi HP toàn đội!`);
    } else if (ult.isBuff) {
      this.team.filter(c => c.isAlive).forEach(ally => {
        ally.atk = Math.floor(ally.atk * 1.45);
      });
      this.logs.push(`✨ **[TUYỆT KỸ] ${char.name} (Lv.${char.ultLvl})** thi triển **${ult.name}** tăng 45% ATK toàn đội!`);
    } else {
      const res = this.calculateDamage(char.atk, this.enemy.def, ultMultiplier * 2.2, char.critRate + 0.25, char.critDmg + 0.50);
      this.enemy.currentHp = Math.max(0, this.enemy.currentHp - res.damage);
      if (this.enemy.currentHp === 0) this.enemy.isAlive = false;

      const critTag = res.isCrit ? ' 💥💥 [CHÍ MẠNG TOÀN PHẦN!]' : '';
      this.logs.push(`🌟 **[TUYỆT KỸ] ${char.name} (Lv.${char.ultLvl})** tung **${ult.name}** giáng **${res.damage}** sát thương cực đại!${critTag}`);
    }

    if (!this.enemy.isAlive) {
      this.isFinished = true;
      this.winner = 'player';
      this.logs.push(`🎉 **Kẻ địch ${this.enemy.name} đã bị tiêu diệt! Bạn chiến thắng!**`);
      this.handleVictoryRewards();
    }

    return true;
  }

  executeEnemyTurn() {
    const aliveTeam = this.team.filter(c => c.isAlive);
    if (aliveTeam.length === 0) return;

    const target = aliveTeam[Math.floor(Math.random() * aliveTeam.length)];
    let res = this.calculateDamage(this.enemy.atk, target.def, 1.4, 0.10, 0.30);
    let dmg = res.damage;

    if (target.shield > 0) {
      if (target.shield >= dmg) {
        target.shield -= dmg;
        dmg = 0;
      } else {
        dmg -= target.shield;
        target.shield = 0;
      }
    }

    target.currentHp = Math.max(0, target.currentHp - dmg);
    if (target.currentHp === 0) target.isAlive = false;

    this.logs.push(`⚔️ **${this.enemy.name}** giáng đòn vào **${target.name}** gây **${res.damage}** sát thương!`);

    if (target.currentHp === 0) {
      this.logs.push(`💀 **${target.name}** đã gục ngã!`);
    }

    this.enemy.actionValue = Math.round(10000 / this.enemy.speed);
    this.determineNextActor();
  }
}

module.exports = CombatEngine;
