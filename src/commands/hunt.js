const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');

const huntCommand = new SlashCommandBuilder()
  .setName('hunt')
  .setDescription('Săn quái thường: Nhận tối đa 2 vật phẩm (Jades hiếm rơi 30%)');

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

  // EXP per hunt (20 - 40 EXP)
  const expEarned = Math.floor(Math.random() * 20) + 20;

  // Jades are RARE: Only 30% chance to drop (20 - 50 Jades)
  const dropJadesChance = Math.random() < 0.3;
  const jadesEarned = dropJadesChance ? Math.floor(Math.random() * 30) + 20 : 0;

  // Pick MAX 2 Items from the material/relic pool
  let itemsRewardText = [];
  let droppedArtifact = null;

  const itemTypes = ['book', 'crystal', 'dust', 'relic'];
  // Pick 2 distinct item types
  const shuffled = itemTypes.sort(() => 0.5 - Math.random());
  const selectedTypes = shuffled.slice(0, 2);

  selectedTypes.forEach(t => {
    if (t === 'book') {
      const count = Math.floor(Math.random() * 2) + 1; // 1-2 books
      user.materials.char_exp_book = (user.materials.char_exp_book || 0) + count;
      itemsRewardText.push(`📘 **Sách EXP**: \`+${count} cuốn\``);
    } else if (t === 'crystal') {
      const count = Math.floor(Math.random() * 2) + 1; // 1-2 crystals
      user.materials.weapon_exp_crystal = (user.materials.weapon_exp_crystal || 0) + count;
      itemsRewardText.push(`⚔️ **Tinh Thể Vũ Khí**: \`+${count} tinh thể\``);
    } else if (t === 'dust') {
      const count = Math.floor(Math.random() * 3) + 1; // 1-3 dust
      user.materials.artifact_dust = (user.materials.artifact_dust || 0) + count;
      itemsRewardText.push(`🔮 **Bụi Di Vật**: \`+${count} túi\``);
    } else if (t === 'relic') {
      // 25% chance to drop a relic piece if relic type was selected
      if (Math.random() < 0.25) {
        const slots = ['Head', 'Hands', 'Body', 'Feet'];
        const setNames = ['Bộ Thiện Xạ Trường Hoang', 'Bộ Thiên Tài Kim Loại', 'Bộ Thợ Săn Băng Tuyết', 'Bộ Hiệp Sĩ Cung Điện'];
        const chosenSet = setNames[Math.floor(Math.random() * setNames.length)];
        const chosenSlot = slots[Math.floor(Math.random() * slots.length)];

        droppedArtifact = db.addArtifact(userId, {
          setName: chosenSet,
          rarity: Math.random() > 0.8 ? 5 : 4,
          slot: chosenSlot,
          mainStat: chosenSlot === 'Head' ? 'HP' : (chosenSlot === 'Hands' ? 'ATK' : 'CRIT DMG%'),
          mainValue: 4.5
        });
        itemsRewardText.push(`🛡️ **Thánh Di Vật**: **${droppedArtifact.setName} (${droppedArtifact.rarity}★)** [\`${droppedArtifact.keycode}\`] [${droppedArtifact.slot}]`);
      }
    }
  });

  db.addPlayerExp(userId, expEarned);

  // Handle Debt Repayment Trigger if Jades dropped
  let debtMessage = '';
  let netJadesGained = jadesEarned;
  if (jadesEarned > 0) {
    const debtResult = db.repayDebtOnFarm(userId, jadesEarned);
    netJadesGained = jadesEarned - debtResult.repaid;
    if (netJadesGained > 0) {
      user.jades += netJadesGained;
    }
    if (debtResult.repaid > 0) {
      debtMessage = `\n\n🏦 **TỰ ĐỘNG TRẢ NỢ**: Đã chuyển **${debtResult.repaid} Jades** cho chủ nợ <@${debtResult.lenderId}>! ${debtResult.debtCleared ? '🎉 **BẠN ĐÃ HOÀN TRẢ HẾT NỢ!**' : `(Còn nợ: ${debtResult.debtRemaining.toLocaleString()} Jades)`}`;
    }
  }

  const jadesText = dropJadesChance
    ? `\n• 💎 **Ngọc Ánh Sao (Hiếm)**: \`+${jadesEarned} Jades\` ${netJadesGained < jadesEarned ? `*(Thực nhận: +${netJadesGained})*` : ''}`
    : '\n• 💎 **Ngọc Ánh Sao**: \`0 Jades\` *(Không rơi)*';

  const embed = new EmbedBuilder()
    .setTitle(`🌲 SĂN QUÁI THƯỜNG - KẾT QUẢ`)
    .setColor(dropJadesChance ? '#10b981' : '#3b82f6')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setDescription(`Tiêu diệt **${mob}**!\n\n🎁 **Phần Thưởng Thu Được (Max 2 Vật Phẩm)**:\n• 🌟 **EXP Thám Hiểm**: \`+${expEarned} EXP\`${jadesText}\n${itemsRewardText.map(i => `• ${i}`).join('\n')}${debtMessage}`)
    .setFooter({ text: 'Dùng /inventory để kiểm tra túi đồ và các trang bị mới nhặt được!' });

  await interaction.reply({ embeds: [embed] });
}

module.exports = {
  data: huntCommand,
  execute: executeHunt
};
