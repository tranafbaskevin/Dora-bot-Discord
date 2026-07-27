const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');

const huntCommand = new SlashCommandBuilder()
  .setName('hunt')
  .setDescription('Săn quái thường (Hunting Mobs) để cày EXP, Jades, Vật liệu và phôi Thánh Di Vật');

async function executeHunt(interaction) {
  const userId = interaction.user.id;
  const user = db.getUser(userId);

  const mobNames = [
    '👾 Voidranger: Eliminator',
    '🤖 Automaton Beetle',
    '🐺 Silvermane Guard Elite',
    '🌺 Mara-Struck Soldier',
    '🐉 Abundance Sprite: Malefic Ape'
  ];

  const mob = mobNames[Math.floor(Math.random() * mobNames.length)];
  const jadesEarned = Math.floor(Math.random() * 80) + 120; // 120-200 Jades
  const expEarned = Math.floor(Math.random() * 50) + 150;
  const booksEarned = Math.floor(Math.random() * 3) + 2;
  const crystalsEarned = Math.floor(Math.random() * 3) + 2;
  const dustEarned = Math.floor(Math.random() * 5) + 3;

  // Add rewards to user
  db.addPlayerExp(userId, expEarned);
  user.materials.char_exp_book = (user.materials.char_exp_book || 0) + booksEarned;
  user.materials.weapon_exp_crystal = (user.materials.weapon_exp_crystal || 0) + crystalsEarned;
  user.materials.artifact_dust = (user.materials.artifact_dust || 0) + dustEarned;

  // Chance to drop a new 4★ or 5★ Relic piece with Keycode UID!
  let droppedArtifact = null;
  if (Math.random() > 0.4) {
    const slots = ['Head', 'Hands', 'Body', 'Feet'];
    const setNames = ['Bộ Thiện Xạ Trường Hoang', 'Bộ Thiên Tài Kim Loại', 'Bộ Thợ Săn Băng Tuyết', 'Bộ Hiệp Sĩ Cung Điện'];
    const chosenSet = setNames[Math.floor(Math.random() * setNames.length)];
    const chosenSlot = slots[Math.floor(Math.random() * slots.length)];

    droppedArtifact = db.addArtifact(userId, {
      setName: chosenSet,
      rarity: Math.random() > 0.7 ? 5 : 4,
      slot: chosenSlot,
      mainStat: chosenSlot === 'Head' ? 'HP' : (chosenSlot === 'Hands' ? 'ATK' : 'CRIT DMG%'),
      mainValue: 4.5
    });
  }

  // Handle Debt Repayment Trigger
  const debtResult = db.repayDebtOnFarm(userId, jadesEarned);
  const netJadesGained = jadesEarned - debtResult.repaid;
  if (netJadesGained > 0) {
    user.jades += netJadesGained;
  }

  let debtMessage = '';
  if (debtResult.repaid > 0) {
    debtMessage = `\n\n🏦 **TỰ ĐỘNG TRẢ NỢ**: Đã tự động chuyển **${debtResult.repaid} Jades** cho chủ nợ <@${debtResult.lenderId}>! ${debtResult.debtCleared ? '🎉 **BẠN ĐÃ HOÀN TRẢ HẾT NỢ!**' : `(Còn nợ: ${debtResult.debtRemaining.toLocaleString()} Jades)`}`;
  }

  const artText = droppedArtifact
    ? `\n\n🛡️ **NHẶT ĐƯỢC DI VẬT MỚI**: **${droppedArtifact.setName} (${droppedArtifact.rarity}★)** [\`${droppedArtifact.keycode}\`] vị trí **[${droppedArtifact.slot}]**!`
    : '';

  const embed = new EmbedBuilder()
    .setTitle(`🌲 CHUYẾN SĂN BẮT QUÁI THƯỜNG - THÀNH CÔNG!`)
    .setColor('#10b981')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setDescription(`Bạn đã chạm trán và tiêu diệt thành công **${mob}**!\n\n🎁 **Phần Thưởng Thu Được**:\n• 💎 **Ngọc Ánh Sao**: \`+${jadesEarned} Jades\` ${netJadesGained < jadesEarned ? `*(Thực nhận: +${netJadesGained})*` : ''}\n• 🌟 **EXP Thám Hiểm**: \`+${expEarned} EXP\`\n• 📘 **Sách EXP**: \`+${booksEarned} cuốn\`\n• ⚔️ **Tinh Thể Vũ Khí**: \`+${crystalsEarned} tinh thể\`\n• 🔮 **Bụi Di Vật**: \`+${dustEarned} túi\`${artText}${debtMessage}`)
    .setFooter({ text: 'Dùng /inventory để kiểm tra kho đồ và di vật mới nhặt được!' });

  await interaction.reply({ embeds: [embed] });
}

module.exports = {
  data: huntCommand,
  execute: executeHunt
};
