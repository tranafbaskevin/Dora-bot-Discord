const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database/db');

const borrowCommand = new SlashCommandBuilder()
  .setName('borrow')
  .setDescription('Vay mượn Ngọc Ánh Sao Jades từ người chơi khác (Tự động trích Jades farm được để trả nợ)')
  .addStringOption(opt =>
    opt.setName('param1')
      .setDescription('Mention Người cho vay (@User) hoặc Số lượng Jades muốn mượn')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('param2')
      .setDescription('Số lượng Jades muốn mượn hoặc Mention Người cho vay (@User)')
      .setRequired(true)
  );

async function executeBorrow(interaction) {
  const borrowerId = interaction.user.id;
  const p1 = interaction.options.getString('param1') || '';
  const p2 = interaction.options.getString('param2') || '';

  // Smart Order Parser: Detect User vs Amount in any position!
  let lenderUser = null;
  let amount = 0;

  const rawTokens = [p1, p2];

  for (const token of rawTokens) {
    if (token.startsWith('<@') && token.endsWith('>')) {
      const cleanId = token.replace(/[<@!>]/g, '');
      lenderUser = interaction.client.users.cache.get(cleanId) || { id: cleanId, username: 'Người cho vay' };
    } else if (!isNaN(parseInt(token, 10))) {
      amount = parseInt(token, 10);
    }
  }

  if (!lenderUser || amount <= 0) {
    return interaction.reply({
      content: '❌ Vui lòng nhập đúng Mention người cho vay và Số Jades muốn mượn! Ví dụ: `/borrow @User 5000` hoặc `/borrow 5000 @User`',
      ephemeral: true
    });
  }

  if (lenderUser.id === borrowerId) {
    return interaction.reply({ content: '⚠️ Bạn không thể tự vay Jades của chính mình!', ephemeral: true });
  }

  const checkResult = db.createBorrowRequest(borrowerId, lenderUser.id, amount);

  if (!checkResult.success) {
    return interaction.reply({ content: checkResult.message, ephemeral: true });
  }

  const requestEmbed = new EmbedBuilder()
    .setTitle('🏦 YÊU CẦU VAY MƯỢN NGỌC ÁNH SAO (JADES)')
    .setColor('#f59e0b')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setDescription(`Người chơi **<@${borrowerId}>** muốn vay **${amount.toLocaleString()} Jades** từ **<@${lenderUser.id}>**!\n\n📌 **Cơ Chế Trả Nợ Tự Động**:\nToàn bộ Ngọc Ánh Sao mà **<@${borrowerId}>** farm được từ \`/battle\`, \`/hunt\`, \`/lahoan\`... sẽ **tự động chuyển thẳng cho <@${lenderUser.id}>** cho tới khi hoàn trả hết nợ!`)
    .setFooter({ text: 'Người cho vay vui lòng nhấn nút bên dưới để phản hồi!' });

  const confirmButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`btn_accept_borrow_${borrowerId}_${lenderUser.id}_${amount}`).setLabel('✅ Đồng Ý Cho Vay').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`btn_reject_borrow_${borrowerId}_${lenderUser.id}`).setLabel('❌ Từ Chối').setStyle(ButtonStyle.Danger)
  );

  const responseMsg = await interaction.reply({
    content: `📢 Thông báo tới **<@${lenderUser.id}>**: Bạn nhận được một yêu cầu vay Jades!`,
    embeds: [requestEmbed],
    components: [confirmButtons],
    fetchReply: true
  });

  const collector = responseMsg.createMessageComponentCollector({
    filter: i => i.message.id === responseMsg.id && i.user.id === lenderUser.id,
    time: 300000
  });

  collector.on('collect', async i => {
    if (i.user.id !== lenderUser.id) return;

    await i.deferUpdate().catch(() => {});

    if (i.customId.startsWith('btn_accept_borrow_')) {
      const acceptResult = db.acceptBorrowRequest(borrowerId, lenderUser.id, amount);

      if (!acceptResult.success) {
        return i.followUp({ content: acceptResult.message, ephemeral: true });
      }

      const successEmbed = new EmbedBuilder()
        .setTitle('🎉 GIAO DỊCH VAY MƯỢN THÀNH CÔNG!')
        .setColor('#10b981')
        .setDescription(`- Chủ nợ **<@${lenderUser.id}>** đã đồng ý cho **<@${borrowerId}>** vay **${amount.toLocaleString()} Jades**!\n- Số Jades đã được chuyển ngay lập tức.\n\n🔄 **Trạng Thái Nợ**: **<@${borrowerId}>** hiện nợ **${amount.toLocaleString()} Jades** (Toàn bộ Jades cày được sẽ tự động hoàn trả dần cho <@${lenderUser.id}>).`);

      await i.editReply({ content: '✅ Giao dịch hoàn tất!', embeds: [successEmbed], components: [] });
    } else if (i.customId.startsWith('btn_reject_borrow_')) {
      const rejectEmbed = new EmbedBuilder()
        .setTitle('❌ THỎA THUẬN VAY MƯỢN BỊ TỪ CHỐI')
        .setColor('#ef4444')
        .setDescription(`Người chơi **<@${lenderUser.id}>** đã từ chối yêu cầu vay mượn của **<@${borrowerId}>**.`);

      await i.editReply({ content: '❌ Yêu cầu bị từ chối.', embeds: [rejectEmbed], components: [] });
    }
  });
}

module.exports = {
  data: borrowCommand,
  execute: executeBorrow
};
