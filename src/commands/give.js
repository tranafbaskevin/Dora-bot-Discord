const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');

const giveCommand = new SlashCommandBuilder()
  .setName('give')
  .setDescription('Tặng Vũ Khí hoặc Thánh Di Vật cho người chơi khác theo Mã Keycode (Smart Order Parser)')
  .addStringOption(opt =>
    opt.setName('param1')
      .setDescription('Mã Keycode trang bị hoặc Mention Người nhận (@User)')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('param2')
      .setDescription('Mention Người nhận (@User) hoặc Mã Keycode trang bị')
      .setRequired(true)
  );

async function executeGive(interaction) {
  const senderId = interaction.user.id;
  const p1 = interaction.options.getString('param1') || '';
  const p2 = interaction.options.getString('param2') || '';

  // Smart Order Parser: Detect User vs Keycode in any position!
  let targetUser = null;
  let keycode = null;

  const rawTokens = [p1, p2];

  for (const token of rawTokens) {
    if (token.startsWith('<@') && token.endsWith('>')) {
      const cleanId = token.replace(/[<@!>]/g, '');
      targetUser = interaction.client.users.cache.get(cleanId) || { id: cleanId, username: 'Người chơi' };
    } else if (token.startsWith('#') || /^([AWaw]-\d+)$/i.test(token)) {
      keycode = token.toUpperCase().trim();
    }
  }

  if (!targetUser) {
    // Fallback: Check user mention option if passed
    targetUser = interaction.options.getUser('param1') || interaction.options.getUser('param2');
  }

  if (!targetUser || !keycode) {
    return interaction.reply({
      content: '❌ Vui lòng nhập đúng Mã Keycode (#A-xxx / #W-xxx) và Mention người nhận! Ví dụ: `/give #A-1082 @User` hoặc `/give @User #A-1082`',
      ephemeral: true
    });
  }

  if (targetUser.id === senderId) {
    return interaction.reply({ content: '⚠️ Bạn không thể tự tặng trang bị cho chính mình!', ephemeral: true });
  }

  // Execute Give
  const result = db.giveItemByKeycode(senderId, targetUser.id, keycode);

  if (!result.success) {
    return interaction.reply({ content: result.message, ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle('🎁 TẶNG TRANG BỊ THÀNH CÔNG!')
    .setColor('#10b981')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setDescription(`Người chơi **<@${senderId}>** đã tặng thành công **${result.itemName}** cho **<@${targetUser.id}>**!`)
    .setFooter({ text: 'Món đồ đã được chuyển trực tiếp vào Kho của người nhận ở trạng thái Tháo rời!' });

  await interaction.reply({ embeds: [embed] });
}

module.exports = {
  data: giveCommand,
  execute: executeGive
};
