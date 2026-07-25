const fs = require('fs');
const path = require('path');

const dbFilePath = path.join(__dirname, '../../database.json');

// Helper to read database
function readDb() {
  if (!fs.existsSync(dbFilePath)) {
    const initialData = { users: {}, inventory: {}, teams: {} };
    fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    const raw = fs.readFileSync(dbFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    const initialData = { users: {}, inventory: {}, teams: {} };
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
      created_at: new Date().toISOString()
    };

    // Starter characters
    if (!data.inventory[discordId]) {
      data.inventory[discordId] = [
        { char_id: 'seele', level: 1, eidolon: 0, light_cone: 'In the Night (5★)', artifact_set: 'Bộ Thợ Lặn Ranh Ma (+20% Quantum DMG)' },
        { char_id: 'dan_heng', level: 1, eidolon: 0, light_cone: 'Only Silence Remains (4★)', artifact_set: 'Bộ Chim Ưng Ranh Ma (+15% Wind DMG)' },
        { char_id: 'march_7th', level: 1, eidolon: 0, light_cone: 'Day One of My New Life (4★)', artifact_set: 'Bộ Vệ Binh Băng Tuyết (+15% DEF)' },
        { char_id: 'natasha', level: 1, eidolon: 0, light_cone: 'Shared Feeling (4★)', artifact_set: 'Bộ Lãng Khách Âm Thầm (+10% Healing)' }
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
  if (data.users[discordId].trash_items === undefined) {
    data.users[discordId].trash_items = 0;
    saveDb(data);
  }
  return data.users[discordId];
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

// Trash 3★ Items management
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

  const jadesGained = trashCount * 20; // 20 Jades per 3★ trash item
  const newJades = user.jades + jadesGained;

  data.users[discordId].trash_items = 0;
  data.users[discordId].jades = newJades;
  saveDb(data);

  return { success: true, count: trashCount, jadesGained, totalJades: newJades };
}

// Add Character to Inventory
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
      eidolon: 0,
      light_cone: 'Nón Ánh Sáng Tiêu Chuẩn (4★)',
      artifact_set: 'Bộ Duyên Kiếp Băng Tiêu'
    });
    saveDb(data);
    return { isNew: true, eidolon: 0 };
  }
}

// Update Equipment for a Character
function updateEquipment(discordId, charId, lightCone, artifactSet) {
  const data = readDb();
  if (!data.inventory[discordId]) return;

  const charItem = data.inventory[discordId].find(item => item.char_id === charId);
  if (charItem) {
    if (lightCone) charItem.light_cone = lightCone;
    if (artifactSet) charItem.artifact_set = artifactSet;
    saveDb(data);
  }
}

// Get Inventory
function getUserInventory(discordId) {
  const data = readDb();
  if (!data.inventory[discordId]) {
    getUser(discordId);
    return readDb().inventory[discordId] || [];
  }
  return data.inventory[discordId];
}

// Get Team
function getUserTeam(discordId) {
  const data = readDb();
  if (!data.teams[discordId]) {
    getUser(discordId);
    return readDb().teams[discordId];
  }
  return data.teams[discordId];
}

// Update Team
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
  updateUserJades,
  updatePity,
  addTrashItems,
  recycleTrashItems,
  addCharacter,
  updateEquipment,
  getUserInventory,
  getUserTeam,
  updateTeam
};
