const charactersData = require('../data/characters.json');
const enemiesData = require('../data/enemies.json');
const db = require('../database/db');

class BattleSession {
  constructor(userId, teamCharIds, enemyId) {
    this.userId = userId;
    const rawEnemy = enemiesData.find(e => e.id === enemyId) || enemiesData[0];
    const userInv = db.getUserInventory(userId);

    this.enemy = {
      ...rawEnemy,
      currentHp: rawEnemy.hp,
      maxHp: rawEnemy.hp,
      currentToughness: rawEnemy.toughness,
      maxToughness: rawEnemy.toughness,
      actionValue: Math.round(10000 / rawEnemy.speed),
      isAlive: true
    };

    this.team = teamCharIds.map((charId, idx) => {
      const charData = charactersData.find(c => c.id === charId) || charactersData[0];
      const invRecord = userInv.find(i => i.char_id === charId) || { level: 1, weapon_level: 1, basic_lvl: 1, skill_lvl: 1, ult_lvl: 1 };

      const charLvl = invRecord.level || 1;
      const wpnLvl = invRecord.weapon_level || 1;

      // Scaled Stats based on Character & Weapon Levels
      const maxHp = charData.baseStats.hp + (charLvl - 1) * 35;
      const atk = charData.baseStats.atk + (charLvl - 1) * 15 + (wpnLvl - 1) * 12;
      const def = charData.baseStats.def + (charLvl - 1) * 10;
      const speed = charData.baseStats.speed;

      return {
        ...charData,
        slot: idx + 1,
        level: charLvl,
        weaponLevel: wpnLvl,
        basicLvl: invRecord.basic_lvl || 1,
        skillLvl: invRecord.skill_lvl || 1,
        ultLvl: invRecord.ult_lvl || 1,
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
    this.logs = [`⚔️ Trận đấu bắt đầu với **${this.enemy.name}**! (Giới hạn: ${this.maxTurns} lượt)`];
    this.isFinished = false;
    this.winner = null;

    this.advanceToNextTurn();
  }

  advanceToNextTurn() {
    if (this.isFinished) return;

    // Check Win
    if (!this.enemy.isAlive) {
      this.isFinished = true;
      this.winner = 'player';
      this.logs.push(`🎉 **Kẻ địch ${this.enemy.name} đã bị đánh bại! Bạn chiến thắng!**`);
      this.handleVictoryRewards();
      return;
    }

    // Check Loss (All allies dead)
    const aliveTeam = this.team.filter(c => c.isAlive);
    if (aliveTeam.length === 0) {
      this.isFinished = true;
      this.winner = 'enemy';
      this.logs.push(`💀 **Toàn bộ đội hình đã gục ngã! Bạn thất bại...**`);
      return;
    }

    // Check 30-Turn Limit
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
    // Reward Player Exp & Materials
    const expResult = db.addPlayerExp(this.userId, 400);
    const user = db.getUser(this.userId);

    user.materials.char_exp_book = (user.materials.char_exp_book || 0) + 5;
    user.materials.weapon_exp_crystal = (user.materials.weapon_exp_crystal || 0) + 5;
    user.materials.artifact_dust = (user.materials.artifact_dust || 0) + 10;
    user.materials.trace_material = (user.materials.trace_material || 0) + 3;

    // Drop random 5★ Artifact
    const droppedArtifact = db.addArtifact(this.userId, {
      setName: 'Bộ Thiện Xạ Trường Hoang (5★)',
      slot: 'Head',
      mainStat: 'HP%',
      mainValue: 8.0
    });

    this.logs.push(`🎁 **PHẦN THƯỞNG CHIẾN THẮNG**:`);
    this.logs.push(`- +400 EXP Thám Hiểm ${expResult.leveledUp ? `🎉 **LÊN CẤP ${expResult.newLevel}!** (+300 Jades)` : ''}`);
    this.logs.push(`- +5 Sách EXP | +5 Tinh Thể Vũ Khí | +10 Bụi Di Vật`);
    this.logs.push(`- 🛡️ Rớt Di Vật 5★: **${droppedArtifact.setName}** (${droppedArtifact.mainStat})!`);
  }

  calculateDamage(attackerAtk, defenderDef, multiplier) {
    const rawDmg = attackerAtk * multiplier;
    const defMitigation = 100 / (100 + defenderDef);
    const variance = 0.95 + Math.random() * 0.1;
    return Math.floor(rawDmg * defMitigation * variance);
  }

  executeBasicAttack() {
    if (this.isFinished || this.currentActor === this.enemy) return;

    const char = this.currentActor;
    const skill = char.skills.basic;
    const skillMultiplier = skill.multiplier * (1 + (char.basicLvl - 1) * 0.15);
    const dmg = this.calculateDamage(char.atk, this.enemy.def, skillMultiplier);

    this.enemy.currentHp = Math.max(0, this.enemy.currentHp - dmg);
    if (this.enemy.currentHp === 0) this.enemy.isAlive = false;

    this.sp = Math.min(this.maxSp, this.sp + 1);
    char.currentEnergy = Math.min(char.maxEnergy, char.currentEnergy + skill.energyGain);

    this.logs.push(`⚔️ **${char.name}** dùng **${skill.name} (Lv.${char.basicLvl})** gây **${dmg}** sát thương! (+1 SP)`);

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
        const healAmt = Math.floor((char.maxHp * 0.25 + 200) * (1 + (char.skillLvl - 1) * 0.1));
        ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
      });
      this.logs.push(`💚 **${char.name}** dùng **${skill.name} (Lv.${char.skillLvl})** hồi máu cho toàn đội! (-1 SP)`);
    } else if (skill.isShield) {
      this.team.filter(c => c.isAlive).forEach(ally => {
        ally.shield = Math.floor((char.def * 1.5 + 300) * (1 + (char.skillLvl - 1) * 0.1));
      });
      this.logs.push(`🛡️ **${char.name}** dùng **${skill.name} (Lv.${char.skillLvl})** tạo khiên bảo vệ toàn đội! (-1 SP)`);
    } else {
      const dmg = this.calculateDamage(char.atk, this.enemy.def, skillMultiplier);
      this.enemy.currentHp = Math.max(0, this.enemy.currentHp - dmg);
      if (this.enemy.currentHp === 0) this.enemy.isAlive = false;

      this.logs.push(`💥 **${char.name}** dùng **${skill.name} (Lv.${char.skillLvl})** gây **${dmg}** sát thương! (-1 SP)`);
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
        const healAmt = Math.floor((char.maxHp * 0.4 + 400) * (1 + (char.ultLvl - 1) * 0.1));
        ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
      });
      this.logs.push(`✨ **[TUYỆT KỸ] ${char.name} (Lv.${char.ultLvl})** thi triển **${ult.name}** hồi lượng lớn HP!`);
    } else if (ult.isBuff) {
      this.team.filter(c => c.isAlive).forEach(ally => {
        ally.atk = Math.floor(ally.atk * 1.35);
      });
      this.logs.push(`✨ **[TUYỆT KỸ] ${char.name} (Lv.${char.ultLvl})** thi triển **${ult.name}** tăng 35% ATK toàn đội!`);
    } else {
      const dmg = this.calculateDamage(char.atk, this.enemy.def, ultMultiplier);
      this.enemy.currentHp = Math.max(0, this.enemy.currentHp - dmg);
      if (this.enemy.currentHp === 0) this.enemy.isAlive = false;

      this.logs.push(`🌟 **[TUYỆT KỸ] ${char.name} (Lv.${char.ultLvl})** tung **${ult.name}** giáng **${dmg}** sát thương chí mạng!`);
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
    let dmg = this.calculateDamage(this.enemy.atk, target.def, 1.2);

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
      this.logs.push(`👹 **${this.enemy.name}** tấn công **${target.name}** gây **${dmg}** DMG! (**${target.name}** đã bị hạ gục!)`);
    } else {
      this.logs.push(`👹 **${this.enemy.name}** tấn công **${target.name}** gây **${dmg}** DMG!`);
    }

    this.enemy.actionValue = Math.round(10000 / this.enemy.speed);
    this.advanceToNextTurn();
  }
}

module.exports = BattleSession;
