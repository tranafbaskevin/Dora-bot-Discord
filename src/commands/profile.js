const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const profileCommand = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Xem hồ sơ cá nhân, Nguyên thạch và Kho nhân vật của bạn');

async function executeProfile(interaction) {
  const user = db.getUser(interaction.user.id);
  const inventory = db.getUserInventory(interaction.user.id);

  const embed = new EmbedBuilder()
    .setTitle(`📊 HỒ SƠ NGƯỜI CHƠI - ${interaction.user.username}`)
    .setColor('#00ffff')
    .setThumbnail(interaction.user.displayAvatarURL())
    .addFields(
      { name: '💎 Nguyên thạch (Stellar Jade)', value: `**${user.jades.toLocaleString()}**`, inline: true },
      { name: '🎯 Pity 5★ / 4★', value: `${user.pity_5star}/90 | ${user.pity_4star}/10`, inline: true },
      { name: '👥 Nhân vật sở hữu', value: `**${inventory.length}** nhân vật`, inline: true }
    );

  const charLines = inventory.map(item => {
    const char = charactersData.find(c => c.id === item.char_id);
    if (!char) return null;
    const stars = '⭐'.repeat(char.rarity);
    return `${stars} **${char.name}** (${char.element}) - Tinh Hồn E${item.eidolon}`;
  }).filter(Boolean);

  embed.addFields({
    name: '🎒 Danh sách nhân vật:',
    value: charLines.length > 0 ? charLines.join('\n') : 'Chưa có nhân vật nào.'
  });

  await interaction.reply({ embeds: [embed] });
}

module.exports = {
  data: profileCommand,
  execute: executeProfile
};
