const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const upgradeCommand = new SlashCommandBuilder()
  .setName('upgrade')
  .setDescription('Cường hóa & Nâng cấp Trang bị (Phân Trang OwO Style & Chọn theo Mã Keycode)');

async function executeUpgrade(interaction) {
  const userId = interaction.user.id;
  const itemsPerPage = 5;

  let currentCategory = 'main'; // 'main', 'char', 'weapon', 'skill', 'artifact'
  let artifactPage = 1;
  let weaponPage = 1;

  function buildMainEmbed() {
    const refreshedUser = db.getUser(userId);
    return new EmbedBuilder()
      .setTitle('✨ TRUNG TÂM NÂNG CẤP & CƯỜNG HÓA TRANG BỊ')
      .setColor('#9333ea')
      .setThumbnail(interaction.user.displayAvatarURL())
      .setDescription(`🌐 **Cấp Thám Hiểm**: Lv.${refreshedUser.player_level} (${refreshedUser.player_exp}/${refreshedUser.player_level * 500} EXP)\n\n📦 **Kho Vật Liệu Hiện Có**:\n- 📘 Sách EXP Nhân Vật: **${refreshedUser.materials?.char_exp_book || 0}** cuốn\n- ⚔️ Tinh Thể Vũ Khí: **${refreshedUser.materials?.weapon_exp_crystal || 0}** tinh thể\n- 🔮 Bụi Di Vật: **${refreshedUser.materials?.artifact_dust || 0}** túi\n- 📜 Mầm Kỹ Năng: **${refreshedUser.materials?.trace_material || 0}** mầm`)
      .setFooter({ text: 'Chọn 1 trong 4 danh mục nâng cấp bên dưới!' });
  }

  const categoryRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('up_cat_char').setLabel('👤 Level Nhân Vật').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('up_cat_weapon').setLabel('⚔️ Level Vũ Khí').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('up_cat_skill').setLabel('📜 Kỹ Năng / Ult').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('up_cat_artifact').setLabel('🔮 Cường Hóa Di Vật').setStyle(ButtonStyle.Secondary)
  );

  const response = await interaction.reply({
    embeds: [buildMainEmbed()],
    components: [categoryRow],
    fetchReply: true
  });

  const collector = response.createMessageComponentCollector({
    filter: i => i.message.id === response.id && i.user.id === userId,
    time: 300000
  });

  collector.on('collect', async i => {
    if (i.message.id !== response.id || i.user.id !== userId) return;

    await i.deferUpdate().catch(() => {});

    const userInv = db.getUserInventory(userId);
    const refreshedUser = db.getUser(userId);

    // 1. Character Level Upgrade Category
    if (i.customId === 'up_cat_char') {
      currentCategory = 'char';
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
        .addOptions(selectOptions.slice(0, 25));

      const menuRow = new ActionRowBuilder().addComponents(menu);

      const embed = new EmbedBuilder()
        .setTitle('👤 NÂNG CẤP LEVEL NHÂN VẬT (Lv 1 -> 80)')
        .setColor('#3b82f6')
        .setDescription(`📘 Sách EXP khả dụng: **${refreshedUser.materials?.char_exp_book || 0}** cuốn.\nChọn nhân vật bên dưới để **TỰ ĐỘNG TĂNG CẤP TỐI ĐA**!`);

      await i.editReply({ embeds: [embed], components: [menuRow, categoryRow] });
    }

    else if (i.customId === 'up_menu_char') {
      const charId = i.values[0].replace('up_char_select_', '');
      const result = db.upgradeCharacterLevel(userId, charId, true);

      if (!result.success) return i.followUp({ content: result.message, ephemeral: true });

      const char = charactersData.find(c => c.id === charId);
      const updatedEmbed = new EmbedBuilder()
        .setTitle(`🎉 NÂNG CẤP MAX LEVEL THÀNH CÔNG: ${char.name.toUpperCase()}`)
        .setColor('#10b981')
        .setDescription(`- Đã dùng: **${result.booksUsed}** Sách EXP\n- Level mới: **Lv.${result.newLevel} / 80**!\n📘 Sách EXP còn lại: **${result.remainingBooks}** cuốn.`);

      await i.editReply({ embeds: [updatedEmbed], components: [categoryRow] });
    }

    // 2. Weapon Level Upgrade Category with OwO Pagination
    else if (i.customId === 'up_cat_weapon' || i.customId === 'up_wpn_prev' || i.customId === 'up_wpn_next') {
      currentCategory = 'weapon';
      if (i.customId === 'up_wpn_prev') weaponPage = Math.max(1, weaponPage - 1);
      else if (i.customId === 'up_wpn_next') weaponPage++;
      else if (i.customId === 'up_cat_weapon') weaponPage = 1;

      const userWpns = db.getUserWeapons(userId);

      if (userWpns.length === 0) {
        return i.followUp({ content: '⚠️ Bạn không có Vũ khí nào trong kho!', ephemeral: true });
      }

      const totalPages = Math.ceil(userWpns.length / itemsPerPage) || 1;
      weaponPage = Math.min(Math.max(1, weaponPage), totalPages);

      const start = (weaponPage - 1) * itemsPerPage;
      const pageItems = userWpns.slice(start, start + itemsPerPage);

      const wpnLines = pageItems.map((w, idx) => {
        const starTag = w.rarity === 5 ? '🌟 5★' : '⭐ 4★';
        const equippedTag = (w.equipped_char_id || w.char_id) ? `👤 Đang đeo: **${(w.equipped_char_id || w.char_id).toUpperCase()}**` : '⚪ Trống';
        return `**${start + idx + 1}. [🆔 \`${w.keycode || '#W-NONE'}\`] ${starTag} ${w.name}** (\`Lv.${w.level || 1}/80\` • S${w.superimpose || 1})\n   └ ${equippedTag}`;
      }).join('\n\n');

      const embed = new EmbedBuilder()
        .setTitle(`⚔️ CƯỜNG HÓA VŨ KHÍ / NÓN ÁNH SÁNG (${userWpns.length} MÓN)`)
        .setColor('#10b981')
        .setDescription(`⚔️ Tinh Thể Vũ Khí khả dụng: **${refreshedUser.materials?.weapon_exp_crystal || 0}**\n\n${wpnLines}\n\n👉 *Xem chi tiết ở trang trên và Chọn Mã Keycode ở menu bên dưới để Cường Hóa!*`)
        .setFooter({ text: `Trang ${weaponPage} / ${totalPages} | Dùng ◀ ▶ để lật trang` });

      const selectOptions = pageItems.map(w => ({
        label: `[🆔 ${w.keycode || '#W-NONE'}] (Lv.${w.level || 1}/80)`,
        description: `${w.name.slice(0, 30)} | ${w.equipped_char_id ? w.equipped_char_id.toUpperCase() : 'Trống'}`,
        value: `up_wpn_select_kc_${w.keycode}`,
        emoji: '⚔️'
      }));

      const menuRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('up_menu_weapon')
          .setPlaceholder(`Chọn Mã Keycode (Trang ${weaponPage}/${totalPages}) để Cường Hóa...`)
          .addOptions(selectOptions)
      );

      const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('up_wpn_prev').setLabel('◀ Trang Trước').setStyle(ButtonStyle.Primary).setDisabled(weaponPage <= 1),
        new ButtonBuilder().setCustomId('up_wpn_indicator').setLabel(`📌 Trang ${weaponPage} / ${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('up_wpn_next').setLabel('Trang Sau ▶').setStyle(ButtonStyle.Primary).setDisabled(weaponPage >= totalPages)
      );

      await i.editReply({ embeds: [embed], components: [menuRow, navRow, categoryRow] });
    }

    else if (i.customId === 'up_menu_weapon') {
      const keycode = i.values[0].replace('up_wpn_select_kc_', '');
      const userWpns = db.getUserWeapons(userId);
      const wpn = userWpns.find(w => w.keycode && w.keycode.toUpperCase() === keycode.toUpperCase());

      if (!wpn) return i.followUp({ content: '❌ Không tìm thấy vũ khí!', ephemeral: true });

      const charId = wpn.equipped_char_id || wpn.char_id || 'seele';
      const result = db.upgradeWeaponLevel(userId, charId, true);

      if (!result.success) return i.followUp({ content: result.message, ephemeral: true });

      const updatedEmbed = new EmbedBuilder()
        .setTitle(`🎉 NÂNG CẤP VŨ KHÍ THÀNH CÔNG: ${wpn.name.toUpperCase()}`)
        .setColor('#10b981')
        .setDescription(`- Mã Keycode: \`${wpn.keycode}\`\n- Đã dùng: **${result.crystalsUsed}** Tinh Thể Vũ Khí\n- Cấp độ mới: **Lv.${result.newLevel} / 80**!\n⚔️ Tinh Thể còn lại: **${result.remainingCrystals}**.`);

      await i.editReply({ embeds: [updatedEmbed], components: [categoryRow] });
    }

    // 3. Skill & Ultimate Level Upgrade Category
    else if (i.customId === 'up_cat_skill') {
      currentCategory = 'skill';
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

      await i.editReply({ embeds: [embed], components: [menuRow, categoryRow] });
    }

    else if (i.customId === 'up_menu_skill') {
      const parts = i.values[0].replace('up_sk_select_', '').split('_');
      const charId = parts[0];
      const skillType = parts[1];

      const result = db.upgradeSkillLevel(userId, charId, skillType);

      if (!result.success) return i.followUp({ content: result.message, ephemeral: true });

      const char = charactersData.find(c => c.id === charId);
      let skillName = `Chiến Kỹ (${char.skills.skill.name})`;
      if (skillType === 'ult') skillName = `Tuyệt Kỹ (${char.skills.ultimate.name})`;
      else if (skillType === 'basic') skillName = `Đánh Thường (${char.skills.basic.name})`;

      const maxLvl = skillType === 'basic' ? 6 : 10;

      const updatedEmbed = new EmbedBuilder()
        .setTitle(`🎉 NÂNG CẤP ${skillName.toUpperCase()} THÀNH CÔNG`)
        .setColor('#10b981')
        .setDescription(`Level mới: **Lv.${result.newLevel} / ${maxLvl}**!\n📜 Mầm kỹ năng còn lại: **${result.remainingMaterials}**.`);

      await i.editReply({ embeds: [updatedEmbed], components: [categoryRow] });
    }

    // 4. Artifact Upgrade Category with OwO Pagination + Compact Keycode Select Menu
    else if (i.customId === 'up_cat_artifact' || i.customId === 'up_art_prev' || i.customId === 'up_art_next') {
      currentCategory = 'artifact';
      if (i.customId === 'up_art_prev') artifactPage = Math.max(1, artifactPage - 1);
      else if (i.customId === 'up_art_next') artifactPage++;
      else if (i.customId === 'up_cat_artifact') artifactPage = 1;

      const userArts = db.getUserArtifacts(userId);

      if (userArts.length === 0) {
        return i.followUp({ content: '⚠️ Bạn chưa có Thánh Di Vật nào trong kho! Đánh Boss ở `/battle` hoặc farm ở `/hunt`!', ephemeral: true });
      }

      const totalPages = Math.ceil(userArts.length / itemsPerPage) || 1;
      artifactPage = Math.min(Math.max(1, artifactPage), totalPages);

      const start = (artifactPage - 1) * itemsPerPage;
      const pageItems = userArts.slice(start, start + itemsPerPage);
      const slotsMap = { Head: '🎩 [Head]', Hands: '🥊 [Hands]', Body: '🥼 [Body]', Feet: '👟 [Feet]' };

      const artLines = pageItems.map((art, idx) => {
        const starTag = art.rarity === 5 ? '🌟 5★' : '⭐ 4★';
        const slotLabel = slotsMap[art.slot] || `[${art.slot || 'Head'}]`;
        const equippedChar = art.equipped_char_id || art.char_id;
        const equippedTag = equippedChar ? `👤 Đang đeo: **${equippedChar.toUpperCase()}**` : '⚪ Trống';
        const subStr = (art.subStats || []).map(s => `${s.name}: +${parseFloat(s.value).toFixed(1)}`).join(' | ');

        return `**${start + idx + 1}. [🆔 \`${art.keycode || '#A-NONE'}\`] ${starTag} ${slotLabel} ${art.setName} (+${art.level}/15)**\n   • Main: **${art.mainStat}** (+${art.mainValue.toFixed(1)})\n   • Dòng phụ: \`${subStr || 'ATK% +3.5'}\`\n   • Trạng thái: ${equippedTag}`;
      }).join('\n\n');

      const embed = new EmbedBuilder()
        .setTitle(`🔮 CƯỜNG HÓA DI VẬT (${userArts.length} MÓN)`)
        .setColor('#8b5cf6')
        .setDescription(`🔮 Bụi Di Vật khả dụng: **${refreshedUser.materials?.artifact_dust || 0}** túi\n\n${artLines}\n\n👉 *Xem chi tiết đầy đủ ở trang trên và Chọn Mã Keycode ở menu bên dưới để Cường Hóa!*`)
        .setFooter({ text: `Trang ${artifactPage} / ${totalPages} | Dùng ◀ ▶ để lật trang OwO Style` });

      // Compact Keycode Menu (Only Keycode + Slot + Level for zero truncation!)
      const selectOptions = pageItems.map(art => {
        const starTag = art.rarity === 5 ? '🌟 5★' : '⭐ 4★';
        const equippedChar = art.equipped_char_id || art.char_id;
        return {
          label: `[🆔 ${art.keycode || '#A-NONE'}] (${starTag} ${art.slot} +${art.level})`,
          description: equippedChar ? `👤 Đang đeo: ${equippedChar.toUpperCase()}` : '⚪ Trống',
          value: `up_art_select_kc_${art.keycode}`,
          emoji: '🔮'
        };
      });

      const menuRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('up_menu_artifact_kc')
          .setPlaceholder(`Chọn Mã Keycode (Trang ${artifactPage}/${totalPages}) để Cường Hóa...`)
          .addOptions(selectOptions)
      );

      const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('up_art_prev').setLabel('◀ Trang Trước').setStyle(ButtonStyle.Primary).setDisabled(artifactPage <= 1),
        new ButtonBuilder().setCustomId('up_art_indicator').setLabel(`📌 Trang ${artifactPage} / ${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('up_art_next').setLabel('Trang Sau ▶').setStyle(ButtonStyle.Primary).setDisabled(artifactPage >= totalPages)
      );

      await i.editReply({ embeds: [embed], components: [menuRow, navRow, categoryRow] });
    }

    else if (i.customId === 'up_menu_artifact_kc') {
      const keycode = i.values[0].replace('up_art_select_kc_', '');
      const userArts = db.getUserArtifacts(userId);
      const art = userArts.find(a => a.keycode && a.keycode.toUpperCase() === keycode.toUpperCase());

      if (!art) return i.followUp({ content: '❌ Không tìm thấy Di vật!', ephemeral: true });

      const result = db.upgradeArtifact(userId, art.keycode, 5);

      if (!result.success) return i.followUp({ content: result.message, ephemeral: true });

      const subLines = (result.subStats || []).map(s => `• **${s.name}**: +${parseFloat(s.value).toFixed(1)}`).join('\n');
      const rngLog = result.upgradedSubNames.length > 0
        ? `\n\n🎲 **Nhảy Dòng RNG**: \n${result.upgradedSubNames.map(l => `✨ ${l}`).join('\n')}`
        : '';

      const updatedEmbed = new EmbedBuilder()
        .setTitle(`🎉 CƯỜNG HÓA DI VẬT THÀNH CÔNG! (+${result.newLevel}/15)`)
        .setColor('#10b981')
        .setDescription(`- Mã Keycode: \`${art.keycode}\` [${art.slot}]\n- Cấp Phẩm: **${art.rarity || 5}★**\n- Đã dùng: **${result.dustUsed}** Bụi Di Vật\n- Chỉ số chính: **+${result.mainValue.toFixed(1)}**\n\n**Các Dòng Phụ Chi Tiết**:\n${subLines}${rngLog}\n\n🔮 Bụi Di Vật còn lại: **${result.remainingDust}**.`);

      await i.editReply({ embeds: [updatedEmbed], components: [categoryRow] });
    }
  });
}

module.exports = {
  data: upgradeCommand,
  execute: executeUpgrade
};
