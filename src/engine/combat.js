const charactersData = require('../data/characters.json');
const enemiesData = require('../data/enemies.json');
const artifactsData = require('../data/artifacts.json');
const db = require('../database/db');

class BattleSession {
  constructor(userId, teamCharIds, enemyId, options = {}) {
    this.userId = userId;
    const rawEnemy = enemiesData.find(e => e.id === enemyId) || enemiesData[0];
    const userInv = db.getUserInventory(userId);

    // Calculate Average Team Level
    const partyLevels = teamCharIds.map(id => {
      const rec = userInv.find(i => i.char_id === id);
      return rec ? (rec.level || 1) : 1;
    });
    const avgPartyLevel = Math.round(partyLevels.reduce((a, b) => a + b, 0) / partyLevels.length);

    // Level Matchmaking (Boss Level = Avg Party Level + 2, unless manual difficulty is requested)
    const targetEnemyLevel = options.difficultyLevel || (avgPartyLevel + 2);
    const levelScaleFactor = 1.0 + (targetEnemyLevel - 1) * 0.15;

    const scaledMaxHp = Math.floor(rawEnemy.hp * levelScaleFactor);
    const scaledAtk = Math.floor(rawEnemy.atk * levelScaleFactor);
    const scaledDef = Math.floor(rawEnemy.def * levelScaleFactor);

    this.enemy = {
      ...rawEnemy,
      level: targetEnemyLevel,
      currentHp: scaledMaxHp,
      maxHp: scaledMaxHp,
      atk: scaledAtk,
      def: scaledDef,
      currentToughness: rawEnemy.toughness || 100,
      maxToughness: rawEnemy.toughness || 100,
      actionValue: Math.round(10000 / rawEnemy.speed),
      isAlive: true
    };

    this.team = teamCharIds.map((charId, idx) => {
      const charData = charactersData.find(c => c.id === charId) || charactersData[0];
      const invRecord = userInv.find(i => i.char_id === charId) || { level: 1, weapon_level: 1, basic_lvl: 1, skill_lvl: 1, ult_lvl: 1 };

      const charLvl = invRecord.level || 1;
      const wpnLvl = invRecord.weapon_level || 1;

      const maxHp = charData.baseStats.hp + (charLvl - 1) * 40;
      const atk = charData.baseStats.atk + (charLvl - 1) * 18 + (wpnLvl - 1) * 12;
      const def = charData.baseStats.def + (charLvl - 1) * 12;
      const speed = charData.baseStats.speed;

      return {
        ...charData,
        slot: idx + 1,
        level: charLvl,
        weaponLevel: wpnLvl,
        basicLvl: invRecord.basic_lvl || 1,
        skillLvl: invRecord.skill_lvl || 1,
        ultLvl: invRecord.ult_lvl || 1,
        critRate: 0.15, // 15% Base CRIT Rate
        critDmg: 0.50,  // 50% Base CRIT DMG
        currentHp: maxHp,
        maxHp: maxHp,
        atk: atk,
        def: def,
        speed: speed,
        currentEnergy: Math.floor(charData.baseStats.maxEnergy / 2),
        maxEnergy: charData.baseStats.maxEnergy,
        shield: 0,
        actionValue: Math.round(10000 / speed),
        isAlive: true
      };
    });

    this.sp = 3;
    this.maxSp = 5;
    this.turnCount = 0;
    this.maxTurns = 30; // 30-Turn Limit
    this.logs = [`⚔️ Trận đấu bắt đầu với **${this.enemy.name}** (Lv.${this.enemy.level})!`];
    this.isFinished = false;
    this.winner = null;

    this.advanceToNextTurn();
  }

  advanceToNextTurn() {
    if (this.isFinished) return;

    if (!this.enemy.isAlive) {
      this.isFinished = true;
      this.winner = 'player';
      this.logs.push(`🎉 **Kẻ địch ${this.enemy.name} đã bị đánh bại! Bạn chiến thắng!**`);
      this.handleVictoryRewards();
      return;
    }

    const aliveTeam = this.team.filter(c => c.isAlive);
    if (aliveTeam.length === 0) {
      this.isFinished = true;
      this.winner = 'enemy';
      this.logs.push(`💀 **Toàn bộ đội hình đã gục ngã! Bạn thất bại...**`);
      return;
    }

    if (this.turnCount >= this.maxTurns) {
      this.isFinished = true;
      this.winner = 'enemy';
      this.logs.push(`⏳ **Đã vượt quá giới hạn 30 Vòng (30 Turns)! Bạn đã thất bại khiêu chiến Boss!**`);
      return;
    }

    const allActors = [...aliveTeam, this.enemy];
    let minAV = Math.min(...allActors.map(a => a.actionValue));

    allActors.forEach(a => {
      a.actionValue -= minAV;
    });

    this.currentActor = allActors.find(a => a.actionValue <= 0);

    if (this.currentActor === this.enemy) {
      this.turnCount++;
      this.executeEnemyTurn();
    }
  }

  handleVictoryRewards() {
    const expResult = db.addPlayerExp(this.userId, 450);
    const user = db.getUser(this.userId);

    user.materials.char_exp_book = (user.materials.char_exp_book || 0) + 6;
    user.materials.weapon_exp_crystal = (user.materials.weapon_exp_crystal || 0) + 6;
    user.materials.artifact_dust = (user.materials.artifact_dust || 0) + 12;
    user.materials.trace_material = (user.materials.trace_material || 0) + 4;

    // Drop Randomized Artifact from Boss's Drop List
    const dropList = this.enemy.dropArtifacts || ['musketeer'];
    const chosenSetId = dropList[Math.floor(Math.random() * dropList.length)];
    const relicSet = artifactsData.find(a => a.id === chosenSetId) || artifactsData[0];

    const mainStats = ['ATK%', 'HP%', 'DEF%', 'CRIT Rate%', 'CRIT DMG%', 'SPD', 'Quantum DMG%', 'Fire DMG%'];
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

  calculateDamage(attackerAtk, defenderDef, multiplier, critRate = 0.15, critDmg = 0.50) {
    const isCrit = Math.random() < critRate;
    const critMult = isCrit ? (1 + critDmg) : 1.0;
    const rawDmg = attackerAtk * multiplier * critMult;
    const defMitigation = 100 / (100 + defenderDef);
    const variance = 0.95 + Math.random() * 0.1;
    return {
      damage: Math.max(10, Math.floor(rawDmg * defMitigation * variance)),
      isCrit
    };
  }

  executeBasicAttack() {
    if (this.isFinished || this.currentActor === this.enemy) return;

    const char = this.currentActor;
    const skill = char.skills.basic;
    const skillMultiplier = skill.multiplier * (1 + (char.basicLvl - 1) * 0.15);
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

    const skillMultiplier = skill.multiplier * (1 + (char.skillLvl - 1) * 0.20);

    if (skill.isHeal) {
      this.team.filter(c => c.isAlive).forEach(ally => {
        const healAmt = Math.floor((char.maxHp * 0.20 + 150) * (1 + (char.skillLvl - 1) * 0.1));
        ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
      });
      this.logs.push(`💚 **${char.name}** dùng **${skill.name} (Lv.${char.skillLvl})** hồi máu cho toàn đội! (-1 SP)`);
    } else if (skill.isShield) {
      // Rebalanced March 7th Shield scaling strictly based on DEF!
      this.team.filter(c => c.isAlive).forEach(ally => {
        ally.shield = Math.floor((char.def * 1.2 + 150) * (1 + (char.skillLvl - 1) * 0.1));
      });
      this.logs.push(`🛡️ **${char.name}** dùng **${skill.name} (Lv.${char.skillLvl})** tạo khiên bảo vệ toàn đội! (-1 SP)`);
    } else {
      const res = this.calculateDamage(char.atk, this.enemy.def, skillMultiplier, char.critRate + 0.1, char.critDmg);
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
    const ultMultiplier = ult.multiplier * (1 + (char.ultLvl - 1) * 0.25);

    if (ult.isHeal) {
      this.team.filter(c => c.isAlive).forEach(ally => {
        const healAmt = Math.floor((char.maxHp * 0.35 + 300) * (1 + (char.ultLvl - 1) * 0.1));
        ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
      });
      this.logs.push(`✨ **[TUYỆT KỸ] ${char.name} (Lv.${char.ultLvl})** thi triển **${ult.name}** hồi lượng lớn HP!`);
    } else if (ult.isBuff) {
      this.team.filter(c => c.isAlive).forEach(ally => {
        ally.atk = Math.floor(ally.atk * 1.35);
      });
      this.logs.push(`✨ **[TUYỆT KỸ] ${char.name} (Lv.${char.ultLvl})** thi triển **${ult.name}** tăng 35% ATK toàn đội!`);
    } else {
      // Massive Ultimate multiplier (e.g. Seele Ult)
      const res = this.calculateDamage(char.atk, this.enemy.def, ultMultiplier * 1.5, char.critRate + 0.2, char.critDmg + 0.3);
      this.enemy.currentHp = Math.max(0, this.enemy.currentHp - res.damage);
      if (this.enemy.currentHp === 0) this.enemy.isAlive = false;

      const critTag = res.isCrit ? ' 💥💥 [CHÍ MẠNG TOÀN PHẦN!]' : '';
      this.logs.push(`🌟 **[TUYỆT KỸ] ${char.name} (Lv.${char.ultLvl})** tung **${ult.name}** giáng **${res.damage}** sát thương!${critTag}`);
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
    target.currentEnergy = Math.min(target.maxEnergy, target.currentEnergy + 10);

    if (target.currentHp === 0) {
      target.isAlive = false;
      this.logs.push(`👹 **${this.enemy.name}** giáng đòn vào **${target.name}** gây **${dmg}** DMG! (**${target.name}** đã bị hạ gục!)`);
    } else {
      this.logs.push(`👹 **${this.enemy.name}** tấn công **${target.name}** gây **${dmg}** DMG!`);
    }

    this.enemy.actionValue = Math.round(10000 / this.enemy.speed);
    this.advanceToNextTurn();
  }
}

module.exports = BattleSession;
