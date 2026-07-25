const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const equipmentCommand = new SlashCommandBuilder()
  .setName('equipment')
  .setDescription('Quản lý Trang Bị Nhân Vật: Thay đổi 1 ô Vũ Khí & 4 ô Thánh Di Vật');

async function executeEquipment(interaction) {
  const userId = interaction.user.id;
  const userInv = db.getUserInventory(userId);

  let selectedCharId = userInv[0] ? userInv[0].char_id : 'seele';

  function buildEquipEmbed(charId) {
    const char = charactersData.find(c => c.id === charId) || charactersData[0];
    const rec = userInv.find(i => i.char_id === charId) || { level: 1, weapon_level: 1, light_cone: 'Nón Ánh Sáng Tiêu Chuẩn', artifact_set: 'Bộ Duyên Kiếp' };

    const userWpns = db.getUserWeapons(userId);
    const wpn = userWpns.find(w => w.char_id === charId) || { name: rec.light_cone, superimpose: 1, level: rec.weapon_level || 1 };

    const rawDb = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../database.json'), 'utf8'));
    const userArts = (rawDb.artifacts && rawDb.artifacts[userId]) || [];
    const equippedArts = userArts.filter(a => a.char_id === charId);

    const headArt = equippedArts.find(a => a.slot === 'Head');
    const handsArt = equippedArts.find(a => a.slot === 'Hands');
    const bodyArt = equippedArts.find(a => a.slot === 'Body');
    const feetArt = equippedArts.find(a => a.slot === 'Feet');

    return new EmbedBuilder()
      .setTitle(`🛡️ QUẢN LÝ TRANG BỊ: ${char.name.toUpperCase()} (Lv.${rec.level || 1})`)
      .setColor(char.color || '#3b82f6')
      .setThumbnail(char.icon || interaction.user.displayAvatarURL())
      .setDescription('Bấm vào 5 ô bên dưới để chọn & đổi **Vũ Khí** hoặc **4 Ô Thánh Di Vật** từ túi đồ của bạn:')
      .addFields(
        {
          name: '⚔️ 1. Ô Vũ Khí (Nón Ánh Sáng)',
          value: `• **${wpn.name}**\n  Cấp độ: Lv.${wpn.level || 1} / 80 | Tích Chồng: **S${wpn.superimpose || 1}**`,
          inline: false
        },
        {
          name: '👑 2. Ô Di Vật: Head (Nón / Nón)',
          value: headArt ? `• **${headArt.setName}** (+${headArt.level})\n  Main: ${headArt.mainStat} (+${headArt.mainValue.toFixed(1)})` : '• *Trống (Chưa gắn Di vật)*',
          inline: true
        },
        {
          name: '🧤 3. Ô Di Vật: Hands (Găng tay)',
          value: handsArt ? `• **${handsArt.setName}** (+${handsArt.level})\n  Main: ${handsArt.mainStat} (+${handsArt.mainValue.toFixed(1)})` : '• *Trống (Chưa gắn Di vật)*',
          inline: true
        },
        {
          name: '🎽 4. Ô Di Vật: Body (Áo giáp)',
          value: bodyArt ? `• **${bodyArt.setName}** (+${bodyArt.level})\n  Main: ${bodyArt.mainStat} (+${bodyArt.mainValue.toFixed(1)})` : '• *Trống (Chưa gắn Di vật)*',
          inline: true
        },
        {
          name: '👟 5. Ô Di Vật: Feet (Giày)',
          value: feetArt ? `• **${feetArt.setName}** (+${feetArt.level})\n  Main: ${feetArt.mainStat} (+${feetArt.mainValue.toFixed(1)})` : '• *Trống (Chưa gắn Di vật)*',
          inline: true
        }
      )
      .setFooter({ text: 'Chọn nhân vật khác từ menu bên dưới để đổi trang bị!' });
  }

  function buildCharSelectRow() {
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
      .setCustomId('equip_select_char_menu')
      .setPlaceholder('Chọn Nhân Vật Muốn Thay Đổi Trang Bị...')
      .addOptions(options);

    return new ActionRowBuilder().addComponents(menu);
  }

  function buildSlotButtonsRow() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_slot_weapon').setLabel('⚔️ Ô Vũ Khí').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('btn_slot_head').setLabel('👑 Ô Head').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('btn_slot_hands').setLabel('🧤 Ô Hands').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('btn_slot_body').setLabel('🎽 Ô Body').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('btn_slot_feet').setLabel('👟 Ô Feet').setStyle(ButtonStyle.Primary)
    );
  }

  const response = await interaction.reply({
    embeds: [buildEquipEmbed(selectedCharId)],
    components: [buildCharSelectRow(), buildSlotButtonsRow()],
    fetchReply: true
  });

  const collector = response.createMessageComponentCollector({
    time: 300000
  });

  collector.on('collect', async i => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: '❌ Bạn không có quyền thao tác trên túi đồ này!', ephemeral: true });
    }

    // 1. Switch Character Menu
    if (i.customId === 'equip_select_char_menu') {
      selectedCharId = i.values[0].replace('char_equip_', '');
      await i.update({
        embeds: [buildEquipEmbed(selectedCharId)],
        components: [buildCharSelectRow(), buildSlotButtonsRow()]
      });
    }

    // 2. Click Slot 1: Weapon Swap
    else if (i.customId === 'btn_slot_weapon') {
      const userWpns = db.getUserWeapons(userId);
      if (userWpns.length === 0) {
        return i.reply({ content: '⚠️ Bạn không có Nón Ánh Sáng nào trong kho! Quay gacha ở `/gacha` để nhận thêm!', ephemeral: true });
      }

      const wpnOptions = userWpns.map(w => ({
        label: `${w.name} (Lv.${w.level || 1} • S${w.superimpose || 1})`,
        description: w.char_id ? `Đang đeo cho ${w.char_id.toUpperCase()}` : 'Chưa ai trang bị',
        value: `swap_wpn_${w.id}`,
        emoji: '⚔️'
      }));

      const wpnMenu = new StringSelectMenuBuilder()
        .setCustomId('equip_menu_swap_wpn')
        .setPlaceholder(`Chọn Vũ khí muốn đổi cho ${selectedCharId.toUpperCase()}...`)
        .addOptions(wpnOptions.slice(0, 25));

      const row = new ActionRowBuilder().addComponents(wpnMenu);
      await i.update({ components: [buildCharSelectRow(), row] });
    }

    else if (i.customId === 'equip_menu_swap_wpn') {
      const wpnId = i.values[0].replace('swap_wpn_', '');
      const data = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../database.json'), 'utf8'));

      if (data.weapons && data.weapons[userId]) {
        // Unequip from old owner
        data.weapons[userId].forEach(w => {
          if (w.char_id === selectedCharId) w.char_id = null;
        });
        // Equip to current char
        const targetWpn = data.weapons[userId].find(w => w.id === wpnId);
        if (targetWpn) targetWpn.char_id = selectedCharId;

        // Also update inventory light_cone text
        if (data.inventory[userId]) {
          const invChar = data.inventory[userId].find(c => c.char_id === selectedCharId);
          if (invChar && targetWpn) invChar.light_cone = targetWpn.name;
        }

        require('fs').writeFileSync(require('path').join(__dirname, '../../database.json'), JSON.stringify(data, null, 2));
      }

      await i.update({
        embeds: [buildEquipEmbed(selectedCharId)],
        components: [buildCharSelectRow(), buildSlotButtonsRow()]
      });
    }

    // 3. Click Artifact Slots (Head, Hands, Body, Feet)
    else if (i.customId.startsWith('btn_slot_')) {
      const slotName = i.customId.replace('btn_slot_', ''); // 'head', 'hands', 'body', 'feet'
      const slotCapital = slotName.charAt(0).toUpperCase() + slotName.slice(1);

      const rawDb = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../database.json'), 'utf8'));
      const userArts = (rawDb.artifacts && rawDb.artifacts[userId]) || [];

      // Create new dummy artifact if inventory is empty for testing
      if (userArts.length === 0) {
        db.addArtifact(userId, { slot: slotCapital, setName: 'Bộ Thiện Xạ Trường Hoang (5★)', char_id: selectedCharId });
      }

      const refreshedArts = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../database.json'), 'utf8')).artifacts[userId] || [];

      const artOptions = refreshedArts.map(a => ({
        label: `${a.setName} (+${a.level}) - ${a.slot}`,
        description: `Main: ${a.mainStat} (+${a.mainValue.toFixed(1)})`,
        value: `swap_art_${a.id}`,
        emoji: '🔮'
      }));

      const artMenu = new StringSelectMenuBuilder()
        .setCustomId('equip_menu_swap_art')
        .setPlaceholder(`Chọn Di vật trang bị ô ${slotCapital}...`)
        .addOptions(artOptions.slice(0, 25));

      const row = new ActionRowBuilder().addComponents(artMenu);
      await i.update({ components: [buildCharSelectRow(), row] });
    }

    else if (i.customId === 'equip_menu_swap_art') {
      const artId = i.values[0].replace('swap_art_', '');
      const data = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../database.json'), 'utf8'));

      if (data.artifacts && data.artifacts[userId]) {
        const targetArt = data.artifacts[userId].find(a => a.id === artId);
        if (targetArt) {
          targetArt.char_id = selectedCharId;
          require('fs').writeFileSync(require('path').join(__dirname, '../../database.json'), JSON.stringify(data, null, 2));
        }
      }

      await i.update({
        embeds: [buildEquipEmbed(selectedCharId)],
        components: [buildCharSelectRow(), buildSlotButtonsRow()]
      });
    }
  });
}

module.exports = {
  data: equipmentCommand,
  execute: executeEquipment
};
