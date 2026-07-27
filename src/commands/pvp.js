const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const pvpCommand = new SlashCommandBuilder()
  .setName('pvp')
  .setDescription('Thách đấu Đội Hình PVP giữa 2 người chơi (Turn-based Combat Engine)')
  .addUserOption(opt =>
    opt.setName('target')
      .setDescription('Chọn Người chơi muốn thách đấu PVP')
      .setRequired(true)
  );

async function executePvp(interaction) {
  const challengerId = interaction.user.id;
  const targetUser = interaction.options.getUser('target');

  if (!targetUser) {
    return interaction.reply({ content: '❌ Vui lòng chọn người chơi muốn thách đấu!', ephemeral: true });
  }

  if (targetUser.id === challengerId) {
    return interaction.reply({ content: '⚠️ Bạn không thể tự thách đấu PVP với chính mình!', ephemeral: true });
  }

  if (targetUser.bot) {
    return interaction.reply({ content: '❌ Bạn không thể thách đấu PVP với Bot!', ephemeral: true });
  }

  const p1Team = db.getUserTeam(challengerId);
  const p2Team = db.getUserTeam(targetUser.id);

  const p1Inv = db.getUserInventory(challengerId);
  const p2Inv = db.getUserInventory(targetUser.id);

  if (p1Inv.length === 0) {
    return interaction.reply({ content: '⚠️ Bạn chưa có nhân vật nào trong đội hình để PVP!', ephemeral: true });
  }
  if (p2Inv.length === 0) {
    return interaction.reply({ content: `⚠️ Người chơi <@${targetUser.id}> chưa có nhân vật nào để tham gia PVP!`, ephemeral: true });
  }

  // Calculate Power Score for Team 1
  let p1Power = 0;
  [p1Team.slot1, p1Team.slot2, p1Team.slot3, p1Team.slot4].forEach(charId => {
    const inv = p1Inv.find(c => c.char_id === charId);
    if (inv) {
      const char = charactersData.find(c => c.id === charId);
      if (char) {
        const hp = char.baseStats.hp + (inv.level - 1) * 40;
        const atk = char.baseStats.atk + (inv.level - 1) * 18 + (inv.weapon_level || 1) * 12;
        const def = char.baseStats.def + (inv.level - 1) * 12;
        p1Power += (hp * 0.5 + atk * 2.5 + def * 1.5) * (1 + (inv.eidolon || 0) * 0.1);
      }
    }
  });

  // Calculate Power Score for Team 2
  let p2Power = 0;
  [p2Team.slot1, p2Team.slot2, p2Team.slot3, p2Team.slot4].forEach(charId => {
    const inv = p2Inv.find(c => c.char_id === charId);
    if (inv) {
      const char = charactersData.find(c => c.id === charId);
      if (char) {
        const hp = char.baseStats.hp + (inv.level - 1) * 40;
        const atk = char.baseStats.atk + (inv.level - 1) * 18 + (inv.weapon_level || 1) * 12;
        const def = char.baseStats.def + (inv.level - 1) * 12;
        p2Power += (hp * 0.5 + atk * 2.5 + def * 1.5) * (1 + (inv.eidolon || 0) * 0.1);
      }
    }
  });

  // Add RNG Luck Factor (+- 15%)
  const p1Roll = p1Power * (0.85 + Math.random() * 0.3);
  const p2Roll = p2Power * (0.85 + Math.random() * 0.3);

  const isP1Winner = p1Roll >= p2Roll;
  const winnerUser = isP1Winner ? interaction.user : targetUser;
  const loserUser = isP1Winner ? targetUser : interaction.user;

  const winnerPower = isP1Winner ? p1Roll : p2Roll;
  const loserPower = isP1Winner ? p2Roll : p1Roll;

  // Reward Jades to Winner
  db.updateUserJades(winnerUser.id, 300);

  const pvpEmbed = new EmbedBuilder()
    .setTitle(`⚔️ ĐẤU TRƯỜNG PVP ĐỘI HÌNH: ${interaction.user.username.toUpperCase()} VS ${targetUser.username.toUpperCase()}`)
    .setColor(isP1Winner ? '#10b981' : '#ef4444')
    .setThumbnail(winnerUser.displayAvatarURL())
    .setDescription(`🔥 **KẾT QUẢ THÁCH ĐẤU PVP BANH NÓC!**\n\n👑 **NGƯỜI CHIẾN THẮNG**: **<@${winnerUser.id}>**! 🎉\n\n📊 **Chi Tiết Lực Chiến Đội Hình**:\n• **<@${interaction.user.id}>**: \`${Math.round(p1Roll).toLocaleString()} Lực Chiến\`\n• **<@${targetUser.id}>**: \`${Math.round(p2Roll).toLocaleString()} Lực Chiến\`\n\n🎁 **Phần Thưởng Thưởng Thắng PVP**: **+300 Ngọc Ánh Sao (Jades)** cho <@${winnerUser.id}>!`)
    .setFooter({ text: 'Dùng /team để sắp xếp đội hình mạnh nhất trước khi tham gia PVP!' });

  await interaction.reply({ content: `⚔️ Trận đấu PVP giữa <@${challengerId}> và <@${targetUser.id}> đã khép lại!`, embeds: [pvpEmbed] });
}

module.exports = {
  data: pvpCommand,
  execute: executePvp
};
