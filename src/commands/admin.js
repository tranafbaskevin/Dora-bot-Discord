const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database/db');

const adminCommand = new SlashCommandBuilder()
  .setName('admin')
  .setDescription('Lệnh quản trị viên / Admin Testing Cheats')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sub =>
    sub.setName('giveall')
      .setDescription('Tặng +100,000 Nguyên Thạch và 500 Vật Liệu Nâng Cấp cho bản thân hoặc người chơi khác!')
      .addUserOption(opt =>
        opt.setName('target')
          .setDescription('Người chơi muốn cấp tài nguyên (Để trống để tự nhận)')
          .setRequired(false)
      )
  );

async function executeAdmin(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) && interaction.guild) {
    return interaction.reply({
      content: '❌ Bạn không có quyền Administrator (Quản trị viên) để sử dụng lệnh Admin này!',
      ephemeral: true
    });
  }

  const targetUser = interaction.options.getUser('target') || interaction.user;
  const targetId = targetUser.id;

  // Atomically add resources to target user and save directly to DB
  const updatedUser = db.addAdminResources(targetId);

  const isSelf = targetId === interaction.user.id;
  const targetMention = isSelf ? 'bản thân' : `người chơi **<@${targetId}>**`;

  const embed = new EmbedBuilder()
    .setTitle('👑 ADMIN CHEAT GRANTED - CẤP TÀI NGUYÊN TEST GAME!')
    .setColor('#10b981')
    .setThumbnail(targetUser.displayAvatarURL())
    .setDescription(`Admin **<@${interaction.user.id}>** đã cấp thành công tài nguyên test game cho ${targetMention}:`)
    .addFields(
      { name: '💎 Nguyên Thạch (Stellar Jade)', value: `+100,000 Jades (Tổng: **${updatedUser.jades.toLocaleString()}**)`, inline: false },
      { name: '📘 Sách EXP Nhân Vật', value: `+500 cuốn (Tổng: **${updatedUser.materials.char_exp_book}**)`, inline: true },
      { name: '⚔️ Tinh Thể Vũ Khí', value: `+500 tinh thể (Tổng: **${updatedUser.materials.weapon_exp_crystal}**)`, inline: true },
      { name: '🔮 Bụi Vàng Di Vật', value: `+500 túi (Tổng: **${updatedUser.materials.artifact_dust}**)`, inline: true },
      { name: '📜 Mầm Kỹ Năng', value: `+500 mầm (Tổng: **${updatedUser.materials.trace_material}**)`, inline: true }
    )
    .setFooter({ text: 'Có thể dùng lệnh /admin giveall [target] để tặng tài nguyên cho bất kỳ ai!' });

  await interaction.reply({ embeds: [embed] });
}

module.exports = {
  data: adminCommand,
  execute: executeAdmin
};
