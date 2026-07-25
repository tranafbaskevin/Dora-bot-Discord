const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database/db');

const adminCommand = new SlashCommandBuilder()
  .setName('admin')
  .setDescription('Lệnh quản trị viên / Admin Testing Cheats')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sub =>
    sub.setName('giveall')
      .setDescription('Nhận ngay +100,000 Nguyên Thạch và vô số Vật Liệu Nâng Cấp để test game!')
  );

async function executeAdmin(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) && interaction.guild) {
    return interaction.reply({
      content: '❌ Bạn không có quyền Administrator (Quản trị viên) để sử dụng lệnh Admin này!',
      ephemeral: true
    });
  }

  const userId = interaction.user.id;

  // Atomically add resources and save directly to DB
  const user = db.addAdminResources(userId);

  const embed = new EmbedBuilder()
    .setTitle('👑 ADMIN CHEAT GRANTED - NHẬN TÀI NGUYÊN TEST GAME!')
    .setColor('#10b981')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setDescription('Đã cộng thành công tài nguyên test game vào tài khoản Admin của bạn:')
    .addFields(
      { name: '💎 Nguyên Thạch (Stellar Jade)', value: `+100,000 Jades (Tổng: **${user.jades.toLocaleString()}**)`, inline: false },
      { name: '📘 Sách EXP Nhân Vật', value: `+500 cuốn (Tổng: **${user.materials.char_exp_book}**)`, inline: true },
      { name: '⚔️ Tinh Thể Vũ Khí', value: `+500 tinh thể (Tổng: **${user.materials.weapon_exp_crystal}**)`, inline: true },
      { name: '🔮 Bụi Vàng Di Vật', value: `+500 túi (Tổng: **${user.materials.artifact_dust}**)`, inline: true },
      { name: '📜 Mầm Kỹ Năng', value: `+500 mầm (Tổng: **${user.materials.trace_material}**)`, inline: true }
    )
    .setFooter({ text: 'Có thể dùng lại lệnh /admin giveall vô số lần khi hết tài nguyên!' });

  await interaction.reply({ embeds: [embed] });
}

module.exports = {
  data: adminCommand,
  execute: executeAdmin
};
