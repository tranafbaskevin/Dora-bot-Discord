const db = require('../database/db');
const charactersData = require('../data/characters.json');
const enemiesData = require('../data/enemies.json');

class BattleSession {
  constructor(userId, bossId = 'doomsday_beast', difficultyLevel = 40) {
    this.userId = userId;
    this.bossId = bossId;
    this.difficultyLevel = difficultyLevel;

    // Load User Inventory & Team
    const userTeam = db.getUserTeam(userId);
    const userInv = db.getUserInventory(userId);
    const rawDb = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../database.json'), 'utf8'));
    const userArts = (rawDb.artifacts && rawDb.artifacts[userId]) || [];

    const slotIds = [userTeam.slot1, userTeam.slot2, userTeam.slot3, userTeam.slot4];

    // Build Player Team
    this.team = slotIds.map((charId, index) => {
      const baseChar = charactersData.find(c => c.id === charId) || charactersData[0];
      const invRecord = userInv.find(i => i.char_id === charId) || { level: 1, weapon_level: 1, basic_lvl: 1, skill_lvl: 1, ult_lvl: 1, eidolon: 0 };

      const charLvl = invRecord.level || 1;
      const wpnLvl = invRecord.weapon_level || 1;

      // Base Stat Calculation
      const baseHp = (baseChar.baseStats?.hp || 900) + (charLvl - 1) * 40;
      const baseAtk = (baseChar.baseStats?.atk || 600) + (charLvl - 1) * 18 + (wpnLvl - 1) * 12;
      const baseDef = (baseChar.baseStats?.def || 350) + (charLvl - 1) * 12;
      const baseSpeed = baseChar.baseStats?.speed || 100;

      // Calculate Relics Stats
      const charArts = userArts.filter(a => a.char_id === baseChar.id);
      let artHpBonus = 0;
      let artAtkBonus = 0;
      let artDefBonus = 0;

      charArts.forEach(art => {
        if (art.mainStat === 'HP%') artHpBonus += art.mainValue;
        if (art.mainStat === 'ATK%') artAtkBonus += art.mainValue;
        if (art.mainStat === 'DEF%') artDefBonus += art.mainValue;
      });

      const maxHp = Math.round(baseHp * (1 + artHpBonus / 100));
      const atk = Math.round(baseAtk * (1 + artAtkBonus / 100));
      const def = Math.round(baseDef * (1 + artDefBonus / 100));

      return {
        slot: index + 1,
        id: baseChar.id,
        name: baseChar.name,
        element: baseChar.element,
        path: baseChar.path,
        icon: baseChar.icon,
        level: charLvl,
        eidolon: invRecord.eidolon || 0,
        maxHp: maxHp,
        currentHp: maxHp,
        atk: atk,
        def: def,
        speed: baseSpeed,
        maxEnergy: baseChar.maxEnergy || 120,
        currentEnergy: 40,
        basicLvl: invRecord.basic_lvl || 1,
        skillLvl: invRecord.skill_lvl || 1,
        ultLvl: invRecord.ult_lvl || 1,
        actionValue: Math.round(10000 / baseSpeed),
        isAlive: true
      };
    });

    // Load Enemy Boss Data & Scaling
    const baseEnemy = enemiesData.find(e => e.id === bossId) || enemiesData[0];
    const hpFactor = Math.pow(1.08, (difficultyLevel - 20) / 5);
    const atkFactor = Math.pow(1.05, (difficultyLevel - 20) / 5);

    this.enemy = {
      id: baseEnemy.id,
      name: baseEnemy.name,
      level: difficultyLevel,
      icon: baseEnemy.icon || `assets/bosses/${baseEnemy.id}.png`,
      maxHp: Math.round(baseEnemy.hp * hpFactor),
      currentHp: Math.round(baseEnemy.hp * hpFactor),
      atk: Math.round(baseEnemy.atk * atkFactor),
      def: baseEnemy.def || 400,
      speed: baseEnemy.speed || 100,
      weaknesses: baseEnemy.weakness || ['Fire', 'Ice', 'Quantum'],
      toughness: 100,
      maxToughness: 100,
      actionValue: Math.round(10000 / (baseEnemy.speed || 100)),
      isAlive: true
    };

    this.turn = 1;
    this.maxTurns = 30;
    this.sp = 3;
    this.maxSp = 5;

    this.currentActor = null;
    this.isFinished = false;
    this.winner = null;
    this.logs = [];

    this.determineNextActor();
  }

  determineNextActor() {
    if (this.isFinished) return;

    const aliveTeam = this.team.filter(c => c.isAlive);
    if (aliveTeam.length === 0) {
      this.isFinished = true;
      this.winner = 'enemy';
      this.logs.push(`💀 **Toàn bộ đội hình đã bị tiêu diệt! Trận đấu kết thúc.**`);
      return;
    }

    if (!this.enemy.isAlive) {
      this.isFinished = true;
      this.winner = 'player';
      this.logs.push(`🎉 **Kẻ địch ${this.enemy.name} đã bị tiêu diệt! CHIẾN THẮNG HÙNG HỒN!**`);
      this.handleVictoryRewards();
      return;
    }

    const allActors = [...aliveTeam, this.enemy];
    allActors.sort((a, b) => a.actionValue - b.actionValue);
    this.currentActor = allActors[0];
  }

  advanceToNextTurn() {
    if (this.isFinished) return;

    const elapsedAv = this.currentActor ? this.currentActor.actionValue : 0;

    if (this.currentActor) {
      this.currentActor.actionValue = Math.round(10000 / (this.currentActor.speed || 100));
    }

    this.team.forEach(c => {
      if (c.isAlive && c !== this.currentActor) {
        c.actionValue = Math.max(1, c.actionValue - elapsedAv);
      }
    });

    if (this.enemy.isAlive && this.enemy !== this.currentActor) {
      this.enemy.actionValue = Math.max(1, this.enemy.actionValue - elapsedAv);
    }

    this.turn++;
    if (this.turn > this.maxTurns) {
      this.isFinished = true;
      this.winner = 'draw';
      this.logs.push(`⏳ **Hết 30 vòng đấu! Trận chiến kết thúc với tỷ số Hòa.**`);
      return;
    }

    this.determineNextActor();

    while (!this.isFinished && this.currentActor === this.enemy && this.enemy.isAlive) {
      this.executeEnemyTurn();
    }
  }

  handleVictoryRewards() {
    const user = db.getUser(this.userId);

    const baseEnemy = enemiesData.find(e => e.id === this.enemy.id) || enemiesData[0];
    const rewards = baseEnemy.rewards || { jades: 800, exp: 450, charExpBooks: 6, weaponExpCrystals: 6, artifactDust: 12 };

    user.materials.char_exp_book = (user.materials.char_exp_book || 0) + (rewards.charExpBooks || 6);
    user.materials.weapon_exp_crystal = (user.materials.weapon_exp_crystal || 0) + (rewards.weaponExpCrystals || 6);
    user.materials.artifact_dust = (user.materials.artifact_dust || 0) + (rewards.artifactDust || 12);
    db.updateUserJades(this.userId, user.jades + (rewards.jades || 800));

    const expResult = db.addPlayerExp(this.userId, rewards.exp || 450);

    // 4★ VS 5★ SCALING BASED ON PLAYER LEVEL
    const pLvl = user.player_level || 1;
    let prob5Star = 0.20;
    if (pLvl >= 61) prob5Star = 1.0;
    else if (pLvl >= 41) prob5Star = 0.75;
    else if (pLvl >= 21) prob5Star = 0.50;
    else prob5Star = 0.20;

    // DROP 2 RELICS ACCORDING TO BOSS DROP ARTIFACTS SETS!
    const bossDropIds = baseEnemy.dropArtifacts || ['musketeer'];
    const allArtifactData = require('../data/artifacts.json');

    const droppedArtifacts = [];
    for (let i = 0; i < 2; i++) {
      let targetSetId = null;
      if (i === 0) {
        targetSetId = bossDropIds[Math.floor(Math.random() * bossDropIds.length)];
      } else {
        if (bossDropIds.length > 1) {
          targetSetId = bossDropIds[Math.floor(Math.random() * bossDropIds.length)];
        } else {
          const randSet = allArtifactData[Math.floor(Math.random() * allArtifactData.length)];
          targetSetId = randSet.id;
        }
      }

      const setInfo = allArtifactData.find(a => a.id === targetSetId) || allArtifactData[0];
      const is5Star = Math.random() < prob5Star;
      const rarity = is5Star ? 5 : 4;

      const slots = ['Head', 'Hands', 'Body', 'Feet'];
      const chosenSlot = slots[Math.floor(Math.random() * slots.length)];

      const mainStats = ['ATK%', 'HP%', 'DEF%', 'CRIT Rate%', 'CRIT DMG%', 'SPD'];
      const chosenMainStat = mainStats[Math.floor(Math.random() * mainStats.length)];
      const mainVal = chosenMainStat.includes('%') ? (rarity === 5 ? 5.0 + Math.random() * 3.5 : 3.2 + Math.random() * 2.0) : (rarity === 5 ? 12 + Math.floor(Math.random() * 5) : 8 + Math.floor(Math.random() * 4));

      const subPool = ['ATK%', 'DEF%', 'HP%', 'CRIT Rate%', 'CRIT DMG%', 'SPD'];
      const subStats = [];
      const countSubs = rarity === 5 ? 4 : 3;
      while (subStats.length < countSubs) {
        const pick = subPool[Math.floor(Math.random() * subPool.length)];
        if (!subStats.some(s => s.name === pick) && pick !== chosenMainStat) {
          const mult = rarity === 5 ? 1.0 : 0.7;
          const val = pick.includes('%') ? (2.5 + Math.random() * 2.0) * mult : (2 + Math.floor(Math.random() * 3)) * mult;
          subStats.push({ name: pick, value: parseFloat(val.toFixed(1)) });
        }
      }

      const dropped = db.addArtifact(this.userId, {
        setName: `${setInfo.name}`,
        rarity: rarity,
        slot: chosenSlot,
        mainStat: chosenMainStat,
        mainValue: parseFloat(mainVal.toFixed(1)),
        subStats: subStats
      });

      droppedArtifacts.push(dropped);
    }

    this.victoryData = {
      jades: rewards.jades || 800,
      exp: rewards.exp || 450,
      leveledUp: expResult.leveledUp,
      newLevel: expResult.newLevel,
      charExpBooks: rewards.charExpBooks || 6,
      weaponExpCrystals: rewards.weaponExpCrystals || 6,
      artifactDust: rewards.artifactDust || 12,
      artifacts: droppedArtifacts
    };

    this.logs.push(`🎁 **PHẦN THƯỞNG CHIẾN THẮNG**:`);
    this.logs.push(`- +${rewards.jades} Jades | +${rewards.exp} EXP Thám Hiểm ${expResult.leveledUp ? `🎉 **LÊN CẤP ${expResult.newLevel}!**` : ''}`);
    this.logs.push(`- +${rewards.charExpBooks} Sách EXP | +${rewards.weaponExpCrystals} Tinh Thể Vũ Khí | +${rewards.artifactDust} Bụi Di Vật`);
    this.logs.push(`- 🛡️ Rớt 2 Di Vật: **${droppedArtifacts[0].setName} (${droppedArtifacts[0].rarity}★)** & **${droppedArtifacts[1].setName} (${droppedArtifacts[1].rarity}★)**!`);
  }

  calculateDamage(attackerAtk, defenderDef, multiplier, critRate = 0.25, critDmg = 0.60) {
    const safeAtk = isNaN(attackerAtk) || attackerAtk <= 0 ? 1000 : attackerAtk;
    const safeDef = isNaN(defenderDef) || defenderDef <= 0 ? 300 : defenderDef;
    const safeMult = isNaN(multiplier) || multiplier <= 0 ? 1.0 : multiplier;

    const baseDmg = safeAtk * safeMult;
    const defMitigation = 1 - (safeDef / (safeDef + 1200));
    let finalDmg = baseDmg * defMitigation;

    const isCrit = Math.random() < critRate;
    if (isCrit) {
      finalDmg *= (1 + critDmg);
    }

    const variance = 0.95 + Math.random() * 0.10;
    return {
      damage: Math.max(10, Math.round(finalDmg * variance)),
      isCrit: isCrit
    };
  }

  executeBasicAttack() {
    if (this.isFinished || !this.currentActor || this.currentActor === this.enemy) return;

    const actor = this.currentActor;
    const mult = 1.0 + (actor.basicLvl - 1) * 0.15;
    const result = this.calculateDamage(actor.atk, this.enemy.def, mult);

    this.enemy.currentHp = Math.max(0, this.enemy.currentHp - result.damage);
    actor.currentEnergy = Math.min(actor.maxEnergy, actor.currentEnergy + 20);
    this.sp = Math.min(this.maxSp, this.sp + 1);

    const critText = result.isCrit ? '💥 **CHÍ MẠNG!** ' : '';
    this.logs.push(`⚔️ **${actor.name}** dùng Đánh Thường gây ${critText}**${result.damage.toLocaleString()}** sát thương lên ${this.enemy.name}! (+1 SP)`);

    if (this.enemy.currentHp <= 0) {
      this.enemy.isAlive = false;
      this.determineNextActor();
    } else {
      this.advanceToNextTurn();
    }
  }

  executeSkill() {
    if (this.isFinished || !this.currentActor || this.currentActor === this.enemy) return;
    if (this.sp < 1) {
      this.logs.push(`⚠️ Không đủ Điểm Chiến Kỹ (SP)!`);
      return;
    }

    const actor = this.currentActor;
    this.sp -= 1;

    let skillMult = 1.8 + (actor.skillLvl - 1) * 0.25;

    if (actor.path === 'Abundance' || actor.id === 'natasha') {
      const healAmt = Math.round(actor.maxHp * 0.25 + 200);
      this.team.forEach(c => {
        if (c.isAlive) {
          c.currentHp = Math.min(c.maxHp, c.currentHp + healAmt);
        }
      });
      actor.currentEnergy = Math.min(actor.maxEnergy, actor.currentEnergy + 30);
      this.logs.push(`✨ **${actor.name}** thi triển Chiến Kỹ Trị Liệu hồi **+${healAmt.toLocaleString()} HP** cho toàn đội! (-1 SP)`);
    } else if (actor.path === 'Preservation' || actor.id === 'march_7th') {
      const result = this.calculateDamage(actor.atk, this.enemy.def, skillMult);
      this.enemy.currentHp = Math.max(0, this.enemy.currentHp - result.damage);
      actor.currentEnergy = Math.min(actor.maxEnergy, actor.currentEnergy + 30);
      this.logs.push(`🛡️ **${actor.name}** thi triển Chiến Kỹ Tạo Khiên & Băng Giáp gây **${result.damage.toLocaleString()}** sát thương lên ${this.enemy.name}! (-1 SP)`);
    } else {
      const result = this.calculateDamage(actor.atk, this.enemy.def, skillMult, 0.35, 0.80);
      this.enemy.currentHp = Math.max(0, this.enemy.currentHp - result.damage);
      actor.currentEnergy = Math.min(actor.maxEnergy, actor.currentEnergy + 30);

      const critText = result.isCrit ? '💥 **CHÍ MẠNG!** ' : '';
      this.logs.push(`💥 **${actor.name}** thi triển Chiến Kỹ gây ${critText}**${result.damage.toLocaleString()}** sát thương bùng nổ lên ${this.enemy.name}! (-1 SP)`);
    }

    if (this.enemy.currentHp <= 0) {
      this.enemy.isAlive = false;
      this.determineNextActor();
    } else {
      this.advanceToNextTurn();
    }
  }

  executeUltimate(slotNum) {
    if (this.isFinished) return;
    const actor = this.team.find(c => c.slot === slotNum);
    if (!actor || !actor.isAlive || actor.currentEnergy < actor.maxEnergy) {
      this.logs.push(`⚠️ Không đủ năng lượng Tuyệt Kỹ!`);
      return;
    }

    actor.currentEnergy = 0;
    let ultMult = 3.0 + (actor.ultLvl - 1) * 0.40;

    if (actor.path === 'Abundance' || actor.id === 'natasha') {
      const maxHeal = Math.round(actor.maxHp * 0.45 + 500);
      this.team.forEach(c => {
        if (c.isAlive) {
          c.currentHp = Math.min(c.maxHp, c.currentHp + maxHeal);
        }
      });
      this.logs.push(`🌟 **TUYỆT KỸ HOÀNH TRÁNG**: **${actor.name}** thi triển Thánh Quang hồi phục **+${maxHeal.toLocaleString()} HP** toàn bộ đồng đội!`);
    } else {
      const result = this.calculateDamage(actor.atk, this.enemy.def, ultMult, 0.50, 1.20);
      this.enemy.currentHp = Math.max(0, this.enemy.currentHp - result.damage);

      const critText = result.isCrit ? '💥 **CHÍ MẠNG SIÊU CẤP!** ' : '';
      this.logs.push(`🌟 **TUYỆT KỸ HOÀNH TRÁNG**: **${actor.name}** thi triển đòn ngắt lượt gây ${critText}**${result.damage.toLocaleString()}** sát thương hủy diệt lên ${this.enemy.name}!`);
    }

    if (this.enemy.currentHp <= 0) {
      this.enemy.isAlive = false;
      this.determineNextActor();
    }
  }

  executeEnemyTurn() {
    if (this.isFinished || !this.enemy.isAlive) return;

    const aliveTeam = this.team.filter(c => c.isAlive);
    if (aliveTeam.length === 0) return;

    const target = aliveTeam[Math.floor(Math.random() * aliveTeam.length)];
    const result = this.calculateDamage(this.enemy.atk, target.def, 1.2);

    target.currentHp = Math.max(0, target.currentHp - result.damage);
    target.currentEnergy = Math.min(target.maxEnergy, target.currentEnergy + 15);

    const critText = result.isCrit ? '💥 **CHÍ MẠNG!** ' : '';
    this.logs.push(`👹 Boss **${this.enemy.name}** tấn công gây ${critText}**${result.damage.toLocaleString()}** sát thương lên **${target.name}**!`);

    if (target.currentHp <= 0) {
      target.isAlive = false;
      this.logs.push(`💀 **${target.name}** đã bị hạ gục!`);
    }

    this.enemy.actionValue = Math.round(10000 / (this.enemy.speed || 100));
    this.determineNextActor();
  }
}

module.exports = BattleSession;
