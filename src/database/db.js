const fs = require('fs');
const path = require('path');

const dbFilePath = path.join(__dirname, '../../database.json');

// Helper to read database
function readDb() {
  if (!fs.existsSync(dbFilePath)) {
    const initialData = { users: {}, inventory: {}, teams: {}, artifacts: {} };
    fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    const raw = fs.readFileSync(dbFilePath, 'utf8');
    const data = JSON.parse(raw);
    if (!data.artifacts) data.artifacts = {};
    return data;
  } catch (err) {
    const initialData = { users: {}, inventory: {}, teams: {}, artifacts: {} };
    fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}

// Helper to write database
function saveDb(data) {
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2));
}

// Get or Create User
function getUser(discordId) {
  const data = readDb();
  if (!data.users[discordId]) {
    data.users[discordId] = {
      discord_id: discordId,
      jades: 16000,
      pity_5star: 0,
      pity_4star: 0,
      trash_items: 0,
      player_level: 1,
      player_exp: 0,
      materials: {
        char_exp_book: 50,
        weapon_exp_crystal: 50,
        artifact_dust: 50,
        trace_material: 30
      },
      created_at: new Date().toISOString()
    };

    // Starter characters with levels & skills
    if (!data.inventory[discordId]) {
      data.inventory[discordId] = [
        { char_id: 'seele', level: 1, exp: 0, weapon_level: 1, weapon_exp: 0, basic_lvl: 1, skill_lvl: 1, ult_lvl: 1, eidolon: 0, light_cone: 'In the Night (5★)', artifact_set: 'Bộ Thợ Lặn Ranh Ma' },
        { char_id: 'dan_heng', level: 1, exp: 0, weapon_level: 1, weapon_exp: 0, basic_lvl: 1, skill_lvl: 1, ult_lvl: 1, eidolon: 0, light_cone: 'Only Silence Remains (4★)', artifact_set: 'Bộ Chim Ưng Ranh Ma' },
        { char_id: 'march_7th', level: 1, exp: 0, weapon_level: 1, weapon_exp: 0, basic_lvl: 1, skill_lvl: 1, ult_lvl: 1, eidolon: 0, light_cone: 'Day One of My New Life (4★)', artifact_set: 'Bộ Vệ Binh Băng Tuyết' },
        { char_id: 'natasha', level: 1, exp: 0, weapon_level: 1, weapon_exp: 0, basic_lvl: 1, skill_lvl: 1, ult_lvl: 1, eidolon: 0, light_cone: 'Shared Feeling (4★)', artifact_set: 'Bộ Lãng Khách Âm Thầm' }
      ];
    }

    // Default Team
    if (!data.teams[discordId]) {
      data.teams[discordId] = {
        discord_id: discordId,
        slot1: 'seele',
        slot2: 'dan_heng',
        slot3: 'march_7th',
        slot4: 'natasha'
      };
    }

    saveDb(data);
  }

  // Ensure default structures
  const u = data.users[discordId];
  if (u.player_level === undefined) u.player_level = 1;
  if (u.player_exp === undefined) u.player_exp = 0;
  if (!u.materials) {
    u.materials = { char_exp_book: 50, weapon_exp_crystal: 50, artifact_dust: 50, trace_material: 30 };
    saveDb(data);
  }

  return u;
}

// Add Player Trailblaze EXP
function addPlayerExp(discordId, expGained) {
  const data = readDb();
  const user = getUser(discordId);
  data.users[discordId].player_exp += expGained;

  let reqExp = data.users[discordId].player_level * 500;
  let leveledUp = false;

  while (data.users[discordId].player_exp >= reqExp && data.users[discordId].player_level < 70) {
    data.users[discordId].player_exp -= reqExp;
    data.users[discordId].player_level += 1;
    data.users[discordId].jades += 300; // Reward 300 Jades per Trailblaze level
    reqExp = data.users[discordId].player_level * 500;
    leveledUp = true;
  }

  saveDb(data);
  return { leveledUp, newLevel: data.users[discordId].player_level, totalJades: data.users[discordId].jades };
}

// Upgrade Character Level
function upgradeCharacterLevel(discordId, charId, booksToUse) {
  const data = readDb();
  const user = getUser(discordId);
  const inv = data.inventory[discordId] || [];
  const char = inv.find(c => c.char_id === charId);

  if (!char || (user.materials.char_exp_book || 0) < booksToUse) {
    return { success: false, message: '❌ Không đủ Sách Kinh Nghiệm Nhân Vật!' };
  }

  user.materials.char_exp_book -= booksToUse;
  char.exp = (char.exp || 0) + booksToUse * 1000;

  let reqExp = char.level * 800;
  while (char.exp >= reqExp && char.level < 80) {
    char.exp -= reqExp;
    char.level += 1;
    reqExp = char.level * 800;
  }

  saveDb(data);
  return { success: true, newLevel: char.level, remainingBooks: user.materials.char_exp_book };
}

// Upgrade Weapon Level
function upgradeWeaponLevel(discordId, charId, crystalsToUse) {
  const data = readDb();
  const user = getUser(discordId);
  const inv = data.inventory[discordId] || [];
  const char = inv.find(c => c.char_id === charId);

  if (!char || (user.materials.weapon_exp_crystal || 0) < crystalsToUse) {
    return { success: false, message: '❌ Không đủ Tinh Thể Điệm Kim Vũ Khí!' };
  }

  user.materials.weapon_exp_crystal -= crystalsToUse;
  char.weapon_exp = (char.weapon_exp || 0) + crystalsToUse * 1000;

  let reqExp = (char.weapon_level || 1) * 800;
  while (char.weapon_exp >= reqExp && char.weapon_level < 80) {
    char.weapon_exp -= reqExp;
    char.weapon_level = (char.weapon_level || 1) + 1;
    reqExp = char.weapon_level * 800;
  }

  saveDb(data);
  return { success: true, newLevel: char.weapon_level, remainingCrystals: user.materials.weapon_exp_crystal };
}

// Upgrade Skill Level (basic | skill | ult)
function upgradeSkillLevel(discordId, charId, skillType) {
  const data = readDb();
  const user = getUser(discordId);
  const inv = data.inventory[discordId] || [];
  const char = inv.find(c => c.char_id === charId);

  const cost = 5; // 5 trace materials per level up
  if (!char || (user.materials.trace_material || 0) < cost) {
    return { success: false, message: '❌ Không đủ Vật Liệu Vết Kích Kỹ Năng (Cần 5 vật liệu)!' };
  }

  const key = `${skillType}_lvl`;
  const maxLvl = skillType === 'basic' ? 6 : 10;

  if ((char[key] || 1) >= maxLvl) {
    return { success: false, message: `⚠️ Kỹ năng này đã đạt cấp tối đa (${maxLvl})!` };
  }

  user.materials.trace_material -= cost;
  char[key] = (char[key] || 1) + 1;

  saveDb(data);
  return { success: true, skillType, newLevel: char[key], remainingMaterials: user.materials.trace_material };
}

// Artifact Management & Upgrades
function addArtifact(discordId, artifact) {
  const data = readDb();
  if (!data.artifacts[discordId]) data.artifacts[discordId] = [];

  const newArt = {
    id: `art_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    char_id: artifact.char_id || null,
    setName: artifact.setName || 'Bộ Thiện Xạ Trường Hoang',
    slot: artifact.slot || 'Head',
    mainStat: artifact.mainStat || 'CRIT Rate%',
    mainValue: artifact.mainValue || 5.0,
    level: 0,
    exp: 0,
    subStats: artifact.subStats || [
      { name: 'ATK%', value: 3.5 },
      { name: 'SPD', value: 2 },
      { name: 'CRIT DMG%', value: 5.0 }
    ]
  };

  data.artifacts[discordId].push(newArt);
  saveDb(data);
  return newArt;
}

function upgradeArtifact(discordId, artifactId, dustToUse) {
  const data = readDb();
  const user = getUser(discordId);
  const userArts = data.artifacts[discordId] || [];
  const art = userArts.find(a => a.id === artifactId);

  if (!art || (user.materials.artifact_dust || 0) < dustToUse) {
    return { success: false, message: '❌ Không đủ Bụi Vàng Cường Hóa Di Vật!' };
  }

  user.materials.artifact_dust -= dustToUse;
  art.exp = (art.exp || 0) + dustToUse * 500;

  const subStatPool = ['ATK%', 'DEF%', 'HP%', 'CRIT Rate%', 'CRIT DMG%', 'SPD', 'Quantum DMG%', 'Fire DMG%'];
  let upgradedSubCount = 0;

  let reqExp = (art.level + 1) * 600;
  while (art.exp >= reqExp && art.level < 15) {
    art.exp -= reqExp;
    art.level += 1;
    art.mainValue += 1.5; // Main stat scales

    // Every +3 levels (+3, +6, +9, +12, +15), upgrade a random sub-stat or add new!
    if (art.level % 3 === 0) {
      upgradedSubCount++;
      if (art.subStats.length < 4) {
        const nextStat = subStatPool[Math.floor(Math.random() * subStatPool.length)];
        art.subStats.push({ name: nextStat, value: 3.0 });
      } else {
        const randSub = art.subStats[Math.floor(Math.random() * art.subStats.length)];
        randSub.value += 2.5;
      }
    }

    reqExp = (art.level + 1) * 600;
  }

  saveDb(data);
  return { success: true, newLevel: art.level, mainValue: art.mainValue, subStats: art.subStats, remainingDust: user.materials.artifact_dust };
}

// Update Currency
function updateUserJades(discordId, newJades) {
  const data = readDb();
  if (data.users[discordId]) {
    data.users[discordId].jades = newJades;
    saveDb(data);
  }
}

// Update Pity
function updatePity(discordId, pity5, pity4) {
  const data = readDb();
  if (data.users[discordId]) {
    data.users[discordId].pity_5star = pity5;
    data.users[discordId].pity_4star = pity4;
    saveDb(data);
  }
}

function addTrashItems(discordId, count) {
  const data = readDb();
  const user = getUser(discordId);
  data.users[discordId].trash_items = (data.users[discordId].trash_items || 0) + count;
  saveDb(data);
}

function recycleTrashItems(discordId) {
  const data = readDb();
  const user = getUser(discordId);
  const trashCount = data.users[discordId].trash_items || 0;

  if (trashCount <= 0) {
    return { success: false, count: 0, jadesGained: 0, totalJades: user.jades };
  }

  const jadesGained = trashCount * 20;
  const newJades = user.jades + jadesGained;

  data.users[discordId].trash_items = 0;
  data.users[discordId].jades = newJades;
  saveDb(data);

  return { success: true, count: trashCount, jadesGained, totalJades: newJades };
}

function addCharacter(discordId, charId) {
  const data = readDb();
  if (!data.inventory[discordId]) {
    data.inventory[discordId] = [];
  }

  const existing = data.inventory[discordId].find(item => item.char_id === charId);
  if (existing) {
    existing.eidolon = Math.min(6, existing.eidolon + 1);
    saveDb(data);
    return { isNew: false, eidolon: existing.eidolon };
  } else {
    data.inventory[discordId].push({
      char_id: charId,
      level: 1,
      exp: 0,
      weapon_level: 1,
      weapon_exp: 0,
      basic_lvl: 1,
      skill_lvl: 1,
      ult_lvl: 1,
      eidolon: 0,
      light_cone: 'Nón Ánh Sáng Tiêu Chuẩn (4★)',
      artifact_set: 'Bộ Duyên Kiếp Băng Tiêu'
    });
    saveDb(data);
    return { isNew: true, eidolon: 0 };
  }
}

function getUserInventory(discordId) {
  const data = readDb();
  if (!data.inventory[discordId]) {
    getUser(discordId);
    return readDb().inventory[discordId] || [];
  }
  return data.inventory[discordId];
}

function getUserTeam(discordId) {
  const data = readDb();
  if (!data.teams[discordId]) {
    getUser(discordId);
    return readDb().teams[discordId];
  }
  return data.teams[discordId];
}

function updateTeam(discordId, slot1, slot2, slot3, slot4) {
  const data = readDb();
  data.teams[discordId] = {
    discord_id: discordId,
    slot1,
    slot2,
    slot3,
    slot4
  };
  saveDb(data);
}

module.exports = {
  getUser,
  addPlayerExp,
  upgradeCharacterLevel,
  upgradeWeaponLevel,
  upgradeSkillLevel,
  addArtifact,
  upgradeArtifact,
  updateUserJades,
  updatePity,
  addTrashItems,
  recycleTrashItems,
  addCharacter,
  getUserInventory,
  getUserTeam,
  updateTeam
};
