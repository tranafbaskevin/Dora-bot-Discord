const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const dbFilePath = path.join(__dirname, '../../database.json');
let isMongoConnected = false;

// Define Mongoose Schemas
const userSchema = new mongoose.Schema({
  discord_id: { type: String, required: true, unique: true },
  jades: { type: Number, default: 16000 },
  pity_5star: { type: Number, default: 0 },
  pity_4star: { type: Number, default: 0 },
  is_guaranteed: { type: Boolean, default: false },
  trash_items: { type: Number, default: 0 },
  player_level: { type: Number, default: 1 },
  player_exp: { type: Number, default: 0 },
  materials: {
    char_exp_book: { type: Number, default: 50 },
    weapon_exp_crystal: { type: Number, default: 50 },
    artifact_dust: { type: Number, default: 50 },
    trace_material: { type: Number, default: 30 }
  },
  created_at: { type: String, default: () => new Date().toISOString() }
});

const characterSchema = new mongoose.Schema({
  discord_id: { type: String, required: true },
  char_id: { type: String, required: true },
  level: { type: Number, default: 1 },
  exp: { type: Number, default: 0 },
  weapon_level: { type: Number, default: 1 },
  weapon_exp: { type: Number, default: 0 },
  basic_lvl: { type: Number, default: 1 },
  skill_lvl: { type: Number, default: 1 },
  ult_lvl: { type: Number, default: 1 },
  eidolon: { type: Number, default: 0 },
  light_cone: { type: String, default: 'Nón Ánh Sáng Tiêu Chuẩn (4★)' },
  artifact_set: { type: String, default: 'Bộ Duyên Kiếp Băng Tiêu' }
});

const weaponSchema = new mongoose.Schema({
  discord_id: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  rarity: { type: Number, default: 4 },
  level: { type: Number, default: 1 },
  exp: { type: Number, default: 0 },
  superimpose: { type: Number, default: 1 },
  path: { type: String, default: 'Hunt' },
  passiveDescription: { type: String, default: '' },
  subStats: { type: Array, default: [] },
  char_id: { type: String, default: null }
});

const artifactSchema = new mongoose.Schema({
  discord_id: { type: String, required: true },
  id: { type: String, required: true },
  char_id: { type: String, default: null },
  setName: { type: String, default: 'Bộ Thiện Xạ Trường Hoang' },
  rarity: { type: Number, default: 5 },
  slot: { type: String, default: 'Head' },
  mainStat: { type: String, default: 'CRIT Rate%' },
  mainValue: { type: Number, default: 5.0 },
  level: { type: Number, default: 0 },
  exp: { type: Number, default: 0 },
  subStats: { type: Array, default: [] }
});

const teamSchema = new mongoose.Schema({
  discord_id: { type: String, required: true, unique: true },
  slot1: { type: String, default: 'seele' },
  slot2: { type: String, default: 'dan_heng' },
  slot3: { type: String, default: 'march_7th' },
  slot4: { type: String, default: 'natasha' }
});

const UserModel = mongoose.model('User', userSchema);
const CharacterModel = mongoose.model('Character', characterSchema);
const WeaponModel = mongoose.model('Weapon', weaponSchema);
const ArtifactModel = mongoose.model('Artifact', artifactSchema);
const TeamModel = mongoose.model('Team', teamSchema);

// In-Memory Database Cache for Ultra-Fast Synchronous Execution
let memoryDb = {
  users: {},
  inventory: {},
  weapons: {},
  artifacts: {},
  teams: {}
};

// Read local JSON file
function readLocalDb() {
  if (!fs.existsSync(dbFilePath)) {
    const initialData = { users: {}, inventory: {}, teams: {}, artifacts: {}, weapons: {} };
    fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    const raw = fs.readFileSync(dbFilePath, 'utf8');
    const data = JSON.parse(raw);
    if (!data.artifacts) data.artifacts = {};
    if (!data.weapons) data.weapons = {};
    if (!data.debts) data.debts = {};

    // Auto-Migrate: Assign unique Keycode UIDs & Slots to any existing items without losing data
    let migrationNeeded = false;
    let artSeq = 1000;
    let wpnSeq = 1000;

    // Collect existing keycodes to prevent collisions
    const existingKeycodes = new Set();
    Object.values(data.artifacts).forEach(arts => {
      arts.forEach(a => { if (a.keycode) existingKeycodes.add(a.keycode.toUpperCase()); });
    });
    Object.values(data.weapons).forEach(wpns => {
      wpns.forEach(w => { if (w.keycode) existingKeycodes.add(w.keycode.toUpperCase()); });
    });

    const slots = ['Head', 'Hands', 'Body', 'Feet'];

    Object.keys(data.artifacts).forEach(uid => {
      data.artifacts[uid].forEach((a, idx) => {
        if (!a.keycode) {
          let code;
          do {
            code = `#A-${artSeq++}`;
          } while (existingKeycodes.has(code));
          a.keycode = code;
          existingKeycodes.add(code);
          migrationNeeded = true;
        }
        if (!a.slot) {
          a.slot = slots[idx % slots.length];
          migrationNeeded = true;
        }
        if (!a.equipped_char_id && a.char_id) {
          a.equipped_char_id = a.char_id;
          migrationNeeded = true;
        }
      });
    });

    Object.keys(data.weapons).forEach(uid => {
      data.weapons[uid].forEach(w => {
        if (!w.keycode) {
          let code;
          do {
            code = `#W-${wpnSeq++}`;
          } while (existingKeycodes.has(code));
          w.keycode = code;
          existingKeycodes.add(code);
          migrationNeeded = true;
        }
        if (!w.equipped_char_id && w.char_id) {
          w.equipped_char_id = w.char_id;
          migrationNeeded = true;
        }
      });
    });

    if (migrationNeeded) {
      fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2));
      console.log('✅ Đã Auto-Migrate thành công Mã Keycode UIDs độc nhất toàn Server cho dữ liệu cũ!');
    }

    return data;
  } catch (err) {
    const initialData = { users: {}, inventory: {}, teams: {}, artifacts: {}, weapons: {}, debts: {} };
    fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}

// Save local JSON file
function saveLocalDb() {
  fs.writeFileSync(dbFilePath, JSON.stringify(memoryDb, null, 2));
}

// Persist single user data to MongoDB Cloud
async function syncUserToMongo(discordId) {
  if (!isMongoConnected) return;
  try {
    const u = memoryDb.users[discordId];
    if (u) {
      await UserModel.findOneAndUpdate({ discord_id: discordId }, u, { upsert: true, new: true });
    }

    const inv = memoryDb.inventory[discordId] || [];
    await CharacterModel.deleteMany({ discord_id: discordId });
    if (inv.length > 0) {
      await CharacterModel.insertMany(inv.map(c => ({ ...c, discord_id: discordId })));
    }

    const wpns = memoryDb.weapons[discordId] || [];
    await WeaponModel.deleteMany({ discord_id: discordId });
    if (wpns.length > 0) {
      await WeaponModel.insertMany(wpns.map(w => ({ ...w, discord_id: discordId })));
    }

    const arts = memoryDb.artifacts[discordId] || [];
    await ArtifactModel.deleteMany({ discord_id: discordId });
    if (arts.length > 0) {
      await ArtifactModel.insertMany(arts.map(a => ({ ...a, discord_id: discordId })));
    }

    const t = memoryDb.teams[discordId];
    if (t) {
      await TeamModel.findOneAndUpdate({ discord_id: discordId }, t, { upsert: true, new: true });
    }
  } catch (err) {
    console.error('❌ Lỗi syncUserToMongo:', err);
  }
}

// Initialize Database Connection & Auto-Migration
async function initDatabase() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  memoryDb = readLocalDb();

  if (!mongoUri) {
    console.log('📦 Không tìm thấy MONGODB_URI. Bot đang chạy chế độ Local JSON file.');
    return;
  }

  try {
    console.log('⏳ Đang kết nối tới MongoDB Atlas Cloud Database...');
    await mongoose.connect(mongoUri, {
      connectTimeoutMS: 10000
    });
    isMongoConnected = true;
    console.log('✅ Đã kết nối thành công tới MongoDB Atlas Cloud Database!');

    // Load All Cloud Data into Memory
    const cloudUsers = await UserModel.find({});
    for (const u of cloudUsers) {
      const uObj = u.toObject();
      memoryDb.users[u.discord_id] = uObj;

      const chars = await CharacterModel.find({ discord_id: u.discord_id });
      memoryDb.inventory[u.discord_id] = chars.map(c => c.toObject());

      const wpns = await WeaponModel.find({ discord_id: u.discord_id });
      memoryDb.weapons[u.discord_id] = wpns.map(w => w.toObject());

      const arts = await ArtifactModel.find({ discord_id: u.discord_id });
      memoryDb.artifacts[u.discord_id] = arts.map(a => a.toObject());

      const t = await TeamModel.findOne({ discord_id: u.discord_id });
      if (t) memoryDb.teams[u.discord_id] = t.toObject();
    }

    // Auto-Migrate Local Users if not in MongoDB Cloud
    for (const localId of Object.keys(memoryDb.users)) {
      const existsInCloud = cloudUsers.some(u => u.discord_id === localId);
      if (!existsInCloud) {
        console.log(`🚚 Tự động đồng bộ tài khoản local [${localId}] lên MongoDB Cloud...`);
        await syncUserToMongo(localId);
      }
    }
    console.log('🎉 Đồng bộ toàn bộ dữ liệu người chơi trên Cloud thành công!');
  } catch (err) {
    console.error('❌ Lỗi kết nối MongoDB Atlas:', err);
    console.log('🔄 Tự động chuyển về dùng Local database.json');
  }
}

function normalizeWeaponName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/nón ánh sáng \d★:\s*/gi, '')
    .replace(/\s*\(\d★\)/gi, '')
    .replace(/\s*\([^)]*\)/gi, '')
    .trim();
}

function generateRandomWeaponSubstats(rarity = 4) {
  const subPool = [
    { name: 'ATK%', min: 3.0, max: 8.0, isPercent: true },
    { name: 'CRIT Rate%', min: 2.5, max: 6.0, isPercent: true },
    { name: 'CRIT DMG%', min: 5.0, max: 12.0, isPercent: true },
    { name: 'SPD', min: 2, max: 6, isPercent: false },
    { name: 'DEF%', min: 4.0, max: 9.0, isPercent: true },
    { name: 'HP%', min: 4.0, max: 9.0, isPercent: true },
    { name: 'Hồi EP%', min: 2.0, max: 5.0, isPercent: true },
    { name: 'Tấn Công Phá Vỡ%', min: 5.0, max: 12.0, isPercent: true },
    { name: 'Tăng Hồi Máu%', min: 3.0, max: 7.0, isPercent: true },
    { name: 'Chính Xác Hiệu Ứng%', min: 3.0, max: 8.0, isPercent: true }
  ];

  const count = rarity === 5 ? 4 : (rarity === 4 ? 3 : 2);
  const selected = [];
  while (selected.length < count) {
    const pick = subPool[Math.floor(Math.random() * subPool.length)];
    if (!selected.some(s => s.name === pick.name)) {
      const mult = rarity === 5 ? 1.0 : (rarity === 4 ? 0.8 : 0.6);
      const val = pick.isPercent
        ? parseFloat(((pick.min + Math.random() * (pick.max - pick.min)) * mult).toFixed(1))
        : Math.round((pick.min + Math.random() * (pick.max - pick.min)) * mult);
      selected.push({ name: pick.name, value: val });
    }
  }
  return selected;
}

// Get or Create User
function getUser(discordId) {
  if (!memoryDb.users[discordId]) {
    memoryDb.users[discordId] = {
      discord_id: discordId,
      jades: 16000,
      pity_5star: 0,
      pity_4star: 0,
      is_guaranteed: false,
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

    if (!memoryDb.inventory[discordId]) {
      memoryDb.inventory[discordId] = [
        { char_id: 'seele', level: 1, exp: 0, weapon_level: 1, weapon_exp: 0, basic_lvl: 1, skill_lvl: 1, ult_lvl: 1, eidolon: 0, light_cone: 'In the Night (5★)', artifact_set: 'Bộ Thợ Lặn Ranh Ma' },
        { char_id: 'dan_heng', level: 1, exp: 0, weapon_level: 1, weapon_exp: 0, basic_lvl: 1, skill_lvl: 1, ult_lvl: 1, eidolon: 0, light_cone: 'Only Silence Remains (4★)', artifact_set: 'Bộ Chim Ưng Ranh Ma' },
        { char_id: 'march_7th', level: 1, exp: 0, weapon_level: 1, weapon_exp: 0, basic_lvl: 1, skill_lvl: 1, ult_lvl: 1, eidolon: 0, light_cone: 'Day One of My New Life (4★)', artifact_set: 'Bộ Vệ Binh Băng Tuyết' },
        { char_id: 'natasha', level: 1, exp: 0, weapon_level: 1, weapon_exp: 0, basic_lvl: 1, skill_lvl: 1, ult_lvl: 1, eidolon: 0, light_cone: 'Shared Feeling (4★)', artifact_set: 'Bộ Lãng Khách Âm Thầm' }
      ];
    }

    if (!memoryDb.teams[discordId]) {
      memoryDb.teams[discordId] = {
        discord_id: discordId,
        slot1: 'seele',
        slot2: 'dan_heng',
        slot3: 'march_7th',
        slot4: 'natasha'
      };
    }

    saveLocalDb();
    syncUserToMongo(discordId);
  }

  const u = memoryDb.users[discordId];
  if (u.player_level === undefined) u.player_level = 1;
  if (u.player_exp === undefined) u.player_exp = 0;
  if (u.is_guaranteed === undefined) u.is_guaranteed = false;
  if (!u.materials) {
    u.materials = { char_exp_book: 50, weapon_exp_crystal: 50, artifact_dust: 50, trace_material: 30 };
    saveLocalDb();
    syncUserToMongo(discordId);
  }

  return u;
}

function addAdminResources(discordId) {
  const user = memoryDb.users[discordId] || getUser(discordId);

  user.jades += 100000;
  if (!user.materials) {
    user.materials = { char_exp_book: 50, weapon_exp_crystal: 50, artifact_dust: 50, trace_material: 30 };
  }

  user.materials.char_exp_book = (user.materials.char_exp_book || 0) + 500;
  user.materials.weapon_exp_crystal = (user.materials.weapon_exp_crystal || 0) + 500;
  user.materials.artifact_dust = (user.materials.artifact_dust || 0) + 500;
  user.materials.trace_material = (user.materials.trace_material || 0) + 500;

  saveLocalDb();
  syncUserToMongo(discordId);
  return user;
}

function addPlayerExp(discordId, expGained) {
  const user = memoryDb.users[discordId] || getUser(discordId);
  user.player_exp += expGained;

  let reqExp = user.player_level * 500;
  let leveledUp = false;

  while (user.player_exp >= reqExp && user.player_level < 80) {
    user.player_exp -= reqExp;
    user.player_level += 1;
    user.jades += 300;
    reqExp = user.player_level * 500;
    leveledUp = true;
  }

  saveLocalDb();
  syncUserToMongo(discordId);
  return { leveledUp, newLevel: user.player_level, totalJades: user.jades };
}

function upgradeCharacterLevel(discordId, charId, useMax = true) {
  const user = memoryDb.users[discordId] || getUser(discordId);
  const inv = memoryDb.inventory[discordId] || [];
  const char = inv.find(c => c.char_id === charId);

  let booksAvailable = user.materials?.char_exp_book || 0;
  if (!char || booksAvailable <= 0) {
    return { success: false, message: '❌ Bạn không có Sách Kinh Nghiệm Nhân Vật nào!' };
  }

  if (char.level >= 80) {
    return { success: false, message: '⚠️ Nhân vật đã đạt cấp độ tối đa (Lv 80)!' };
  }

  let booksUsed = 0;
  while (booksAvailable > 0 && char.level < 80) {
    booksAvailable--;
    booksUsed++;
    char.exp = (char.exp || 0) + 1000;

    let reqExp = char.level * 800;
    while (char.exp >= reqExp && char.level < 80) {
      char.exp -= reqExp;
      char.level += 1;
      reqExp = char.level * 800;
    }
  }

  user.materials.char_exp_book = booksAvailable;
  saveLocalDb();
  syncUserToMongo(discordId);

  return {
    success: true,
    newLevel: char.level,
    booksUsed,
    remainingBooks: user.materials.char_exp_book
  };
}

function upgradeWeaponLevel(discordId, charId, useMax = true) {
  const user = memoryDb.users[discordId] || getUser(discordId);
  const inv = memoryDb.inventory[discordId] || [];
  const char = inv.find(c => c.char_id === charId);

  let crystalsAvailable = user.materials?.weapon_exp_crystal || 0;
  if (!char || crystalsAvailable <= 0) {
    return { success: false, message: '❌ Bạn không có Tinh Thể Vũ Khí nào!' };
  }

  if ((char.weapon_level || 1) >= 80) {
    return { success: false, message: '⚠️ Vũ khí đã đạt cấp độ tối đa (Lv 80)!' };
  }

  let crystalsUsed = 0;
  while (crystalsAvailable > 0 && (char.weapon_level || 1) < 80) {
    crystalsAvailable--;
    crystalsUsed++;
    char.weapon_exp = (char.weapon_exp || 0) + 1000;

    let reqExp = (char.weapon_level || 1) * 800;
    while (char.weapon_exp >= reqExp && (char.weapon_level || 1) < 80) {
      char.weapon_exp -= reqExp;
      char.weapon_level = (char.weapon_level || 1) + 1;
      reqExp = char.weapon_level * 800;
    }
  }

  if (memoryDb.weapons && memoryDb.weapons[discordId]) {
    const normTarget = normalizeWeaponName(char.light_cone);
    const wpn = memoryDb.weapons[discordId].find(w => w.char_id === charId || normalizeWeaponName(w.name) === normTarget);
    if (wpn) {
      wpn.level = char.weapon_level;
      wpn.char_id = charId;
    }
  }

  user.materials.weapon_exp_crystal = crystalsAvailable;
  saveLocalDb();
  syncUserToMongo(discordId);

  return {
    success: true,
    newLevel: char.weapon_level,
    crystalsUsed,
    remainingCrystals: user.materials.weapon_exp_crystal
  };
}

function upgradeSkillLevel(discordId, charId, skillType) {
  const user = memoryDb.users[discordId] || getUser(discordId);
  const inv = memoryDb.inventory[discordId] || [];
  const char = inv.find(c => c.char_id === charId);

  const cost = 5;
  if (!char || (user.materials?.trace_material || 0) < cost) {
    return { success: false, message: '❌ Không đủ Vật Liệu Vết Kích Kỹ Năng (Cần 5 vật liệu)!' };
  }

  const key = `${skillType}_lvl`;
  const maxLvl = skillType === 'basic' ? 6 : 10;

  if ((char[key] || 1) >= maxLvl) {
    return { success: false, message: `⚠️ Kỹ năng này đã đạt cấp tối đa (${maxLvl})!` };
  }

  user.materials.trace_material -= cost;
  char[key] = (char[key] || 1) + 1;

  saveLocalDb();
  syncUserToMongo(discordId);
  return { success: true, skillType, newLevel: char[key], remainingMaterials: user.materials.trace_material };
}

function generateUniqueKeycode(type = 'art') {
  const prefix = type === 'art' ? '#A-' : '#W-';
  const existingKeycodes = new Set();

  if (memoryDb.artifacts) {
    Object.values(memoryDb.artifacts).forEach(arts => {
      arts.forEach(a => { if (a.keycode) existingKeycodes.add(a.keycode.toUpperCase()); });
    });
  }
  if (memoryDb.weapons) {
    Object.values(memoryDb.weapons).forEach(wpns => {
      wpns.forEach(w => { if (w.keycode) existingKeycodes.add(w.keycode.toUpperCase()); });
    });
  }

  let code;
  let seq = Math.floor(Math.random() * 8999) + 1000;
  do {
    code = `${prefix}${seq++}`;
  } while (existingKeycodes.has(code));

  return code;
}

function addArtifact(discordId, artifact) {
  if (!memoryDb.artifacts) memoryDb.artifacts = {};
  if (!memoryDb.artifacts[discordId]) memoryDb.artifacts[discordId] = [];

  const rarity = artifact.rarity || 5;
  const keycode = artifact.keycode || generateUniqueKeycode('art');

  const newArt = {
    id: `art_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    keycode: keycode,
    char_id: artifact.char_id || null,
    equipped_char_id: artifact.equipped_char_id || artifact.char_id || null,
    setName: artifact.setName || 'Bộ Thiện Xạ Trường Hoang',
    rarity: rarity,
    slot: artifact.slot || 'Head',
    mainStat: artifact.mainStat || 'CRIT Rate%',
    mainValue: artifact.mainValue || (rarity === 5 ? 5.0 : 3.2),
    level: 0,
    exp: 0,
    subStats: artifact.subStats || [
      { name: 'ATK%', value: rarity === 5 ? 3.5 : 2.2 },
      { name: 'SPD', value: 2 },
      { name: 'CRIT DMG%', value: rarity === 5 ? 5.0 : 3.0 }
    ]
  };

  memoryDb.artifacts[discordId].push(newArt);
  saveLocalDb();
  syncUserToMongo(discordId);
  return newArt;
}

function addWeapon(discordId, weapon) {
  if (!memoryDb.weapons) memoryDb.weapons = {};
  if (!memoryDb.weapons[discordId]) {
    memoryDb.weapons[discordId] = [
      { id: 'wpn_seele', keycode: '#W-1000', name: 'In the Night (5★)', rarity: 5, level: 1, superimpose: 1, path: 'Hunt', passiveDescription: 'Tăng +18% Tỷ lệ Bạo Kích. Với mỗi 10 SPD vượt quá 100, tăng +6% Sát thương Đánh Thường & Chiến Kỹ.', subStats: generateRandomWeaponSubstats(5), char_id: 'seele', equipped_char_id: 'seele' },
      { id: 'wpn_danheng', keycode: '#W-1001', name: 'Only Silence Remains (4★)', rarity: 4, level: 1, superimpose: 1, path: 'Hunt', passiveDescription: 'Tăng +24% ATK. Khi có ít hơn 2 kẻ địch trên sân đấu, tăng +12% Tỷ lệ Bạo Kích.', subStats: generateRandomWeaponSubstats(4), char_id: 'dan_heng', equipped_char_id: 'dan_heng' },
      { id: 'wpn_march', keycode: '#W-1002', name: 'Day One of My New Life (4★)', rarity: 4, level: 1, superimpose: 1, path: 'Preservation', passiveDescription: 'Tăng +16% DEF. Giảm 8% Sát thương gánh chịu cho toàn bộ đồng đội.', subStats: generateRandomWeaponSubstats(4), char_id: 'march_7th', equipped_char_id: 'march_7th' },
      { id: 'wpn_natasha', keycode: '#W-1003', name: 'Shared Feeling (4★)', rarity: 4, level: 1, superimpose: 1, path: 'Abundance', passiveDescription: 'Tăng +10% Lượng Hồi Máu. Khi thi triển Chiến Kỹ, hồi +2 EP cho đồng đội.', subStats: generateRandomWeaponSubstats(4), char_id: 'natasha', equipped_char_id: 'natasha' }
    ];
  }

  const normTarget = normalizeWeaponName(weapon.name);

  const existing = memoryDb.weapons[discordId].find(w => {
    const normExist = normalizeWeaponName(w.name);
    return normExist === normTarget || normExist.includes(normTarget) || normTarget.includes(normExist);
  });

  if (existing) {
    existing.superimpose = Math.min(5, (existing.superimpose || 1) + 1);
    if (!existing.keycode) existing.keycode = generateUniqueKeycode('wpn');
    saveLocalDb();
    syncUserToMongo(discordId);
    return { isNew: false, superimpose: existing.superimpose, weapon: existing };
  } else {
    const keycode = weapon.keycode || generateUniqueKeycode('wpn');
    const newWpn = {
      id: `wpn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      keycode: keycode,
      name: weapon.name,
      rarity: weapon.rarity || 4,
      level: 1,
      exp: 0,
      superimpose: 1,
      path: weapon.path || 'Hunt',
      passiveDescription: weapon.passiveDescription || 'Tăng sát thương và các chỉ số bổ trợ cho nhân vật trang bị.',
      subStats: generateRandomWeaponSubstats(weapon.rarity || 4),
      char_id: null,
      equipped_char_id: null
    };
    memoryDb.weapons[discordId].push(newWpn);
    saveLocalDb();
    syncUserToMongo(discordId);
    return { isNew: true, superimpose: 1, weapon: newWpn };
  }
}

function getUserWeapons(discordId) {
  if (!memoryDb.weapons) memoryDb.weapons = {};
  if (!memoryDb.weapons[discordId]) {
    memoryDb.weapons[discordId] = [
      { id: 'wpn_seele', keycode: '#W-1000', name: 'In the Night (5★)', rarity: 5, level: 1, superimpose: 1, path: 'Hunt', passiveDescription: 'Tăng +18% Tỷ lệ Bạo Kích. Với mỗi 10 SPD vượt quá 100, tăng +6% Sát thương Đánh Thường & Chiến Kỹ.', subStats: generateRandomWeaponSubstats(5), char_id: 'seele', equipped_char_id: 'seele' },
      { id: 'wpn_danheng', keycode: '#W-1001', name: 'Only Silence Remains (4★)', rarity: 4, level: 1, superimpose: 1, path: 'Hunt', passiveDescription: 'Tăng +24% ATK. Khi có ít hơn 2 kẻ địch trên sân đấu, tăng +12% Tỷ lệ Bạo Kích.', subStats: generateRandomWeaponSubstats(4), char_id: 'dan_heng', equipped_char_id: 'dan_heng' },
      { id: 'wpn_march', keycode: '#W-1002', name: 'Day One of My New Life (4★)', rarity: 4, level: 1, superimpose: 1, path: 'Preservation', passiveDescription: 'Tăng +16% DEF. Giảm 8% Sát thương gánh chịu cho toàn bộ đồng đội.', subStats: generateRandomWeaponSubstats(4), char_id: 'march_7th', equipped_char_id: 'march_7th' },
      { id: 'wpn_natasha', keycode: '#W-1003', name: 'Shared Feeling (4★)', rarity: 4, level: 1, superimpose: 1, path: 'Abundance', passiveDescription: 'Tăng +10% Lượng Hồi Máu. Khi thi triển Chiến Kỹ, hồi +2 EP cho đồng đội.', subStats: generateRandomWeaponSubstats(4), char_id: 'natasha', equipped_char_id: 'natasha' }
    ];
    saveLocalDb();
    syncUserToMongo(discordId);
  }

  const userInv = memoryDb.inventory[discordId] || [];
  let updated = false;
  memoryDb.weapons[discordId].forEach(w => {
    if (!w.keycode) {
      w.keycode = generateUniqueKeycode('wpn');
      updated = true;
    }
    const invChar = userInv.find(c => c.char_id === w.char_id || normalizeWeaponName(c.light_cone) === normalizeWeaponName(w.name));
    if (invChar && invChar.weapon_level && invChar.weapon_level > (w.level || 1)) {
      w.level = invChar.weapon_level;
      if (!w.char_id) w.char_id = invChar.char_id;
      if (!w.equipped_char_id) w.equipped_char_id = invChar.char_id;
      updated = true;
    }
  });

  if (updated) {
    saveLocalDb();
    syncUserToMongo(discordId);
  }

  return memoryDb.weapons[discordId];
}

function upgradeArtifact(discordId, artifactIdentifier, dustToUse = 5) {
  const user = memoryDb.users[discordId] || getUser(discordId);
  const userArts = memoryDb.artifacts[discordId] || [];
  const art = userArts.find(a => (a.id === artifactIdentifier) || (a.keycode && a.keycode.toUpperCase() === artifactIdentifier.toUpperCase()));

  let dustAvailable = user.materials?.artifact_dust || 0;
  if (!art || dustAvailable <= 0) {
    return { success: false, message: '❌ Không đủ Bụi Vàng Cường Hóa Di Vật!' };
  }

  if (art.level >= 15) {
    return { success: false, message: '⚠️ Di vật đã đạt cấp độ cường hóa tối đa (+15)!' };
  }

  let dustUsed = 0;
  const subStatPool = ['ATK%', 'DEF%', 'HP%', 'CRIT Rate%', 'CRIT DMG%', 'SPD', 'Quantum DMG%', 'Fire DMG%'];
  let upgradedSubNames = [];

  while (dustAvailable > 0 && art.level < 15) {
    dustAvailable--;
    dustUsed++;
    art.exp = (art.exp || 0) + 500;

    let reqExp = (art.level + 1) * 600;
    while (art.exp >= reqExp && art.level < 15) {
      art.exp -= reqExp;
      art.level += 1;
      art.mainValue += 1.8;

      if (art.level % 3 === 0) {
        if (!art.subStats) art.subStats = [];
        if (art.subStats.length < 4) {
          const nextStat = subStatPool[Math.floor(Math.random() * subStatPool.length)];
          art.subStats.push({ name: nextStat, value: 3.2 });
          upgradedSubNames.push(`Mở dòng mới: ${nextStat}`);
        } else {
          const randSubIndex = Math.floor(Math.random() * art.subStats.length);
          const rollBoost = 2.0 + Math.random() * 2.5;
          art.subStats[randSubIndex].value += rollBoost;
          upgradedSubNames.push(`Cộng dồn dòng: ${art.subStats[randSubIndex].name} (+${rollBoost.toFixed(1)})`);
        }
      }
      reqExp = (art.level + 1) * 600;
    }
  }

  user.materials.artifact_dust = dustAvailable;
  saveLocalDb();
  syncUserToMongo(discordId);

  return {
    success: true,
    newLevel: art.level,
    mainValue: art.mainValue,
    subStats: art.subStats || [],
    upgradedSubNames,
    dustUsed,
    remainingDust: user.materials.artifact_dust
  };
}

function setGuaranteedState(discordId, state) {
  if (memoryDb.users[discordId]) {
    memoryDb.users[discordId].is_guaranteed = state;
    saveLocalDb();
    syncUserToMongo(discordId);
  }
}

function updateUserJades(discordId, newJades) {
  if (memoryDb.users[discordId]) {
    memoryDb.users[discordId].jades = newJades;
    saveLocalDb();
    syncUserToMongo(discordId);
  }
}

function updatePity(discordId, pity5, pity4) {
  if (memoryDb.users[discordId]) {
    memoryDb.users[discordId].pity_5star = pity5;
    memoryDb.users[discordId].pity_4star = pity4;
    saveLocalDb();
    syncUserToMongo(discordId);
  }
}

function addTrashItems(discordId, count) {
  const user = getUser(discordId);
  memoryDb.users[discordId].trash_items = (memoryDb.users[discordId].trash_items || 0) + count;
  saveLocalDb();
  syncUserToMongo(discordId);
}

function recycleTrashItems(discordId) {
  const user = getUser(discordId);
  let trashCount = memoryDb.users[discordId].trash_items || 0;

  if (memoryDb.weapons && memoryDb.weapons[discordId]) {
    const trash3Wpns = memoryDb.weapons[discordId].filter(w => w.rarity === 3);
    trashCount += trash3Wpns.length;
    memoryDb.weapons[discordId] = memoryDb.weapons[discordId].filter(w => w.rarity !== 3);
  }

  if (trashCount <= 0) {
    return { success: false, count: 0, jadesGained: 0, totalJades: user.jades };
  }

  const jadesGained = trashCount * 20;
  const newJades = user.jades + jadesGained;

  memoryDb.users[discordId].trash_items = 0;
  memoryDb.users[discordId].jades = newJades;
  saveLocalDb();
  syncUserToMongo(discordId);

  return { success: true, count: trashCount, jadesGained, totalJades: newJades };
}

function addCharacter(discordId, charId) {
  if (!memoryDb.inventory[discordId]) {
    memoryDb.inventory[discordId] = [];
  }

  const existing = memoryDb.inventory[discordId].find(item => item.char_id === charId);
  if (existing) {
    existing.eidolon = Math.min(6, existing.eidolon + 1);
    saveLocalDb();
    syncUserToMongo(discordId);
    return { isNew: false, eidolon: existing.eidolon };
  } else {
    memoryDb.inventory[discordId].push({
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
    saveLocalDb();
    syncUserToMongo(discordId);
    return { isNew: true, eidolon: 0 };
  }
}

function getUserInventory(discordId) {
  if (!memoryDb.inventory[discordId]) {
    getUser(discordId);
    return memoryDb.inventory[discordId] || [];
  }
  return memoryDb.inventory[discordId];
}

function getUserTeam(discordId) {
  if (!memoryDb.teams[discordId]) {
    getUser(discordId);
    return memoryDb.teams[discordId];
  }
  return memoryDb.teams[discordId];
}

function updateTeam(discordId, slot1, slot2, slot3, slot4) {
  memoryDb.teams[discordId] = {
    discord_id: discordId,
    slot1,
    slot2,
    slot3,
    slot4
  };
  saveLocalDb();
  syncUserToMongo(discordId);
}

function getUserArtifacts(discordId) {
  if (!memoryDb.artifacts) memoryDb.artifacts = {};
  if (!memoryDb.artifacts[discordId]) memoryDb.artifacts[discordId] = [];
  return memoryDb.artifacts[discordId];
}

function equipArtifactByKeycode(discordId, keycode, charId) {
  const userArts = getUserArtifacts(discordId);
  const targetArt = userArts.find(a => a.keycode && a.keycode.toUpperCase() === keycode.toUpperCase());

  if (!targetArt) {
    return { success: false, message: `❌ Không tìm thấy Thánh Di Vật có mã \`${keycode}\` trong kho!` };
  }

  // Exclusive Constraint: If currently equipped on another character, auto-unequip
  if (targetArt.equipped_char_id && targetArt.equipped_char_id !== charId) {
    const prevChar = targetArt.equipped_char_id;
    targetArt.equipped_char_id = null;
    targetArt.char_id = null;
  }

  // If character already has an artifact in the SAME slot, unequip that old piece
  const oldArtInSlot = userArts.find(a => a.equipped_char_id === charId && a.slot === targetArt.slot && a.keycode !== targetArt.keycode);
  if (oldArtInSlot) {
    oldArtInSlot.equipped_char_id = null;
    oldArtInSlot.char_id = null;
  }

  targetArt.equipped_char_id = charId;
  targetArt.char_id = charId;

  saveLocalDb();
  syncUserToMongo(discordId);
  return { success: true, artifact: targetArt, slot: targetArt.slot };
}

function equipWeaponByKeycode(discordId, keycode, charId) {
  const userWpns = getUserWeapons(discordId);
  const targetWpn = userWpns.find(w => w.keycode && w.keycode.toUpperCase() === keycode.toUpperCase());

  if (!targetWpn) {
    return { success: false, message: `❌ Không tìm thấy Nón Ánh Sáng có mã \`${keycode}\` trong kho!` };
  }

  // Auto-unequip if equipped on another character
  if (targetWpn.equipped_char_id && targetWpn.equipped_char_id !== charId) {
    targetWpn.equipped_char_id = null;
    targetWpn.char_id = null;
  }

  // Unequip old weapon from this character
  userWpns.forEach(w => {
    if (w.equipped_char_id === charId && w.keycode !== targetWpn.keycode) {
      w.equipped_char_id = null;
      w.char_id = null;
    }
  });

  targetWpn.equipped_char_id = charId;
  targetWpn.char_id = charId;

  const invRecord = getUserInventory(discordId).find(c => c.char_id === charId);
  if (invRecord) {
    invRecord.light_cone = targetWpn.name;
    invRecord.weapon_level = targetWpn.level;
  }

  saveLocalDb();
  syncUserToMongo(discordId);
  return { success: true, weapon: targetWpn };
}

function dismantleItemsByKeycodes(discordId, keycodes) {
  const user = getUser(discordId);
  const userArts = getUserArtifacts(discordId);
  const userWpns = getUserWeapons(discordId);

  let dustGained = 0;
  let crystalsGained = 0;
  let dismantledNames = [];
  let remainingArts = [];
  let remainingWpns = [];

  const codeSet = new Set(keycodes.map(k => k.toUpperCase().trim()));

  userArts.forEach(a => {
    if (a.keycode && codeSet.has(a.keycode.toUpperCase())) {
      if (a.equipped_char_id) {
        // Warning: cannot dismantle currently equipped artifact
        remainingArts.push(a);
      } else {
        const val = 50 + (a.level || 0) * 100;
        dustGained += val;
        dismantledNames.push(`Di Vật ${a.setName} [${a.keycode}]`);
      }
    } else {
      remainingArts.push(a);
    }
  });

  userWpns.forEach(w => {
    if (w.keycode && codeSet.has(w.keycode.toUpperCase())) {
      if (w.equipped_char_id) {
        remainingWpns.push(w);
      } else {
        const val = (w.rarity || 4) * 20 + (w.level || 1) * 10;
        crystalsGained += val;
        dismantledNames.push(`Vũ Khí ${w.name} [${w.keycode}]`);
      }
    } else {
      remainingWpns.push(w);
    }
  });

  if (dismantledNames.length === 0) {
    return { success: false, message: '❌ Không tìm thấy trang bị hợp lệ để rã (Trang bị đang đeo không thể rã)!' };
  }

  memoryDb.artifacts[discordId] = remainingArts;
  memoryDb.weapons[discordId] = remainingWpns;

  user.materials.artifact_dust = (user.materials.artifact_dust || 0) + dustGained;
  user.materials.weapon_exp_crystal = (user.materials.weapon_exp_crystal || 0) + crystalsGained;

  saveLocalDb();
  syncUserToMongo(discordId);

  return {
    success: true,
    count: dismantledNames.length,
    dismantledNames,
    dustGained,
    crystalsGained,
    totalDust: user.materials.artifact_dust,
    totalCrystals: user.materials.weapon_exp_crystal
  };
}

function feedFodderItemsByKeycodes(discordId, targetKeycode, fodderKeycodes) {
  const userArts = getUserArtifacts(discordId);
  const userWpns = getUserWeapons(discordId);

  const targetArt = userArts.find(a => a.keycode && a.keycode.toUpperCase() === targetKeycode.toUpperCase());
  const targetWpn = userWpns.find(w => w.keycode && w.keycode.toUpperCase() === targetKeycode.toUpperCase());

  if (!targetArt && !targetWpn) {
    return { success: false, message: `❌ Không tìm thấy trang bị mục tiêu \`${targetKeycode}\`!` };
  }

  let totalExpGained = 0;
  const fodderSet = new Set(fodderKeycodes.map(k => k.toUpperCase().trim()));

  if (targetArt) {
    memoryDb.artifacts[discordId] = userArts.filter(a => {
      if (a.keycode && fodderSet.has(a.keycode.toUpperCase()) && !a.equipped_char_id) {
        totalExpGained += 600 + (a.level || 0) * 400;
        return false;
      }
      return true;
    });

    targetArt.exp = (targetArt.exp || 0) + totalExpGained;
    let reqExp = (targetArt.level + 1) * 600;
    while (targetArt.exp >= reqExp && targetArt.level < 15) {
      targetArt.exp -= reqExp;
      targetArt.level += 1;
      targetArt.mainValue += 1.8;
      reqExp = (targetArt.level + 1) * 600;
    }
  } else if (targetWpn) {
    memoryDb.weapons[discordId] = userWpns.filter(w => {
      if (w.keycode && fodderSet.has(w.keycode.toUpperCase()) && !w.equipped_char_id) {
        totalExpGained += 800 + (w.level || 1) * 500;
        return false;
      }
      return true;
    });

    targetWpn.exp = (targetWpn.exp || 0) + totalExpGained;
    let reqExp = targetWpn.level * 800;
    while (targetWpn.exp >= reqExp && targetWpn.level < 80) {
      targetWpn.exp -= reqExp;
      targetWpn.level += 1;
      reqExp = targetWpn.level * 800;
    }
  }

  saveLocalDb();
  syncUserToMongo(discordId);
  return { success: true, totalExpGained, item: targetArt || targetWpn };
}

function giveItemByKeycode(senderId, recipientId, keycode) {
  const senderArts = getUserArtifacts(senderId);
  const senderWpns = getUserWeapons(senderId);

  const artIndex = senderArts.findIndex(a => a.keycode && a.keycode.toUpperCase() === keycode.toUpperCase());
  const wpnIndex = senderWpns.findIndex(w => w.keycode && w.keycode.toUpperCase() === keycode.toUpperCase());

  if (artIndex === -1 && wpnIndex === -1) {
    return { success: false, message: `❌ Không tìm thấy Vũ Khí hoặc Thánh Di Vật có mã \`${keycode}\` trong kho của bạn!` };
  }

  if (!memoryDb.artifacts[recipientId]) memoryDb.artifacts[recipientId] = [];
  if (!memoryDb.weapons[recipientId]) memoryDb.weapons[recipientId] = [];

  let givenItemName = '';

  if (artIndex !== -1) {
    const art = senderArts[artIndex];
    if (art.equipped_char_id) {
      return { success: false, message: `⚠️ Món di vật \`${keycode}\` đang được trang bị bởi nhân vật! Hãy tháo ra trước khi tặng.` };
    }
    art.equipped_char_id = null;
    art.char_id = null;
    memoryDb.artifacts[recipientId].push(art);
    senderArts.splice(artIndex, 1);
    givenItemName = `Thánh Di Vật ${art.setName} [${art.keycode}]`;
  } else if (wpnIndex !== -1) {
    const wpn = senderWpns[wpnIndex];
    if (wpn.equipped_char_id) {
      return { success: false, message: `⚠️ Nón Ánh Sáng \`${keycode}\` đang được trang bị bởi nhân vật! Hãy tháo ra trước khi tặng.` };
    }
    wpn.equipped_char_id = null;
    wpn.char_id = null;
    memoryDb.weapons[recipientId].push(wpn);
    senderWpns.splice(wpnIndex, 1);
    givenItemName = `Vũ Khí ${wpn.name} [${wpn.keycode}]`;
  }

  saveLocalDb();
  syncUserToMongo(senderId);
  syncUserToMongo(recipientId);

  return { success: true, itemName: givenItemName };
}

function createBorrowRequest(borrowerId, lenderId, amount) {
  const borrower = getUser(borrowerId);
  const lender = getUser(lenderId);

  if (!memoryDb.debts) memoryDb.debts = {};

  // Check if borrower already has an active debt
  if (memoryDb.debts[borrowerId] && memoryDb.debts[borrowerId].remaining > 0) {
    const activeDebt = memoryDb.debts[borrowerId];
    return {
      success: false,
      message: `⚠️ Bạn đang có khoản nợ **${activeDebt.remaining.toLocaleString()} Jades** với <@${activeDebt.lender_id}> chưa hoàn trả xong! Không thể vay mượn tiếp.`
    };
  }

  if (lender.jades < amount) {
    return {
      success: false,
      message: `❌ Người chơi <@${lenderId}> không có đủ **${amount.toLocaleString()} Jades** để cho vay!`
    };
  }

  return { success: true, borrowerId, lenderId, amount };
}

function acceptBorrowRequest(borrowerId, lenderId, amount) {
  const borrower = getUser(borrowerId);
  const lender = getUser(lenderId);

  if (lender.jades < amount) {
    return { success: false, message: '❌ Số dư Jades của bạn không đủ để hoàn tất giao dịch cho vay!' };
  }

  lender.jades -= amount;
  borrower.jades += amount;

  if (!memoryDb.debts) memoryDb.debts = {};
  memoryDb.debts[borrowerId] = {
    borrower_id: borrowerId,
    lender_id: lenderId,
    total_amount: amount,
    remaining: amount,
    created_at: new Date().toISOString()
  };

  saveLocalDb();
  syncUserToMongo(borrowerId);
  syncUserToMongo(lenderId);

  return { success: true, borrowerJades: borrower.jades, lenderJades: lender.jades };
}

function repayDebtOnFarm(borrowerId, jadesEarned) {
  if (!memoryDb.debts || !memoryDb.debts[borrowerId]) return { repaid: 0, debtCleared: false };

  const debt = memoryDb.debts[borrowerId];
  if (!debt || debt.remaining <= 0) return { repaid: 0, debtCleared: false };

  const repayAmount = Math.min(jadesEarned, debt.remaining);
  debt.remaining -= repayAmount;

  const lender = getUser(debt.lender_id);
  lender.jades += repayAmount;

  const debtCleared = debt.remaining <= 0;
  if (debtCleared) {
    delete memoryDb.debts[borrowerId];
  }

  saveLocalDb();
  syncUserToMongo(debt.lender_id);
  syncUserToMongo(borrowerId);

  return {
    repaid: repayAmount,
    debtRemaining: debt.remaining,
    lenderId: debt.lender_id,
    debtCleared
  };
}

module.exports = {
  initDatabase,
  getUser,
  addAdminResources,
  addPlayerExp,
  upgradeCharacterLevel,
  upgradeWeaponLevel,
  upgradeSkillLevel,
  addArtifact,
  upgradeArtifact,
  addWeapon,
  getUserWeapons,
  getUserArtifacts,
  equipArtifactByKeycode,
  equipWeaponByKeycode,
  dismantleItemsByKeycodes,
  feedFodderItemsByKeycodes,
  giveItemByKeycode,
  createBorrowRequest,
  acceptBorrowRequest,
  repayDebtOnFarm,
  generateRandomWeaponSubstats,
  setGuaranteedState,
  updateUserJades,
  updatePity,
  addTrashItems,
  recycleTrashItems,
  addCharacter,
  getUserInventory,
  getUserTeam,
  updateTeam
};

