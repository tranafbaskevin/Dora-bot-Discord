const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
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
    .setDescription(`🌐 **Cấp Thám Hiểm**: Lv.${user.player_level} (${user.player_exp}/${user.player_level * 500} EXP)\n\n📦 **Kho Vật Liệu Hiện Có**:\n- 📘 Sách EXP Nhân Vật: **${user.materials?.char_exp_book || 0}** cuốn\n- ⚔️ Tinh Thể Vũ Khí: **${user.materials?.weapon_exp_crystal || 0}** tinh thể\n- 🔮 Bụi Di Vật: **${user.materials?.artifact_dust || 0}** túi\n- 📜 Mầm Kỹ Năng: **${user.materials?.trace_material || 0}** mầm`)
    .setFooter({ text: 'Chọn 1 trong 4 danh mục nâng cấp bên dưới!' });

  const rowButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('up_cat_char').setLabel('👤 Level Nhân Vật').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('up_cat_weapon').setLabel('⚔️ Level Vũ Khí').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('up_cat_skill').setLabel('📜 Đánh Thường / Kỹ Năng / Ult').setStyle(ButtonStyle.Danger),
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
    const refreshedUser = db.getUser(userId);

    // 1. Character Level Upgrade Category
    if (i.customId === 'up_cat_char') {
      const selectOptions = userInv.map(inv => {
        const char = charactersData.find(c => c.id === inv.char_id);
        if (!char) return null;
        return {
          label: `${char.name} (Lv.${inv.level}/80)`,
          description: `HP: ${char.baseStats.hp + (inv.level - 1) * 40} | ATK: ${char.baseStats.atk + (inv.level - 1) * 18}`,
          value: `up_char_select_${char.id}`,
          emoji: '👤'
        };
      }).filter(Boolean);

      const menu = new StringSelectMenuBuilder()
        .setCustomId('up_menu_char')
        .setPlaceholder('Chọn Nhân vật để TĂNG MAX LEVEL tự động...')
        .addOptions(selectOptions);

      const menuRow = new ActionRowBuilder().addComponents(menu);

      const embed = new EmbedBuilder()
        .setTitle('👤 NÂNG CẤP LEVEL NHÂN VẬT (Lv 1 -> 80)')
        .setColor('#3b82f6')
        .setDescription(`📘 Sách EXP khả dụng: **${refreshedUser.materials?.char_exp_book || 0}** cuốn.\nChọn nhân vật bên dưới để **TỰ ĐỘNG TĂNG CẤP TỐI ĐA**!`);

      await i.update({ embeds: [embed], components: [menuRow, rowButtons] });
    }

    else if (i.customId === 'up_menu_char') {
      const charId = i.values[0].replace('up_char_select_', '');
      const result = db.upgradeCharacterLevel(userId, charId, true);

      if (!result.success) return i.reply({ content: result.message, ephemeral: true });

      const char = charactersData.find(c => c.id === charId);
      const updatedEmbed = new EmbedBuilder()
        .setTitle(`🎉 NÂNG CẤP MAX LEVEL THÀNH CÔNG: ${char.name.toUpperCase()}`)
        .setColor('#10b981')
        .setDescription(`- Đã dùng: **${result.booksUsed}** Sách EXP\n- Level mới: **Lv.${result.newLevel} / 80**!\n📘 Sách EXP còn lại: **${result.remainingBooks}** cuốn.`);

      await i.update({ embeds: [updatedEmbed], components: [rowButtons] });
    }

    // 2. Weapon Level Upgrade Category
    else if (i.customId === 'up_cat_weapon') {
      const selectOptions = userInv.map(inv => {
        const char = charactersData.find(c => c.id === inv.char_id);
        if (!char) return null;
        return {
          label: `${char.name} - ${inv.light_cone || 'Vũ Khí'} (Lv.${inv.weapon_level || 1}/80)`,
          description: `Vũ khí đang trang bị cho ${char.name}`,
          value: `up_wpn_select_${char.id}`,
          emoji: '⚔️'
        };
      }).filter(Boolean);

      const menu = new StringSelectMenuBuilder()
        .setCustomId('up_menu_weapon')
        .setPlaceholder('Chọn Vũ khí để TĂNG MAX LEVEL...')
        .addOptions(selectOptions);

      const menuRow = new ActionRowBuilder().addComponents(menu);

      const embed = new EmbedBuilder()
        .setTitle('⚔️ NÂNG CẤP LEVEL VŨ KHÍ / NÓN ÁNH SÁNG (Lv 1 -> 80)')
        .setColor('#10b981')
        .setDescription(`⚔️ Tinh Thể Vũ Khí khả dụng: **${refreshedUser.materials?.weapon_exp_crystal || 0}**.\nChọn vũ khí bên dưới để tự động tăng cấp tối đa!`);

      await i.update({ embeds: [embed], components: [menuRow, rowButtons] });
    }

    else if (i.customId === 'up_menu_weapon') {
      const charId = i.values[0].replace('up_wpn_select_', '');
      const result = db.upgradeWeaponLevel(userId, charId, true);

      if (!result.success) return i.reply({ content: result.message, ephemeral: true });

      const char = charactersData.find(c => c.id === charId);
      const updatedEmbed = new EmbedBuilder()
        .setTitle(`🎉 NÂNG CẤP VŨ KHÍ THÀNH CÔNG: ${char.name.toUpperCase()}`)
        .setColor('#10b981')
        .setDescription(`- Đã dùng: **${result.crystalsUsed}** Tinh Thể Vũ Khí\n- Cấp độ mới: **Lv.${result.newLevel} / 80**!\n⚔️ Tinh Thể còn lại: **${result.remainingCrystals}**.`);

      await i.update({ embeds: [updatedEmbed], components: [rowButtons] });
    }

    // 3. Skill & Ultimate Level Upgrade Category (Supports Basic, Skill & Ultimate!)
    else if (i.customId === 'up_cat_skill') {
      const skillOptions = [];
      userInv.forEach(inv => {
        const char = charactersData.find(c => c.id === inv.char_id);
        if (!char) return;

        skillOptions.push({
          label: `${char.name} - Đánh Thường (Lv.${inv.basic_lvl || 1}/6)`,
          description: `Nâng cấp Đánh thường: ${char.skills.basic.name}`,
          value: `up_sk_select_${char.id}_basic`,
          emoji: '🗡️'
        });

        skillOptions.push({
          label: `${char.name} - Chiến Kỹ (Lv.${inv.skill_lvl || 1}/10)`,
          description: `Nâng cấp Chiến kỹ: ${char.skills.skill.name}`,
          value: `up_sk_select_${char.id}_skill`,
          emoji: '💥'
        });

        skillOptions.push({
          label: `${char.name} - Tuyệt Kỹ (Lv.${inv.ult_lvl || 1}/10)`,
          description: `Nâng cấp Tuyệt kỹ: ${char.skills.ultimate.name}`,
          value: `up_sk_select_${char.id}_ult`,
          emoji: '🌟'
        });
      });

      const menu = new StringSelectMenuBuilder()
        .setCustomId('up_menu_skill')
        .setPlaceholder('Chọn Đánh Thường, Chiến Kỹ hoặc Tuyệt Kỹ...')
        .addOptions(skillOptions.slice(0, 25));

      const menuRow = new ActionRowBuilder().addComponents(menu);

      const embed = new EmbedBuilder()
        .setTitle('📜 NÂNG CẤP KỸ NĂNG: ĐÁNH THƯỜNG / CHIẾN KỸ / TUYỆT KỸ')
        .setColor('#ef4444')
        .setDescription(`📜 Mầm Kỹ Năng hiện có: **${refreshedUser.materials?.trace_material || 0}**.\nChọn kỹ năng bên dưới để tăng +1 Level (Tốn 5 mầm)!`);

      await i.update({ embeds: [embed], components: [menuRow, rowButtons] });
    }

    else if (i.customId === 'up_menu_skill') {
      const parts = i.values[0].replace('up_sk_select_', '').split('_');
      const charId = parts[0];
      const skillType = parts[1]; // 'basic', 'skill', or 'ult'

      const result = db.upgradeSkillLevel(userId, charId, skillType);

      if (!result.success) return i.reply({ content: result.message, ephemeral: true });

      const char = charactersData.find(c => c.id === charId);
      let skillName = `Chiến Kỹ (${char.skills.skill.name})`;
      if (skillType === 'ult') skillName = `Tuyệt Kỹ (${char.skills.ultimate.name})`;
      else if (skillType === 'basic') skillName = `Đánh Thường (${char.skills.basic.name})`;

      const maxLvl = skillType === 'basic' ? 6 : 10;

      const updatedEmbed = new EmbedBuilder()
        .setTitle(`🎉 NÂNG CẤP ${skillName.toUpperCase()} THÀNH CÔNG`)
        .setColor('#10b981')
        .setDescription(`Level mới: **Lv.${result.newLevel} / ${maxLvl}**!\n📜 Mầm kỹ năng còn lại: **${result.remainingMaterials}**.`);

      await i.update({ embeds: [updatedEmbed], components: [rowButtons] });
    }

    // 4. Artifact Upgrade Category
    else if (i.customId === 'up_cat_artifact') {
      const rawDb = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../database.json'), 'utf8'));
      const userArts = (rawDb.artifacts && rawDb.artifacts[userId]) || [];

      if (userArts.length === 0) {
        return i.reply({ content: '⚠️ Bạn chưa có Thánh Di Vật nào trong kho! Đánh Boss ở `/battle` để nhặt Di vật 5★!', ephemeral: true });
      }

      const selectOptions = userArts.map(art => ({
        label: `${art.setName} (+${art.level}/15)`,
        description: `Main: ${art.mainStat} (+${art.mainValue.toFixed(1)}) | Sub-stats: ${art.subStats.length} dòng`,
        value: `up_art_select_${art.id}`,
        emoji: '🔮'
      }));

      const menu = new StringSelectMenuBuilder()
        .setCustomId('up_menu_artifact')
        .setPlaceholder('Chọn Thánh Di Vật để Cường Hóa & RNG Roll Dòng Phụ...')
        .addOptions(selectOptions.slice(0, 25));

      const menuRow = new ActionRowBuilder().addComponents(menu);

      const embed = new EmbedBuilder()
        .setTitle('🔮 CƯỜNG HÓA DI VẬT & RNG ROLL DÒNG PHỤ (+15)')
        .setColor('#8b5cf6')
        .setDescription(`🔮 Bụi Di Vật hiện có: **${refreshedUser.materials?.artifact_dust || 0}**.\nChọn Di vật bên dưới để cường hóa! (Mỗi **+3 Cấp** sẽ nhảy **RNG 100%** vào 1 Dòng Phụ ngẫu nhiên!)`);

      await i.update({ embeds: [embed], components: [menuRow, rowButtons] });
    }

    else if (i.customId === 'up_menu_artifact') {
      const artId = i.values[0].replace('up_art_select_', '');
      const result = db.upgradeArtifact(userId, artId, 5);

      if (!result.success) return i.reply({ content: result.message, ephemeral: true });

      const subLines = result.subStats.map(s => `• **${s.name}**: +${s.value.toFixed(1)}`).join('\n');
      const rngLog = result.upgradedSubNames.length > 0
        ? `\n\n🎲 **Nhảy Dòng RNG**: \n${result.upgradedSubNames.map(l => `✨ ${l}`).join('\n')}`
        : '';

      const updatedEmbed = new EmbedBuilder()
        .setTitle(`🎉 CƯỜNG HÓA DI VẬT THÀNH CÔNG! (+${result.newLevel}/15)`)
        .setColor('#10b981')
        .setDescription(`- Đã dùng: **${result.dustUsed}** Bụi Di Vật\n- Chỉ số chính: **+${result.mainValue.toFixed(1)}**\n\n**Các Dòng Phụ Chi Tiết**:\n${subLines}${rngLog}\n\n🔮 Bụi Di Vật còn lại: **${result.remainingDust}**.`);

      await i.update({ embeds: [updatedEmbed], components: [rowButtons] });
    }
  });
}

module.exports = {
  data: upgradeCommand,
  execute: executeUpgrade
};
