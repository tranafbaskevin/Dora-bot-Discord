const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const equipmentCommand = new SlashCommandBuilder()
  .setName('equipment')
  .setDescription('Quản lý Trang Bị Nhân Vật: Chọn Nhân vật -> Đổi Vũ Khí hoặc Thánh Di Vật');

async function executeEquipment(interaction) {
  const userId = interaction.user.id;
  const userInv = db.getUserInventory(userId);

  if (userInv.length === 0) {
    return interaction.reply({ content: '⚠️ Bạn chưa có nhân vật nào trong túi đồ!', ephemeral: true });
  }

  let selectedCharId = userInv[0].char_id;

  function buildCharEmbed(charId) {
    const char = charactersData.find(c => c.id === charId) || charactersData[0];
    const rec = userInv.find(i => i.char_id === charId) || { level: 1, weapon_level: 1, light_cone: 'In the Night (5★)', artifact_set: 'Bộ Thợ Lặn Ranh Ma' };

    const userWpns = db.getUserWeapons(userId);
    const wpn = userWpns.find(w => w.char_id === charId) || { name: rec.light_cone, superimpose: 1, level: rec.weapon_level || 1 };

    const wpnLvl = Math.max(rec.weapon_level || 1, wpn.level || 1);

    return new EmbedBuilder()
      .setTitle(`🛡️ QUẢN LÝ TRANG BỊ: ${char.name.toUpperCase()} (Lv.${rec.level || 1})`)
      .setColor(char.color || '#3b82f6')
      .setThumbnail(char.icon || interaction.user.displayAvatarURL())
      .setDescription(`Nhân vật: **${char.name}** | Nguyên tố: **${char.element}** | Vận mệnh: **${char.path}**`)
      .addFields(
        {
          name: '⚔️ Vũ Khí / Nón Ánh Sáng Đang Trang Bị',
          value: `• **${wpn.name}**\n  Cấp độ: **Lv.${wpnLvl} / 80** | Cung mệnh Tích chồng: **S${wpn.superimpose || 1}**`,
          inline: false
        },
        {
          name: '🔮 Bộ Thánh Di Vật Đang Trang Bị',
          value: `• **${rec.artifact_set || 'Bộ Tiêu Chuẩn (5★)'}**\n  Hiệu ứng: Tăng +15% Sát Thương Thuộc Tính & +10% CRIT Rate`,
          inline: false
        }
      )
      .setFooter({ text: 'Chọn 1 trong 2 nút bên dưới để Đổi Vũ Khí hoặc Đổi Thánh Di Vật!' });
  }

  function buildCharSelectMenu() {
    const options = userInv.map(inv => {
      const char = charactersData.find(c => c.id === inv.char_id);
      if (!char) return null;
      return {
        label: `${char.name} (Lv.${inv.level || 1})`,
        description: `Nguyên tố: ${char.element} | Vận mệnh: ${char.path}`,
        value: `char_equip_${char.id}`,
        emoji: '👤'
      };
    }).filter(Boolean);

    const menu = new StringSelectMenuBuilder()
      .setCustomId('equip_menu_select_char')
      .setPlaceholder('1. Chọn Nhân Vật Muốn Quản Lý Trang Bị...')
      .addOptions(options);

    return new ActionRowBuilder().addComponents(menu);
  }

  function buildActionButtons() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_equip_change_weapon').setLabel('⚔️ Thay Đổi Vũ Khí').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('btn_equip_change_artifact').setLabel('🔮 Thay Đổi Thánh Di Vật').setStyle(ButtonStyle.Primary)
    );
  }

  const response = await interaction.reply({
    embeds: [buildCharEmbed(selectedCharId)],
    components: [buildCharSelectMenu(), buildActionButtons()],
    fetchReply: true
  });

  const collector = response.createMessageComponentCollector({
    time: 300000
  });

  collector.on('collect', async i => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: '❌ Bạn không có quyền thao tác trên túi đồ này!', ephemeral: true });
    }

    // Step 1: Select Character
    if (i.customId === 'equip_menu_select_char') {
      selectedCharId = i.values[0].replace('char_equip_', '');
      await i.update({
        embeds: [buildCharEmbed(selectedCharId)],
        components: [buildCharSelectMenu(), buildActionButtons()]
      });
    }

    // Step 2: Click Change Weapon Button
    else if (i.customId === 'btn_equip_change_weapon') {
      const userWpns = db.getUserWeapons(userId);

      const wpnOptions = userWpns.map(w => ({
        label: `${w.name} (Lv.${w.level || 1} • S${w.superimpose || 1})`,
        description: w.char_id ? `Đang đeo cho ${w.char_id.toUpperCase()}` : 'Chưa trang bị',
        value: `swap_wpn_${w.id}`,
        emoji: '⚔️'
      }));

      const wpnMenu = new StringSelectMenuBuilder()
        .setCustomId('equip_menu_do_swap_wpn')
        .setPlaceholder(`Chọn Vũ khí có sẵn trong kho để trang bị cho ${selectedCharId.toUpperCase()}...`)
        .addOptions(wpnOptions.slice(0, 25));

      const row = new ActionRowBuilder().addComponents(wpnMenu);
      await i.update({ components: [buildCharSelectMenu(), row] });
    }

    else if (i.customId === 'equip_menu_do_swap_wpn') {
      const wpnId = i.values[0].replace('swap_wpn_', '');
      const rawDb = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../database.json'), 'utf8'));

      if (rawDb.weapons && rawDb.weapons[userId]) {
        // Unequip old weapon owner
        rawDb.weapons[userId].forEach(w => {
          if (w.char_id === selectedCharId) w.char_id = null;
        });
        // Equip target weapon
        const targetWpn = rawDb.weapons[userId].find(w => w.id === wpnId);
        if (targetWpn) {
          targetWpn.char_id = selectedCharId;

          // Sync with inventory table
          if (rawDb.inventory[userId]) {
            const invChar = rawDb.inventory[userId].find(c => c.char_id === selectedCharId);
            if (invChar) {
              invChar.light_cone = targetWpn.name;
              invChar.weapon_level = Math.max(invChar.weapon_level || 1, targetWpn.level || 1);
            }
          }
        }

        require('fs').writeFileSync(require('path').join(__dirname, '../../database.json'), JSON.stringify(rawDb, null, 2));
      }

      await i.update({
        embeds: [buildCharEmbed(selectedCharId)],
        components: [buildCharSelectMenu(), buildActionButtons()]
      });
    }

    // Step 3: Click Change Artifact Button
    else if (i.customId === 'btn_equip_change_artifact') {
      const relicSets = [
        { label: 'Bộ Thiện Xạ Trường Hoang (5★)', description: 'Tăng +12% ATK & +10% Tốc độ', value: 'set_musketeer' },
        { label: 'Bộ Thiên Tài Kim Loại (5★)', description: 'Tăng +10% Sát thương Lượng Tử', value: 'set_genius' },
        { label: 'Bộ Thợ Săn Băng Tuyết (5★)', description: 'Tăng +10% Sát thương Băng', value: 'set_hunter' },
        { label: 'Bộ Hiệp Sĩ Thánh Điện (5★)', description: 'Tăng +15% Phòng Thủ & Độ dày Khiên', value: 'set_knight' },
        { label: 'Bộ Lãng Khách Âm Thầm (5★)', description: 'Tăng +10% Lượng Hồi Máu', value: 'set_passerby' },
        { label: 'Bộ Chim Ưng Ranh Ma (5★)', description: 'Tăng +10% Sát thương Phong', value: 'set_eagle' }
      ];

      const artMenu = new StringSelectMenuBuilder()
        .setCustomId('equip_menu_do_swap_art')
        .setPlaceholder(`Chọn Bộ Thánh Di Vật trong kho để đeo cho ${selectedCharId.toUpperCase()}...`)
        .addOptions(relicSets);

      const row = new ActionRowBuilder().addComponents(artMenu);
      await i.update({ components: [buildCharSelectMenu(), row] });
    }

    else if (i.customId === 'equip_menu_do_swap_art') {
      const selectedSetName = i.values[0].replace('set_', '');
      const rawDb = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../database.json'), 'utf8'));

      const setDisplayNames = {
        musketeer: 'Bộ Thiện Xạ Trường Hoang (5★)',
        genius: 'Bộ Thiên Tài Kim Loại (5★)',
        hunter: 'Bộ Thợ Săn Băng Tuyết (5★)',
        knight: 'Bộ Hiệp Sĩ Thánh Điện (5★)',
        passerby: 'Bộ Lãng Khách Âm Thầm (5★)',
        eagle: 'Bộ Chim Ưng Ranh Ma (5★)'
      };

      const finalSetName = setDisplayNames[selectedSetName] || 'Bộ Thiện Xạ Trường Hoang (5★)';

      if (rawDb.inventory[userId]) {
        const invChar = rawDb.inventory[userId].find(c => c.char_id === selectedCharId);
        if (invChar) {
          invChar.artifact_set = finalSetName;
        }
        require('fs').writeFileSync(require('path').join(__dirname, '../../database.json'), JSON.stringify(rawDb, null, 2));
      }

      await i.update({
        embeds: [buildCharEmbed(selectedCharId)],
        components: [buildCharSelectMenu(), buildActionButtons()]
      });
    }
  });
}

module.exports = {
  data: equipmentCommand,
  execute: executeEquipment
};
