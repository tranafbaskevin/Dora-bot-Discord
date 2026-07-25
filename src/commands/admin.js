const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');

const adminCommand = new SlashCommandBuilder()
  .setName('admin')
  .setDescription('Lệnh quản trị viên / Admin Testing Cheats')
  .addSubcommand(sub =>
    sub.setName('giveall')
      .setDescription('Nhận ngay +100,000 Nguyên Thạch và vô số Vật Liệu Nâng Cấp để test game!')
  );

async function executeAdmin(interaction) {
  const userId = interaction.user.id;
  const user = db.getUser(userId);

  // Give 100,000 Jades
  db.updateUserJades(userId, user.jades + 100000);

  // Give 500 of all upgrade materials
  user.materials.char_exp_book = (user.materials.char_exp_book || 0) + 500;
  user.materials.weapon_exp_crystal = (user.materials.weapon_exp_crystal || 0) + 500;
  user.materials.artifact_dust = (user.materials.artifact_dust || 0) + 500;
  user.materials.trace_material = (user.materials.trace_material || 0) + 500;

  // Re-save database
  const rawDb = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../database.json'), 'utf8'));
  rawDb.users[userId] = user;
  require('fs').writeFileSync(require('path').join(__dirname, '../../database.json'), JSON.stringify(rawDb, null, 2));

  const embed = new EmbedBuilder()
    .setTitle('🎁 CHEAT ADMIN GRANTED - NHẬN VẬT PHẨM MỚI!')
    .setColor('#10b981')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setDescription('Đã cộng thành công tài nguyên test game vào tài khoản của bạn:')
    .addFields(
      { name: '💎 Nguyên Thạch (Stellar Jade)', value: `+100,000 Jades (Tổng: **${(user.jades + 100000).toLocaleString()}**)`, inline: false },
      { name: '📘 Sách EXP Nhân Vật', value: `+500 cuốn (Tổng: **${user.materials.char_exp_book}**)`, inline: true },
      { name: '⚔️ Tinh Thể Vũ Khí', value: `+500 tinh thể (Tổng: **${user.materials.weapon_exp_crystal}**)`, inline: true },
      { name: '🔮 Bụi Vàng Di Vật', value: `+500 túi (Tổng: **${user.materials.artifact_dust}**)`, inline: true },
      { name: '📜 Mầm Kỹ Năng', value: `+500 mầm (Tổng: **${user.materials.trace_material}**)`, inline: true }
    )
    .setFooter({ text: 'Dùng /upgrade hoặc /gacha để thỏa thích test game!' });

  await interaction.reply({ embeds: [embed] });
}

module.exports = {
  data: adminCommand,
  execute: executeAdmin
};
