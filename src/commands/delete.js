const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');

const deleteCommand = new SlashCommandBuilder()
  .setName('delete')
  .setDescription('Rã trang bị rác theo Mã Keycode độc nhất (Mobile-Friendly: Gõ liền mạch /delete #MÃ_CODE)')
  .addStringOption(opt =>
    opt.setName('code')
      .setDescription('Mã Keycode trang bị muốn rã (Ví dụ: #A-1082 hoặc nhiều mã #A-1082 #A-1083 #W-5021)')
      .setRequired(true)
  );

async function executeDelete(interaction) {
  const userId = interaction.user.id;
  const inputCode = interaction.options.getString('code') || '';

  // Smart Parser: Extract all keycode tokens starting with # or matching A-xxx / W-xxx
  const rawTokens = inputCode.split(/[\s,]+/);
  const keycodes = rawTokens.filter(t => t.startsWith('#') || /^([AWaw]-\d+)$/i.test(t));

  if (keycodes.length === 0) {
    return interaction.reply({
      content: '❌ Vui lòng nhập Mã Keycode trang bị hợp lệ! Ví dụ: `/delete #A-1082` hoặc `/delete #A-1082 #W-5021`',
      ephemeral: true
    });
  }

  const result = db.dismantleItemsByKeycodes(userId, keycodes);

  if (!result.success) {
    return interaction.reply({ content: result.message, ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle('♻️ PHÂN RÃ TRANG BỊ RÁC THÀNH CÔNG!')
    .setColor('#10b981')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setDescription(`Đã phân rã thành công **${result.count} trang bị** khỏi kho chứa!`)
    .addFields(
      { name: '📋 Danh Sách Đã Rã', value: result.dismantledNames.map(n => `• ${n}`).join('\n').slice(0, 1000), inline: false },
      { name: '🔮 Bụi Di Vật Thu Được', value: `+${result.dustGained} túi (Tổng: **${result.totalDust}**)`, inline: true },
      { name: '⚔️ Tinh Thể Vũ Khí Thu Được', value: `+${result.crystalsGained} tinh thể (Tổng: **${result.totalCrystals}**)`, inline: true }
    )
    .setFooter({ text: 'Trang bị đang đeo cho Nhân vật sẽ được tự động bảo vệ không bị rã nhầm!' });

  await interaction.reply({ embeds: [embed] });
}

module.exports = {
  data: deleteCommand,
  execute: executeDelete
};
