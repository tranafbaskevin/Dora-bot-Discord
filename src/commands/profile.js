const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const profileCommand = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Xem hồ sơ cá nhân, Cấp thám hiểm, Nguyên thạch và Kho nhân vật của bạn');

async function executeProfile(interaction) {
  const user = db.getUser(interaction.user.id);
  const inventory = db.getUserInventory(interaction.user.id);
  const teamData = db.getUserTeam(interaction.user.id);

  const primaryCharId = teamData.slot1 || (inventory[0] ? inventory[0].char_id : 'seele');
  const primaryChar = charactersData.find(c => c.id === primaryCharId);

  const reqExp = (user.player_level || 1) * 500;

  const embed = new EmbedBuilder()
    .setTitle(`📊 HỒ SƠ NGƯỜI CHƠI - ${interaction.user.username}`)
    .setColor('#00ffff')
    .addFields(
      { name: '🌐 Cấp Thám Hiểm (Trailblaze Lv)', value: `**Lv.${user.player_level || 1}** (${user.player_exp || 0}/${reqExp} EXP)`, inline: false },
      { name: '💎 Nguyên Thạch (Stellar Jade)', value: `**${user.jades.toLocaleString()}**`, inline: true },
      { name: '🎯 Pity 5★ / 4★', value: `${user.pity_5star}/90 | ${user.pity_4star}/10`, inline: true },
      { name: '👥 Nhân Vật Sở Hữu', value: `**${inventory.length}** nhân vật`, inline: true },
      {
        name: '📦 Kho Vật Liệu Nâng Cấp',
        value: `📘 **Sách EXP**: ${user.materials?.char_exp_book || 0} | ⚔️ **Tinh Thể Vũ Khí**: ${user.materials?.weapon_exp_crystal || 0}\n🔮 **Bụi Di Vật**: ${user.materials?.artifact_dust || 0} | 📜 **Mầm Kỹ Năng**: ${user.materials?.trace_material || 0}`,
        inline: false
      }
    );

  let avatarAttachment = null;
  if (primaryChar && primaryChar.icon) {
    if (primaryChar.icon.startsWith('http')) {
      embed.setThumbnail(primaryChar.icon);
    } else {
      const localPath = path.join(__dirname, '../../', primaryChar.icon);
      if (fs.existsSync(localPath)) {
        const ext = path.extname(localPath).replace('.', '') || 'jpg';
        avatarAttachment = new AttachmentBuilder(localPath, { name: `avatar.${ext}` });
        embed.setThumbnail(`attachment://avatar.${ext}`);
      }
    }
  } else {
    embed.setThumbnail(interaction.user.displayAvatarURL());
  }

  const charLines = inventory.map(item => {
    const char = charactersData.find(c => c.id === item.char_id);
    if (!char) return null;
    const stars = '⭐'.repeat(char.rarity);
    return `${stars} **${char.name}** (Lv.${item.level || 1} • Wpn Lv.${item.weapon_level || 1}) - E${item.eidolon} | Kỹ năng: Lv.${item.skill_lvl || 1}`;
  }).filter(Boolean);

  embed.addFields({
    name: '🎒 Danh sách nhân vật:',
    value: charLines.length > 0 ? charLines.join('\n') : 'Chưa có nhân vật nào.'
  });

  embed.setFooter({ text: 'Dùng /upgrade để nâng cấp Level Nhân vật, Vũ khí, Kỹ năng & Di vật!' });

  const payload = { embeds: [embed] };
  if (avatarAttachment) payload.files = [avatarAttachment];

  await interaction.reply(payload);
}

module.exports = {
  data: profileCommand,
  execute: executeProfile
};
