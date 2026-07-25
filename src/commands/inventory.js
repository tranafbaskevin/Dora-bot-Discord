const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const inventoryCommand = new SlashCommandBuilder()
  .setName('inventory')
  .setDescription('Quản lý Túi đồ, Trang bị Vũ khí & Phân tách vật phẩm')
  .addSubcommand(sub =>
    sub.setName('view')
      .setDescription('Xem túi đồ & Thay đổi Nón Ánh Sáng / Di vật cho từng nhân vật')
  )
  .addSubcommand(sub =>
    sub.setName('recycle')
      .setDescription('Phân tách tất cả Nón ánh sáng rác 3★ để quy đổi thành Nguyên thạch')
  );

async function executeInventory(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;
  const user = db.getUser(userId);

  if (subcommand === 'recycle') {
    const result = db.recycleTrashItems(userId);
    if (!result.success) {
      return interaction.reply({
        content: '⚠️ Bạn không có Nón ánh sáng 3★ rác nào trong túi đồ để phân tách!',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('♻️ PHÂN TÁCH VẬT PHẨM THÀNH CÔNG!')
      .setColor('#10b981')
      .setDescription(`Bạn đã phân tách **${result.count}** Nón ánh sáng 3★ rác.\n\n🎁 **Phần thưởng nhận lại**: **+${result.jadesGained.toLocaleString()}** Nguyên thạch!\n💎 **Tổng Nguyên thạch hiện tại**: **${result.totalJades.toLocaleString()}**`);

    return interaction.reply({ embeds: [embed] });
  }

  if (subcommand === 'view') {
    const userInv = db.getUserInventory(userId);
    const team = db.getUserTeam(userId);
    const teamCharIds = [team.slot1, team.slot2, team.slot3, team.slot4];

    // Main Inventory Embed
    const mainEmbed = new EmbedBuilder()
      .setTitle(`🎒 TÚI ĐỒ VẬT PHẨM & TRANG BỊ - ${interaction.user.username}`)
      .setColor('#38bdf8')
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: '💎 Nguyên Thạch (Stellar Jade)', value: `**${user.jades.toLocaleString()}**`, inline: true },
        { name: '⚪ Nón Ánh Sáng 3★ Rác', value: `**${user.trash_items || 0}** món`, inline: true },
        { name: '👥 Nhân Vật Sở Hữu', value: `**${userInv.length}** nhân vật`, inline: true }
      )
      .setDescription('Nhấn vào **Nút bấm đại diện cho từng nhân vật** bên dưới để xem và thay đổi **Nón Ánh Sáng (Vũ khí)** hoặc **Di Vật (Artifacts)**!');

    // Build 4 Action Buttons for Team Characters
    const buttonsRow = new ActionRowBuilder();
    teamCharIds.forEach((charId, idx) => {
      const char = charactersData.find(c => c.id === charId) || charactersData[0];
      buttonsRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`inv_char_${char.id}`)
          .setLabel(`Slot ${idx + 1}: ${char.name}`)
          .setStyle(ButtonStyle.Primary)
      );
    });

    const response = await interaction.reply({
      embeds: [mainEmbed],
      components: [buttonsRow],
      fetchReply: true
    });

    const collector = response.createMessageComponentCollector({
      time: 300000
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '❌ Bạn không phải là người sở hữu túi đồ này!', ephemeral: true });
      }

      // Handle Character Button Click
      if (i.customId.startsWith('inv_char_')) {
        const charId = i.customId.replace('inv_char_', '');
        const char = charactersData.find(c => c.id === charId);
        const invRecord = db.getUserInventory(userId).find(inv => inv.char_id === charId);

        if (!char || !invRecord) return;

        const lightCone = invRecord.light_cone || 'Nón Ánh Sáng Tiêu Chuẩn (4★)';
        const artifactSet = invRecord.artifact_set || 'Bộ Duyên Kiếp Băng Tiêu';

        const charEmbed = new EmbedBuilder()
          .setTitle(`🛡️ QUẢN LÝ TRANG BỊ: ${char.name.toUpperCase()} (${char.element})`)
          .setColor(char.color || '#3b82f6')
          .addFields(
            { name: '🗡️ Nón Ánh Sáng (Vũ Khí Hiện Tại)', value: `**${lightCone}**`, inline: false },
            { name: '🔮 Di Vật (Artifact Set Hiện Tại)', value: `**${artifactSet}**`, inline: false }
          )
          .setFooter({ text: 'Chọn từ Menu Dropdown bên dưới để thay đổi trang bị!' });

        // Select Menu for Light Cones
        const lcMenu = new StringSelectMenuBuilder()
          .setCustomId(`inv_set_lc_${char.id}`)
          .setPlaceholder('🔄 Thay đổi Nón Ánh Sáng (Vũ Khí)...')
          .addOptions(
            { label: 'In the Night (5★)', description: 'Tăng 18% Tỷ lệ bạo kích', value: 'In the Night (5★)' },
            { label: 'Before Dawn (5★)', description: 'Tăng 24% Sát thương Tuyệt Kỹ', value: 'Before Dawn (5★)' },
            { label: 'Only Silence Remains (4★)', description: 'Tăng 12% Tấn công ATK', value: 'Only Silence Remains (4★)' },
            { label: 'Shared Feeling (4★)', description: 'Tăng 10% Hồi phục Năng lượng', value: 'Shared Feeling (4★)' }
          );

        // Select Menu for Artifacts
        const artMenu = new StringSelectMenuBuilder()
          .setCustomId(`inv_set_art_${char.id}`)
          .setPlaceholder('🔮 Thay đổi Bộ Di Vật (Artifact Set)...')
          .addOptions(
            { label: 'Bộ Thợ Lặn Ranh Ma', description: '+20% Quantum DMG', value: 'Bộ Thợ Lặn Ranh Ma (+20% Quantum DMG)' },
            { label: 'Bộ Chim Ưng Ranh Ma', description: '+15% Wind DMG', value: 'Bộ Chim Ưng Ranh Ma (+15% Wind DMG)' },
            { label: 'Bộ Vệ Binh Băng Tuyết', description: '+15% DEF Phòng Thủ', value: 'Bộ Vệ Binh Băng Tuyết (+15% DEF)' },
            { label: 'Bộ Lãng Khách Âm Thầm', description: '+10% Lượng Hồi Máu', value: 'Bộ Lãng Khách Âm Thầm (+10% Healing)' }
          );

        const rowLc = new ActionRowBuilder().addComponents(lcMenu);
        const rowArt = new ActionRowBuilder().addComponents(artMenu);

        await i.update({
          embeds: [charEmbed],
          components: [rowLc, rowArt, buttonsRow]
        });
      }

      // Handle Equipment Changes Dropdown Selection
      else if (i.customId.startsWith('inv_set_lc_') || i.customId.startsWith('inv_set_art_')) {
        const isLc = i.customId.startsWith('inv_set_lc_');
        const charId = i.customId.replace(isLc ? 'inv_set_lc_' : 'inv_set_art_', '');
        const char = charactersData.find(c => c.id === charId);
        const newValue = i.values[0];

        if (isLc) {
          db.updateEquipment(userId, charId, newValue, null);
        } else {
          db.updateEquipment(userId, charId, null, newValue);
        }

        const invRecord = db.getUserInventory(userId).find(inv => inv.char_id === charId);

        const updatedEmbed = new EmbedBuilder()
          .setTitle(`✅ CẬP NHẬT TRANG BỊ: ${char.name.toUpperCase()}`)
          .setColor('#10b981')
          .setDescription(`Đã thay đổi thành công ${isLc ? 'Nón Ánh Sáng' : 'Bộ Di Vật'}!`)
          .addFields(
            { name: '🗡️ Nón Ánh Sáng (Vũ Khí)', value: `**${invRecord.light_cone}**`, inline: false },
            { name: '🔮 Di Vật (Artifact Set)', value: `**${invRecord.artifact_set}**`, inline: false }
          );

        await i.update({
          embeds: [updatedEmbed],
          components: [buttonsRow]
        });
      }
    });
  }
}

module.exports = {
  data: inventoryCommand,
  execute: executeInventory
};
