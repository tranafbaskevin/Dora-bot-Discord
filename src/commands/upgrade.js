const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const upgradeCommand = new SlashCommandBuilder()
  .setName('upgrade')
  .setDescription('Trung tâm Cường hóa & Nâng cấp Nhân vật, Vũ khí, Kỹ năng, Di vật');

async function executeUpgrade(interaction) {
  const userId = interaction.user.id;
  const user = db.getUser(userId);

  const mainEmbed = new EmbedBuilder()
    .setTitle('✨ TRUNG TÂM NÂNG CẤP & CƯỜNG HÓA')
    .setColor('#9333ea')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setDescription(`🌐 **Cấp Thám Hiểm**: Lv.${user.player_level} (${user.player_exp}/${user.player_level * 500} EXP)\n\n📦 **Kho Vật LiệuHiện Có**:\n- 📘 Sách EXP Nhân Vật: **${user.materials?.char_exp_book || 0}** cuốn\n- ⚔️ Tinh Thể Vũ Khí: **${user.materials?.weapon_exp_crystal || 0}** tinh thể\n- 🔮 Bụi Di Vật: **${user.materials?.artifact_dust || 0}** túi\n- 📜 Vật Liệu Kỹ Năng: **${user.materials?.trace_material || 0}** mầm`)
    .setFooter({ text: 'Chọn 1 trong 4 danh mục nâng cấp bên dưới!' });

  const rowButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('up_cat_char').setLabel('👤 Level Nhân Vật').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('up_cat_weapon').setLabel('⚔️ Level Vũ Khí').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('up_cat_skill').setLabel('📜 Level Kỹ Năng').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('up_cat_artifact').setLabel('🔮 Cường Hóa Di Vật').setStyle(ButtonStyle.Secondary)
  );

  const response = await interaction.reply({
    embeds: [mainEmbed],
    components: [rowButtons],
    fetchReply: true
  });

  const collector = response.createMessageComponentCollector({
    time: 300000
  });

  collector.on('collect', async i => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: '❌ Bạn không phải là người sở hữu lệnh này!', ephemeral: true });
    }

    const userInv = db.getUserInventory(userId);

    // 1. Character Level Upgrade Category
    if (i.customId === 'up_cat_char') {
      const selectOptions = userInv.map(inv => {
        const char = charactersData.find(c => c.id === inv.char_id);
        if (!char) return null;
        return {
          label: `${char.name} (Lv.${inv.level})`,
          description: `HP: ${char.baseStats.hp + (inv.level - 1) * 35} | ATK: ${char.baseStats.atk + (inv.level - 1) * 15}`,
          value: `up_char_select_${char.id}`,
          emoji: '👤'
        };
      }).filter(Boolean);

      const menu = new StringSelectMenuBuilder()
        .setCustomId('up_menu_char')
        .setPlaceholder('Chọn Nhân vật muốn dùng Sách EXP để tăng Level...')
        .addOptions(selectOptions);

      const menuRow = new ActionRowBuilder().addComponents(menu);

      const embed = new EmbedBuilder()
        .setTitle('👤 NÂNG CẤP LEVEL NHÂN VẬT (Lv 1 -> 80)')
        .setColor('#3b82f6')
        .setDescription(`Bạn đang có **${user.materials?.char_exp_book || 0}** Sách EXP Nhân vật.\nChọn nhân vật bên dưới để nâng cấp +5 Cấp độ (Dùng 4 Sách EXP)!`);

      await i.update({ embeds: [embed], components: [menuRow, rowButtons] });
    }

    // Handle Character Level Up Selection
    else if (i.customId === 'up_menu_char') {
      const charId = i.values[0].replace('up_char_select_', '');
      const result = db.upgradeCharacterLevel(userId, charId, 4); // Use 4 books for +5 levels

      if (!result.success) {
        return i.reply({ content: result.message, ephemeral: true });
      }

      const char = charactersData.find(c => c.id === charId);
      const updatedEmbed = new EmbedBuilder()
        .setTitle(`🎉 NÂNG CẤP THÀNH CÔNG: ${char.name.toUpperCase()}`)
        .setColor('#10b981')
        .setDescription(`Level mới: **Lv.${result.newLevel}**!\n📘 Sách EXP còn lại: **${result.remainingBooks}** cuốn.`);

      await i.update({ embeds: [updatedEmbed], components: [rowButtons] });
    }

    // 2. Weapon Level Upgrade Category
    else if (i.customId === 'up_cat_weapon') {
      const selectOptions = userInv.map(inv => {
        const char = charactersData.find(c => c.id === inv.char_id);
        if (!char) return null;
        return {
          label: `${char.name} - ${inv.light_cone || 'Vũ Khí'} (Lv.${inv.weapon_level || 1})`,
          description: `Vũ khí đang trang bị cho ${char.name}`,
          value: `up_wpn_select_${char.id}`,
          emoji: '⚔️'
        };
      }).filter(Boolean);

      const menu = new StringSelectMenuBuilder()
        .setCustomId('up_menu_weapon')
        .setPlaceholder('Chọn Vũ khí của nhân vật muốn nâng cấp...')
        .addOptions(selectOptions);

      const menuRow = new ActionRowBuilder().addComponents(menu);

      const embed = new EmbedBuilder()
        .setTitle('⚔️ NÂNG CẤP LEVEL VŨ KHÍ / NÓN ÁNH SÁNG (Lv 1 -> 80)')
        .setColor('#10b981')
        .setDescription(`Bạn đang có **${user.materials?.weapon_exp_crystal || 0}** Tinh Thể Vũ Khí.\nChọn vũ khí bên dưới để nâng cấp +5 Cấp độ!`);

      await i.update({ embeds: [embed], components: [menuRow, rowButtons] });
    }

    // Handle Weapon Level Up Selection
    else if (i.customId === 'up_menu_weapon') {
      const charId = i.values[0].replace('up_wpn_select_', '');
      const result = db.upgradeWeaponLevel(userId, charId, 4);

      if (!result.success) {
        return i.reply({ content: result.message, ephemeral: true });
      }

      const char = charactersData.find(c => c.id === charId);
      const updatedEmbed = new EmbedBuilder()
        .setTitle(`🎉 CƯỜNG HÓA VŨ KHÍ THÀNH CÔNG: ${char.name.toUpperCase()}`)
        .setColor('#10b981')
        .setDescription(`Cấp độ Vũ khí mới: **Lv.${result.newLevel}**!\n⚔️ Tinh Thể Vũ Khí còn lại: **${result.remainingCrystals}**.`);

      await i.update({ embeds: [updatedEmbed], components: [rowButtons] });
    }

    // 3. Skill Level Upgrade Category
    else if (i.customId === 'up_cat_skill') {
      const selectOptions = userInv.map(inv => {
        const char = charactersData.find(c => c.id === inv.char_id);
        if (!char) return null;
        return {
          label: `${char.name} (Kỹ Năng: Lv.${inv.skill_lvl || 1} | Ult: Lv.${inv.ult_lvl || 1})`,
          description: `Nâng cấp hệ số Sát thương Chiến kỹ & Tuyệt kỹ`,
          value: `up_skill_select_${char.id}`,
          emoji: '📜'
        };
      }).filter(Boolean);

      const menu = new StringSelectMenuBuilder()
        .setCustomId('up_menu_skill')
        .setPlaceholder('Chọn Nhân vật muốn nâng Cấp Kỹ Năng...')
        .addOptions(selectOptions);

      const menuRow = new ActionRowBuilder().addComponents(menu);

      const embed = new EmbedBuilder()
        .setTitle('📜 NÂNG CẤP CẤP KỸ NĂNG (TRACE LEVEL 1 -> 10)')
        .setColor('#ef4444')
        .setDescription(`Bạn đang có **${user.materials?.trace_material || 0}** Vật Liệu Kỹ Năng.\nChọn nhân vật để tăng +1 Cấp Kỹ Năng (Tốn 5 vật liệu)!`);

      await i.update({ embeds: [embed], components: [menuRow, rowButtons] });
    }

    // Handle Skill Upgrade Selection
    else if (i.customId === 'up_menu_skill') {
      const charId = i.values[0].replace('up_skill_select_', '');
      const result = db.upgradeSkillLevel(userId, charId, 'skill');

      if (!result.success) {
        return i.reply({ content: result.message, ephemeral: true });
      }

      const char = charactersData.find(c => c.id === charId);
      const updatedEmbed = new EmbedBuilder()
        .setTitle(`🎉 NÂNG CẤP KỸ NĂNG THÀNH CÔNG: ${char.name.toUpperCase()}`)
        .setColor('#10b981')
        .setDescription(`Chiến Kỹ mới: **Lv.${result.newLevel}**!\n📜 Vật liệu còn lại: **${result.remainingMaterials}**.`);

      await i.update({ embeds: [updatedEmbed], components: [rowButtons] });
    }

    // 4. Artifact Upgrade Category (Lv 1 - 15)
    else if (i.customId === 'up_cat_artifact') {
      const dbData = require('../database/db');
      const rawDb = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../database.json'), 'utf8'));
      const userArts = (rawDb.artifacts && rawDb.artifacts[userId]) || [];

      if (userArts.length === 0) {
        return i.reply({ content: '⚠️ Bạn chưa có Thánh Di Vật nào trong kho! Đánh Boss ở `/battle` để nhặt Di vật 5★!', ephemeral: true });
      }

      const selectOptions = userArts.map(art => ({
        label: `${art.setName} (Lv.${art.level}/15)`,
        description: `Main: ${art.mainStat} (+${art.mainValue.toFixed(1)}) | Sub-stats: ${art.subStats.length} dòng`,
        value: `up_art_select_${art.id}`,
        emoji: '🔮'
      }));

      const menu = new StringSelectMenuBuilder()
        .setCustomId('up_menu_artifact')
        .setPlaceholder('Chọn Thánh Di Vật muốn cường hóa lên Lv 15...')
        .addOptions(selectOptions.slice(0, 25));

      const menuRow = new ActionRowBuilder().addComponents(menu);

      const embed = new EmbedBuilder()
        .setTitle('🔮 CƯỜNG HÓA THÁNH DI VẬT (Lv 1 -> 15)')
        .setColor('#8b5cf6')
        .setDescription(`Bạn đang có **${user.materials?.artifact_dust || 0}** Bụi Vàng Di Vật.\nChọn Di vật bên dưới để cường hóa! (Mỗi +3 Cấp sẽ tăng/mở Dòng Phụ ngẫu nhiên!)`);

      await i.update({ embeds: [embed], components: [menuRow, rowButtons] });
    }

    // Handle Artifact Upgrade Selection
    else if (i.customId === 'up_menu_artifact') {
      const artId = i.values[0].replace('up_art_select_', '');
      const result = db.upgradeArtifact(userId, artId, 5); // Use 5 dust

      if (!result.success) {
        return i.reply({ content: result.message, ephemeral: true });
      }

      const subLines = result.subStats.map(s => `• **${s.name}**: +${s.value.toFixed(1)}`).join('\n');

      const updatedEmbed = new EmbedBuilder()
        .setTitle(`🎉 CƯỜNG HÓA DI VẬT THÀNH CÔNG! (Lv.${result.newLevel}/15)`)
        .setColor('#10b981')
        .setDescription(`Chỉ số chính: **+${result.mainValue.toFixed(1)}**\n\n**Các Dòng Phụ Ngẫu Nhiên**:\n${subLines}\n\n🔮 Bụi Di Vật còn lại: **${result.remainingDust}**.`);

      await i.update({ embeds: [updatedEmbed], components: [rowButtons] });
    }
  });
}

module.exports = {
  data: upgradeCommand,
  execute: executeUpgrade
};
