const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const equipmentCommand = new SlashCommandBuilder()
  .setName('equipment')
  .setDescription('Quản lý trang bị: Chọn nhân vật -> Đổi Vũ Khí hoặc Thánh Di Vật theo Mã Keycode');

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

  // Helper: Build Step 2 Character Detail Embed
  function buildCharDetailEmbed(charId) {
    const char = charactersData.find(c => c.id === charId) || charactersData[0];
    const invRec = userInv.find(rec => rec.char_id === charId) || { level: 1, weapon_level: 1, light_cone: 'Nón Ánh Sáng Tiêu Chuẩn' };

    const userWpns = db.getUserWeapons(userId);
    const userArts = db.getUserArtifacts(userId);

    const equippedWpn = userWpns.find(w => w.equipped_char_id === charId || w.char_id === charId) || { name: invRec.light_cone, keycode: '#W-NONE', level: invRec.weapon_level || 1 };
    const equippedArts = userArts.filter(a => a.equipped_char_id === charId || a.char_id === charId);

    const slotsMap = { Head: '🎩 Head', Hands: '🥊 Hands', Body: '🥼 Body', Feet: '👟 Feet' };

    const artListText = equippedArts.length > 0
      ? equippedArts.map(a => `• **[${slotsMap[a.slot] || a.slot}]** ${a.setName} (\`+${a.level}/15\`) [🆔 \`${a.keycode || '#A-NONE'}\`]\n  └ Main: **${a.mainStat}** (+${a.mainValue.toFixed(1)})`).join('\n')
      : '• Chưa trang bị mảnh Di vật nào (Dùng nút bên dưới để đeo theo Mã Keycode)';

    const avatarInfo = getAvatarAttachment(char);

    const embed = new EmbedBuilder()
      .setTitle(`🛡️ QUẢN LÝ TRANG BỊ: ${char.name.toUpperCase()} (Lv.${invRec.level || 1})`)
      .setColor(char.color || '#3b82f6')
      .setDescription(`Nhân vật: **${char.name}** | Nguyên tố: **${char.element}** | Vận mệnh: **${char.path}**`)
      .addFields(
        {
          name: '⚔️ Vũ Khí / Nón Ánh Sáng Đang Đeo',
          value: `• **[🆔 ${equippedWpn.keycode || '#W-NONE'}] ${equippedWpn.name}** (\`Lv.${equippedWpn.level || 1}/80\`)`,
          inline: false
        },
        {
          name: '🔮 Bộ Thánh Di Vật Đang Đeo (Max 4 Slot)',
          value: artListText,
          inline: false
        }
      )
      .setFooter({ text: 'Bấm nút bên dưới để Trang bị Vũ Khí hoặc Trang Bị Di Vật Theo Slot & Keycode!' });

    if (avatarInfo.url) embed.setThumbnail(avatarInfo.url);

    return { embed, avatarInfo };
  }

  // Step 1: Select Character
  const step1Embed = new EmbedBuilder()
    .setTitle('🛡️ TRUNG TÂM QUẢN LÝ TRANG BỊ - BƯỚC 1: CHỌN NHÂN VẬT')
    .setColor('#3b82f6')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setDescription('Hãy chọn 1 nhân vật bên dưới để xem và thay đổi **Vũ Khí (Nón Ánh Sáng)** hoặc **Thánh Di Vật (Theo Mã Keycode)**:');

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
    .addOptions(charOptions.slice(0, 25));

  const row1 = new ActionRowBuilder().addComponents(charMenu);

  const response = await interaction.reply({
    embeds: [step1Embed],
    components: [row1],
    fetchReply: true
  });

  const collector = response.createMessageComponentCollector({
    filter: i => i.message.id === response.id && i.user.id === userId,
    time: 300000
  });

  collector.on('collect', async i => {
    if (i.message.id !== response.id || i.user.id !== userId) return;

    await i.deferUpdate().catch(() => {});
    const customId = i.customId;

    // Step 1 -> Step 2: Character selected
    if (customId === 'equip_step1_char_menu') {
      const charId = i.values[0].replace('char_equip_', '');
      const detail = buildCharDetailEmbed(charId);

      const actionButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`btn_swap_wpn_${charId}`).setLabel(`⚔️ Đổi Vũ Khí`).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`btn_swap_art_${charId}`).setLabel(`🔮 Đổi Thánh Di Vật`).setStyle(ButtonStyle.Primary)
      );

      const updatePayload = { embeds: [detail.embed], components: [actionButtons] };
      if (detail.avatarInfo.attachment) updatePayload.files = [detail.avatarInfo.attachment];

      await i.editReply(updatePayload).catch(err => console.error('❌ Lỗi editReply Step 2 Equipment:', err));
    }

    // Return Back to Step 2 Character Detail
    else if (customId.startsWith('btn_back_char_')) {
      const charId = customId.replace('btn_back_char_', '');
      const detail = buildCharDetailEmbed(charId);

      const actionButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`btn_swap_wpn_${charId}`).setLabel(`⚔️ Đổi Vũ Khí`).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`btn_swap_art_${charId}`).setLabel(`🔮 Đổi Thánh Di Vật`).setStyle(ButtonStyle.Primary)
      );

      await i.editReply({ embeds: [detail.embed], components: [actionButtons] });
    }

    // Step 2 -> Step 3A: Click "Swap Weapon"
    else if (customId.startsWith('btn_swap_wpn_')) {
      const charId = customId.replace('btn_swap_wpn_', '');
      const char = charactersData.find(c => c.id === charId) || charactersData[0];
      const userWpns = db.getUserWeapons(userId);

      if (userWpns.length === 0) {
        const noWpnEmbed = new EmbedBuilder()
          .setTitle('⚠️ KHÔNG CÓ VŨ KHÍ TRONG KHO')
          .setColor('#ef4444')
          .setDescription(`Bạn không có Nón Ánh Sáng nào trong kho! Hãy quay Gacha ở \`/gacha\` để sở hữu thêm vũ khí!`);

        const backRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`btn_back_char_${charId}`).setLabel('🔙 Quay Lại').setStyle(ButtonStyle.Secondary)
        );

        return i.editReply({ embeds: [noWpnEmbed], components: [backRow] });
      }

      // KEYCODE AT VERY FRONT OF LABEL FOR EASY MOBILE VIEWING!
      const wpnOptions = userWpns.map(w => ({
        label: `[🆔 ${w.keycode || '#W-NONE'}] ${w.name.slice(0, 35)} (Lv.${w.level || 1})`,
        description: w.equipped_char_id ? `👤 Đang đeo cho ${w.equipped_char_id.toUpperCase()}` : '⚪ Chưa ai sử dụng',
        value: `select_wpn_kc_${charId}_${w.keycode}`,
        emoji: '⚔️'
      }));

      const wpnSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('menu_do_equip_wpn_kc')
        .setPlaceholder(`Chọn Vũ Khí theo Mã Keycode cho ${char.name}...`)
        .addOptions(wpnOptions.slice(0, 25));

      const wpnRow = new ActionRowBuilder().addComponents(wpnSelectMenu);
      const backRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`btn_back_char_${charId}`).setLabel('🔙 Quay Lại').setStyle(ButtonStyle.Secondary)
      );

      const step3WpnEmbed = new EmbedBuilder()
        .setTitle(`⚔️ THAY ĐỔI VŨ KHÍ CHO ${char.name.toUpperCase()}`)
        .setColor('#eab308')
        .setDescription(`Chọn Nón Ánh Sáng theo **Mã Keycode [🆔 #W-xxxx]** ở đầu danh sách bên dưới để trang bị cho **${char.name}**:\n*(Mỗi vũ khí chỉ đeo cho 1 nhân vật)*`);

      await i.editReply({ embeds: [step3WpnEmbed], components: [wpnRow, backRow] });
    }

    // Step 2 -> Step 3B: Click "Swap Artifact" -> Slot Selection
    else if (customId.startsWith('btn_swap_art_')) {
      const charId = customId.replace('btn_swap_art_', '');
      const char = charactersData.find(c => c.id === charId) || charactersData[0];

      const slotButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`btn_slot_Head_${charId}`).setLabel('🎩 Đầu (Head)').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`btn_slot_Hands_${charId}`).setLabel('🥊 Tay (Hands)').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`btn_slot_Body_${charId}`).setLabel('🥼 Thân (Body)').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`btn_slot_Feet_${charId}`).setLabel('👟 Chân (Feet)').setStyle(ButtonStyle.Danger)
      );

      const backRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`btn_back_char_${charId}`).setLabel('🔙 Quay Lại').setStyle(ButtonStyle.Secondary)
      );

      const slotEmbed = new EmbedBuilder()
        .setTitle(`🔮 CHỌN VỊ TRÍ SLOT DI VẬT CHO ${char.name.toUpperCase()}`)
        .setColor('#8b5cf6')
        .setDescription('Hãy chọn vị trí Trang Bị Di Vật muốn thay đổi bên dưới:');

      await i.editReply({ embeds: [slotEmbed], components: [slotButtons, backRow] });
    }

    // Step 3B -> Step 4: Slot selected -> List artifacts for that slot with Keycode UIDs AT FRONT
    else if (customId.startsWith('btn_slot_')) {
      const parts = customId.replace('btn_slot_', '').split('_');
      const slotName = parts[0];
      const charId = parts[1];

      const char = charactersData.find(c => c.id === charId) || charactersData[0];
      const userArts = db.getUserArtifacts(userId);

      const slotArts = userArts.filter(a => (a.slot || 'Head') === slotName);

      const backRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`btn_swap_art_${charId}`).setLabel('🔙 Chọn Slot Khác').setStyle(ButtonStyle.Secondary)
      );

      if (slotArts.length === 0) {
        const noArtEmbed = new EmbedBuilder()
          .setTitle(`⚠️ KHÔNG CÓ DI VẬT Ở VỊ TRÍ [${slotName.toUpperCase()}]`)
          .setColor('#ef4444')
          .setDescription(`Bạn chưa farm được mảnh Di vật nào thuộc vị trí **[${slotName}]**!\n👉 Hãy đánh Boss ở \`/battle\` hoặc farm quái ở \`/hunt\` để nhặt đồ!`);

        return i.editReply({ embeds: [noArtEmbed], components: [backRow] });
      }

      // KEYCODE AT VERY FRONT OF LABEL FOR EASY VIEWING!
      const artOptions = slotArts.map(art => ({
        label: `[🆔 ${art.keycode || '#A-NONE'}] ${art.setName.slice(0, 25)} (+${art.level}/15)`,
        description: `Main: ${art.mainStat} (+${art.mainValue.toFixed(1)}) | ${art.equipped_char_id ? `👤 ${art.equipped_char_id.toUpperCase()}` : '⚪ Trống'}`,
        value: `select_art_kc_${charId}_${art.keycode}`,
        emoji: '🔮'
      }));

      const artSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('menu_do_equip_art_kc')
        .setPlaceholder(`Chọn Mảnh Di Vật vị trí [${slotName}]...`)
        .addOptions(artOptions.slice(0, 25));

      const artRow = new ActionRowBuilder().addComponents(artSelectMenu);

      const step4ArtEmbed = new EmbedBuilder()
        .setTitle(`🔮 TRANG BỊ DI VẬT [SLOT: ${slotName.toUpperCase()}] CHO ${char.name.toUpperCase()}`)
        .setColor('#8b5cf6')
        .setDescription(`Chọn mảnh Di vật đã farm được theo **Mã Keycode [🆔 #A-xxxx]** ở đầu danh sách bên dưới:\n*(Đồ đã đeo cho nhân vật khác sẽ tự động tháo để chuyển sang ${char.name})*`);

      await i.editReply({ embeds: [step4ArtEmbed], components: [artRow, backRow] });
    }

    // Finalization: Weapon Selected by Keycode
    else if (customId === 'menu_do_equip_wpn_kc') {
      const val = i.values[0].replace('select_wpn_kc_', '');
      const firstUnderscore = val.indexOf('_');
      const charId = val.substring(0, firstUnderscore);
      const keycode = val.substring(firstUnderscore + 1);

      const result = db.equipWeaponByKeycode(userId, keycode, charId);
      const char = charactersData.find(c => c.id === charId) || charactersData[0];

      if (!result.success) return i.followUp({ content: result.message, ephemeral: true });

      const backRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`btn_back_char_${charId}`).setLabel('🔙 Quay Lại Nhân Vật').setStyle(ButtonStyle.Primary)
      );

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ THAY ĐỔI VŨ KHÍ THÀNH CÔNG!')
        .setColor('#10b981')
        .setDescription(`Đã trang bị thành công **${result.weapon.name}** [🆔 \`${result.weapon.keycode}\`] cho nhân vật **${char.name}**!`);

      await i.editReply({ embeds: [successEmbed], components: [backRow] });
    }

    // Finalization: Artifact Selected by Keycode
    else if (customId === 'menu_do_equip_art_kc') {
      const val = i.values[0].replace('select_art_kc_', '');
      const firstUnderscore = val.indexOf('_');
      const charId = val.substring(0, firstUnderscore);
      const keycode = val.substring(firstUnderscore + 1);

      const result = db.equipArtifactByKeycode(userId, keycode, charId);
      const char = charactersData.find(c => c.id === charId) || charactersData[0];

      if (!result.success) return i.followUp({ content: result.message, ephemeral: true });

      const backRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`btn_back_char_${charId}`).setLabel('🔙 Quay Lại Nhân Vật').setStyle(ButtonStyle.Primary)
      );

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ TRANG BỊ THÁNH DI VẬT THÀNH CÔNG!')
        .setColor('#10b981')
        .setDescription(`Đã trang bị mảnh Di vật vị trí **[${result.slot}]**:\n• **${result.artifact.setName}** [🆔 \`${result.artifact.keycode}\`]\n• Chỉ số chính: **${result.artifact.mainStat}** (+${result.artifact.mainValue.toFixed(1)})\n\n👉 Trang bị độc quyền cho nhân vật **${char.name}**!`);

      await i.editReply({ embeds: [successEmbed], components: [backRow] });
    }
  });
}

module.exports = {
  data: equipmentCommand,
  execute: executeEquipment
};
