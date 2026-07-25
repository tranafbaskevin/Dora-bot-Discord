const charactersData = require('../data/characters.json');
const enemiesData = require('../data/enemies.json');

class BattleSession {
  constructor(teamCharIds, enemyId) {
    const rawEnemy = enemiesData.find(e => e.id === enemyId) || enemiesData[0];
    
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
      return {
        ...charData,
        slot: idx + 1,
        currentHp: charData.baseStats.hp,
        maxHp: charData.baseStats.hp,
        atk: charData.baseStats.atk,
        def: charData.baseStats.def,
        speed: charData.baseStats.speed,
        currentEnergy: Math.floor(charData.baseStats.maxEnergy / 2), // Start at 50% energy
        maxEnergy: charData.baseStats.maxEnergy,
        shield: 0,
        actionValue: Math.round(10000 / charData.baseStats.speed),
        isAlive: true
      };
    });

    this.sp = 3; // Start with 3 Skill Points (Max 5)
    this.maxSp = 5;
    this.logs = [`⚔️ Trận đấu bắt đầu với **${this.enemy.name}**!`];
    this.isFinished = false;
    this.winner = null; // 'player' | 'enemy'

    this.advanceToNextTurn();
  }

  // Find next actor with lowest Action Value
  advanceToNextTurn() {
    if (this.isFinished) return;

    // Check Win/Loss
    if (!this.enemy.isAlive) {
      this.isFinished = true;
      this.winner = 'player';
      this.logs.push(`🎉 **Kẻ địch ${this.enemy.name} đã bị đánh bại! Bạn chiến thắng!**`);
      return;
    }

    const aliveTeam = this.team.filter(c => c.isAlive);
    if (aliveTeam.length === 0) {
      this.isFinished = true;
      this.winner = 'enemy';
      this.logs.push(`💀 **Toàn bộ đội hình đã gục ngã! Bạn thất bại...**`);
      return;
    }

    const allActors = [...aliveTeam, this.enemy];
    let minAV = Math.min(...allActors.map(a => a.actionValue));

    // Deduct minAV from all
    allActors.forEach(a => {
      a.actionValue -= minAV;
    });

    // Active actor is the one with actionValue === 0
    this.currentActor = allActors.find(a => a.actionValue <= 0);

    // If enemy turn, auto-execute AI
    if (this.currentActor === this.enemy) {
      this.executeEnemyTurn();
    }
  }

  // Calculate damage
  calculateDamage(attackerAtk, defenderDef, multiplier) {
    const rawDmg = attackerAtk * multiplier;
    const defMitigation = 100 / (100 + defenderDef);
    // Add small variance (+-5%)
    const variance = 0.95 + Math.random() * 0.1;
    return Math.floor(rawDmg * defMitigation * variance);
  }

  // Player Basic Attack
  executeBasicAttack() {
    if (this.isFinished || this.currentActor === this.enemy) return;

    const char = this.currentActor;
    const skill = char.skills.basic;
    const dmg = this.calculateDamage(char.atk, this.enemy.def, skill.multiplier);

    this.enemy.currentHp = Math.max(0, this.enemy.currentHp - dmg);
    if (this.enemy.currentHp === 0) this.enemy.isAlive = false;

    // SP & Energy
    this.sp = Math.min(this.maxSp, this.sp + 1);
    char.currentEnergy = Math.min(char.maxEnergy, char.currentEnergy + skill.energyGain);

    this.logs.push(`⚔️ **${char.name}** dùng **${skill.name}** gây **${dmg}** sát thương lên ${this.enemy.name}! (+1 SP)`);

    // Reset AV
    char.actionValue = Math.round(10000 / char.speed);
    this.advanceToNextTurn();
  }

  // Player Skill Attack / Support
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

    if (skill.isHeal) {
      // Heal all alive allies or lowest HP ally
      this.team.filter(c => c.isAlive).forEach(ally => {
        const healAmt = Math.floor(char.maxHp * 0.25 + 200);
        ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
      });
      this.logs.push(`💚 **${char.name}** sử dụng **${skill.name}** hồi máu cho toàn đội! (-1 SP)`);
    } else if (skill.isShield) {
      // Grant Shield to all allies
      this.team.filter(c => c.isAlive).forEach(ally => {
        ally.shield = Math.floor(char.def * 1.5 + 300);
      });
      this.logs.push(`🛡️ **${char.name}** sử dụng **${skill.name}** tạo khiên bảo vệ toàn đội! (-1 SP)`);
    } else {
      // Damage skill
      const dmg = this.calculateDamage(char.atk, this.enemy.def, skill.multiplier);
      this.enemy.currentHp = Math.max(0, this.enemy.currentHp - dmg);
      if (this.enemy.currentHp === 0) this.enemy.isAlive = false;

      this.logs.push(`💥 **${char.name}** sử dụng **${skill.name}** gây **${dmg}** sát thương! (-1 SP)`);
    }

    // Reset AV
    char.actionValue = Math.round(10000 / char.speed);
    this.advanceToNextTurn();
    return true;
  }

  // Ultimate (Can be triggered anytime energy is full)
  executeUltimate(charSlot) {
    if (this.isFinished) return false;

    const char = this.team.find(c => c.slot === charSlot);
    if (!char || !char.isAlive || char.currentEnergy < char.maxEnergy) {
      return false;
    }

    const ult = char.skills.ultimate;
    char.currentEnergy = 0; // Consume energy

    if (ult.isHeal) {
      this.team.filter(c => c.isAlive).forEach(ally => {
        const healAmt = Math.floor(char.maxHp * 0.4 + 400);
        ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
      });
      this.logs.push(`✨ **[TUYỆT KỸ] ${char.name}** thi triển **${ult.name}** hồi lượng lớn HP toàn đội!`);
    } else if (ult.isBuff) {
      this.team.filter(c => c.isAlive).forEach(ally => {
        ally.atk = Math.floor(ally.atk * 1.3); // +30% ATK buff
      });
      this.logs.push(`✨ **[TUYỆT KỸ] ${char.name}** thi triển **${ult.name}** tăng 30% ATK toàn đội!`);
    } else {
      const dmg = this.calculateDamage(char.atk, this.enemy.def, ult.multiplier);
      this.enemy.currentHp = Math.max(0, this.enemy.currentHp - dmg);
      if (this.enemy.currentHp === 0) this.enemy.isAlive = false;

      this.logs.push(`🌟 **[TUYỆT KỸ] ${char.name}** tung **${ult.name}** giáng **${dmg}** sát thương chí mạng!`);
    }

    // Check if enemy died from Ult
    if (!this.enemy.isAlive) {
      this.isFinished = true;
      this.winner = 'player';
      this.logs.push(`🎉 **Kẻ địch ${this.enemy.name} đã bị tiêu diệt! Bạn chiến thắng!**`);
    }

    return true;
  }

  // Enemy AI turn execution
  executeEnemyTurn() {
    const aliveTeam = this.team.filter(c => c.isAlive);
    if (aliveTeam.length === 0) return;

    // Pick random target
    const target = aliveTeam[Math.floor(Math.random() * aliveTeam.length)];
    let dmg = this.calculateDamage(this.enemy.atk, target.def, 1.2);

    // Shield absorbs DMG
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
    target.currentEnergy = Math.min(target.maxEnergy, target.currentEnergy + 10); // Gain energy on hit

    if (target.currentHp === 0) {
      target.isAlive = false;
      this.logs.push(`👹 **${this.enemy.name}** tấn công **${target.name}** gây **${dmg}** DMG! (**${target.name}** đã bị hạ gục!)`);
    } else {
      this.logs.push(`👹 **${this.enemy.name}** tấn công **${target.name}** gây **${dmg}** DMG!`);
    }

    // Reset enemy AV
    this.enemy.actionValue = Math.round(10000 / this.enemy.speed);
    this.advanceToNextTurn();
  }
}

module.exports = BattleSession;
