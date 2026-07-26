const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const equipmentCommand = new SlashCommandBuilder()
  .setName('equipment')
  .setDescription('Quản lý trang bị: Chọn nhân vật -> Đổi Vũ Khí hoặc Thánh Di Vật');

function getAvatarAttachment(char) {
  if (!char || !char.icon) return { url: null, attachment: null };
  if (char.icon.startsWith('http')) return { url: char.icon, attachment: null };

  const localPath = path.join(__dirname, '../../', char.icon);
  if (fs.existsSync(localPath)) {
    const ext = path.extname(localPath).replace('.', '') || 'jpg';
    const filename = `avatar_${char.id}.${ext}`;
    const attachment = new AttachmentBuilder(localPath, { name: filename });
    return { url: `attachment://${filename}`, attachment };
  }
  return { url: null, attachment: null };
}

async function executeEquipment(interaction) {
  const userId = interaction.user.id;
  const userInv = db.getUserInventory(userId);

  if (userInv.length === 0) {
    return interaction.reply({ content: '⚠️ Bạn chưa có nhân vật nào trong túi đồ!', ephemeral: true });
  }

  // Step 1 Embed: Select Character
  const step1Embed = new EmbedBuilder()
    .setTitle('🛡️ TRUNG TÂM QUẢN LÝ TRANG BỊ - BƯỚC 1: CHỌN NHÂN VẬT')
    .setColor('#3b82f6')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setDescription('Hãy chọn 1 nhân vật bên dưới để xem và thay đổi **Vũ Khí (Nón Ánh Sáng)** hoặc **Thánh Di Vật**:');

  const charOptions = userInv.map(inv => {
    const char = charactersData.find(c => c.id === inv.char_id);
    if (!char) return null;
    return {
      label: `${char.name} (Lv.${inv.level || 1})`,
      description: `Nguyên tố: ${char.element} | Vận mệnh: ${char.path}`,
      value: `char_equip_${char.id}`,
      emoji: '👤'
    };
  }).filter(Boolean);

  const charMenu = new StringSelectMenuBuilder()
    .setCustomId('equip_step1_char_menu')
    .setPlaceholder('1. Chọn Nhân Vật Muốn Thay Đổi Trang Bị...')
    .addOptions(charOptions);

  const row1 = new ActionRowBuilder().addComponents(charMenu);

  const response = await interaction.reply({
    embeds: [step1Embed],
    components: [row1],
    fetchReply: true
  });

  // STRICT MESSAGE-SPECIFIC COLLECTOR (PER-USER & PER-MESSAGE ISOLATION)
  const collector = response.createMessageComponentCollector({
    filter: i => i.message.id === response.id && i.user.id === userId,
    time: 300000
  });

  collector.on('collect', async i => {
    if (i.message.id !== response.id || i.user.id !== userId) return;

    const customId = i.customId;

    // Step 1 -> Step 2: Character selected from dropdown
    if (customId === 'equip_step1_char_menu') {
      await i.deferUpdate().catch(() => {});

      const charId = i.values[0].replace('char_equip_', '');
      const char = charactersData.find(c => c.id === charId) || charactersData[0];
      const invRec = userInv.find(rec => rec.char_id === charId) || { level: 1, weapon_level: 1, light_cone: 'Nón Ánh Sáng Tiêu Chuẩn', artifact_set: 'Bộ Duyên Kiếp' };

      const userWpns = db.getUserWeapons(userId);
      const equippedWpn = userWpns.find(w => w.char_id === charId || w.name.includes(invRec.light_cone)) || { name: invRec.light_cone, superimpose: 1, level: invRec.weapon_level || 1 };
      const wpnLvl = Math.max(invRec.weapon_level || 1, equippedWpn.level || 1);

      const avatarInfo = getAvatarAttachment(char);

      const step2Embed = new EmbedBuilder()
        .setTitle(`🛡️ TRANG BỊ HIỆN TẠI: ${char.name.toUpperCase()} (Lv.${invRec.level || 1})`)
        .setColor(char.color || '#3b82f6')
        .setDescription(`Nhân vật: **${char.name}** | Nguyên tố: **${char.element}** | Vận mệnh: **${char.path}**`)
        .addFields(
          {
            name: '⚔️ Vũ Khí / Nón Ánh Sáng Đang Đeo',
            value: `• **${equippedWpn.name}**\n  Cấp độ: **Lv.${wpnLvl} / 80** | Tích chồng: **S${equippedWpn.superimpose || 1}**`,
            inline: false
          },
          {
            name: '🔮 Bộ Thánh Di Vật Đang Đeo',
            value: `• **${invRec.artifact_set || 'Bộ Tiêu Chuẩn (5★)'}**\n  Hiệu ứng: Tăng +15% Sát Thương Thuộc Tính & +10% CRIT Rate`,
            inline: false
          }
        )
        .setFooter({ text: 'Chọn 1 trong 2 nút bên dưới để Đổi Vũ Khí hoặc Đổi Thánh Di Vật!' });

      if (avatarInfo.url) step2Embed.setThumbnail(avatarInfo.url);

      const actionButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`btn_swap_wpn_${charId}`).setLabel(`⚔️ Đổi Vũ Khí Cho ${char.name}`).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`btn_swap_art_${charId}`).setLabel(`🔮 Đổi Di Vật Cho ${char.name}`).setStyle(ButtonStyle.Primary)
      );

      const updatePayload = { embeds: [step2Embed], components: [actionButtons] };
      if (avatarInfo.attachment) updatePayload.files = [avatarInfo.attachment];

      await i.editReply(updatePayload).catch(err => console.error('❌ Lỗi editReply Step 2 Equipment:', err));
    }

    // Step 2 -> Step 3A: Click "Swap Weapon" Button
    else if (customId.startsWith('btn_swap_wpn_')) {
      await i.deferUpdate().catch(() => {});

      const charId = customId.replace('btn_swap_wpn_', '');
      const char = charactersData.find(c => c.id === charId) || charactersData[0];
      const userWpns = db.getUserWeapons(userId);

      if (userWeapons.length === 0) {
        return i.followUp({ content: '⚠️ Bạn không có Nón Ánh Sáng nào trong kho! Hãy quay Gacha ở `/gacha`!', ephemeral: true });
      }

      const wpnOptions = userWpns.map(w => ({
        label: `${w.name} (S${w.superimpose || 1} - Lv.${w.level || 1})`,
        description: w.char_id ? `Đang dùng cho ${w.char_id.toUpperCase()}` : 'Chưa ai sử dụng',
        value: `select_wpn_${charId}_${w.id}`,
        emoji: '⚔️'
      }));

      const wpnSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('menu_do_equip_wpn')
        .setPlaceholder(`Chọn Vũ Khí muốn trang bị cho ${char.name}...`)
        .addOptions(wpnOptions);

      const wpnRow = new ActionRowBuilder().addComponents(wpnSelectMenu);

      const step3WpnEmbed = new EmbedBuilder()
        .setTitle(`⚔️ THAY ĐỔI VŨ KHÍ CHO ${char.name.toUpperCase()}`)
        .setColor('#eab308')
        .setDescription(`Chọn Nón Ánh Sáng từ danh sách kho trang bị bên dưới để trang bị cho **${char.name}**:`);

      await i.editReply({ embeds: [step3WpnEmbed], components: [wpnRow] });
    }

    // Step 2 -> Step 3B: Click "Swap Artifact" Button
    else if (customId.startsWith('btn_swap_art_')) {
      await i.deferUpdate().catch(() => {});

      const charId = customId.replace('btn_swap_art_', '');
      const char = charactersData.find(c => c.id === charId) || charactersData[0];

      const rawDb = JSON.parse(fs.readFileSync(path.join(__dirname, '../../database.json'), 'utf8'));
      const userArts = (rawDb.artifacts && rawDb.artifacts[userId]) || [];

      const availableSets = [
        { name: 'Bộ Thiện Xạ Trường Hoang (5★)', desc: 'Tăng +12% ATK & +6% SPD & +10% Đánh thường' },
        { name: 'Bộ Thiên Tài Kim Loại (5★)', desc: 'Tăng +10% Quantum DMG & Bỏ qua 10% DEF kẻ địch' },
        { name: 'Bộ Thợ Săn Băng Tuyết (5★)', desc: 'Tăng +10% Ice DMG & +25% CRIT DMG khi dùng Ult' },
        { name: 'Bộ Hiệp Sĩ Cung Điện (5★)', desc: 'Tăng +15% DEF & +20% Độ dày của Khiên' },
        { name: 'Bộ Lãng Khách Âm Thầm (5★)', desc: 'Tăng +10% Hồi máu & Hồi +1 SP đầu trận' },
        { name: 'Bộ Chim Ưng Ranh Ma (5★)', desc: 'Tăng +10% Wind DMG & Ưu tiên kéo lượt 25%' }
      ];

      const artOptions = availableSets.map((art, idx) => ({
        label: art.name,
        description: art.desc,
        value: `select_art_${charId}_${idx}`,
        emoji: '🔮'
      }));

      const artSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('menu_do_equip_art')
        .setPlaceholder(`Chọn Bộ Thánh Di Vật cho ${char.name}...`)
        .addOptions(artOptions);

      const artRow = new ActionRowBuilder().addComponents(artSelectMenu);

      const step3ArtEmbed = new EmbedBuilder()
        .setTitle(`🔮 THAY ĐỔI THÁNH DI VẬT CHO ${char.name.toUpperCase()}`)
        .setColor('#8b5cf6')
        .setDescription(`Chọn Bộ Di Vật từ danh sách bên dưới để trang bị cho **${char.name}**:`);

      await i.editReply({ embeds: [step3ArtEmbed], components: [artRow] });
    }

    // Step 3A Finalization: Weapon Selected
    else if (customId === 'menu_do_equip_wpn') {
      await i.deferUpdate().catch(() => {});

      const selectedVal = i.values[0].replace('select_wpn_', '');
      const parts = selectedVal.split('_');
      const charId = parts[0];
      const wpnId = parts.slice(1).join('_');

      const userWpns = db.getUserWeapons(userId);
      const chosenWpn = userWpns.find(w => w.id === wpnId);
      const char = charactersData.find(c => c.id === charId) || charactersData[0];

      if (chosenWpn) {
        chosenWpn.char_id = charId;
        const invRecord = userInv.find(rec => rec.char_id === charId);
        if (invRecord) {
          invRecord.light_cone = chosenWpn.name;
        }

        const rawDb = JSON.parse(fs.readFileSync(path.join(__dirname, '../../database.json'), 'utf8'));
        if (rawDb.weapons && rawDb.weapons[userId]) {
          const targetInDb = rawDb.weapons[userId].find(w => w.id === wpnId);
          if (targetInDb) targetInDb.char_id = charId;
        }
        if (rawDb.inventory && rawDb.inventory[userId]) {
          const invInDb = rawDb.inventory[userId].find(c => c.char_id === charId);
          if (invInDb) invInDb.light_cone = chosenWpn.name;
        }
        fs.writeFileSync(path.join(__dirname, '../../database.json'), JSON.stringify(rawDb, null, 2));
      }

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ THAY ĐỔI VŨ KHÍ THÀNH CÔNG!')
        .setColor('#10b981')
        .setDescription(`Đã trang bị **${chosenWpn ? chosenWpn.name : 'Nón Ánh Sáng Mới'}** cho nhân vật **${char.name}**!`);

      await i.editReply({ embeds: [successEmbed], components: [] });
    }

    // Step 3B Finalization: Artifact Selected
    else if (customId === 'menu_do_equip_art') {
      await i.deferUpdate().catch(() => {});

      const selectedVal = i.values[0].replace('select_art_', '');
      const parts = selectedVal.split('_');
      const charId = parts[0];
      const artIdx = parseInt(parts[1], 10);

      const availableSets = [
        'Bộ Thiện Xạ Trường Hoang (5★)',
        'Bộ Thiên Tài Kim Loại (5★)',
        'Bộ Thợ Săn Băng Tuyết (5★)',
        'Bộ Hiệp Sĩ Cung Điện (5★)',
        'Bộ Lãng Khách Âm Thầm (5★)',
        'Bộ Chim Ưng Ranh Ma (5★)'
      ];

      const chosenSetName = availableSets[artIdx] || availableSets[0];
      const char = charactersData.find(c => c.id === charId) || charactersData[0];

      const invRecord = userInv.find(rec => rec.char_id === charId);
      if (invRecord) {
        invRecord.artifact_set = chosenSetName;
      }

      const rawDb = JSON.parse(fs.readFileSync(path.join(__dirname, '../../database.json'), 'utf8'));
      if (rawDb.inventory && rawDb.inventory[userId]) {
        const invInDb = rawDb.inventory[userId].find(c => c.char_id === charId);
        if (invInDb) invInDb.artifact_set = chosenSetName;
      }
      fs.writeFileSync(path.join(__dirname, '../../database.json'), JSON.stringify(rawDb, null, 2));

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ THAY ĐỔI THÁNH DI VẬT THÀNH CÔNG!')
        .setColor('#10b981')
        .setDescription(`Đã trang bị **${chosenSetName}** cho nhân vật **${char.name}**!`);

      await i.editReply({ embeds: [successEmbed], components: [] });
    }
  });
}

module.exports = {
  data: equipmentCommand,
  execute: executeEquipment
};
