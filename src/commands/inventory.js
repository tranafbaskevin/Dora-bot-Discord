const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const inventoryCommand = new SlashCommandBuilder()
  .setName('inventory')
  .setDescription('Xem và quản lý túi đồ, nguyên liệu, vũ khí và thánh di vật theo Mã Keycode');

async function executeInventory(interaction) {
  const userId = interaction.user.id;
  const user = db.getUser(userId);
  const inventory = db.getUserInventory(userId);
  const userWeapons = db.getUserWeapons(userId);
  const userArts = db.getUserArtifacts(userId);

  let currentView = 'main'; // 'main', 'weapons', 'artifacts'
  let currentPage = 1;
  const itemsPerPage = 5;

  function buildMainEmbed() {
    const refreshedUser = db.getUser(userId);
    const refreshedWpns = db.getUserWeapons(userId);
    const refreshedArts = db.getUserArtifacts(userId);

    return new EmbedBuilder()
      .setTitle(`🎒 TÚI ĐỒ VẬT PHẨM & TRANG BỊ - ${interaction.user.username}`)
      .setColor('#f59e0b')
      .setThumbnail(interaction.user.displayAvatarURL())
      .setDescription('Nhấn các nút bên dưới để xem **Nón Ánh Sáng** hoặc **Thánh Di Vật (Phân Trang OwO Style)**!')
      .addFields(
        { name: '💎 Nguyên Thạch (Stellar Jade)', value: `**${refreshedUser.jades.toLocaleString()}**`, inline: true },
        { name: '⚔️ Nón Ánh Sáng Kho', value: `**${refreshedWpns.length}** món (S1 - S5)`, inline: true },
        { name: '🔮 Di Vật Trong Kho', value: `**${refreshedArts.length}** món`, inline: true },
        {
          name: '📦 Kho Vật Liệu Nâng Cấp',
          value: `📘 **Sách EXP**: ${refreshedUser.materials?.char_exp_book || 0} cuốn\n⚔️ **Tinh Thể Vũ Khí**: ${refreshedUser.materials?.weapon_exp_crystal || 0} tinh thể\n🔮 **Bụi Di Vật**: ${refreshedUser.materials?.artifact_dust || 0} túi\n📜 **Mầm Kỹ Năng**: ${refreshedUser.materials?.trace_material || 0} mầm`,
          inline: false
        }
      )
      .setFooter({ text: 'Nhấn "Phân Tách Rác 3★" để đổi lấy Nguyên Thạch (20 Jades / món)!' });
  }

  function buildWeaponsEmbed(page = 1) {
    const refreshedWpns = db.getUserWeapons(userId);
    const totalPages = Math.ceil(refreshedWpns.length / itemsPerPage) || 1;
    const p = Math.min(Math.max(1, page), totalPages);

    const start = (p - 1) * itemsPerPage;
    const pageItems = refreshedWpns.slice(start, start + itemsPerPage);

    const wpnLines = pageItems.map((wpn, idx) => {
      const sLevel = wpn.superimpose || 1;
      const starStr = '⭐'.repeat(wpn.rarity || 4);
      const equippedMsg = wpn.equipped_char_id ? ` (👤 Đang đeo: **${wpn.equipped_char_id.toUpperCase()}**)` : ' (⚪ Chưa ai dùng)';
      const subs = (wpn.subStats || []).map(s => `${s.name} +${s.value}`).join(', ');
      return `**${start + idx + 1}. 🆔 [\`${wpn.keycode || '#W-NONE'}\`] ${starStr} ${wpn.name}**\n   • Cấp độ: **Lv.${wpn.level || 1}/80** | Tích Chồng: **S${sLevel}/S5**${equippedMsg}\n   📜 **Nội Tại**: ${wpn.passiveDescription || 'Tăng sát thương bổ trợ.'}\n   🎲 **Dòng Buff Ngẫu Nhiên**: \`${subs || 'ATK% +5.2%, CRIT Rate% +3.8%'}\``;
    }).join('\n\n');

    return {
      embed: new EmbedBuilder()
        .setTitle(`⚔️ KHO NÓN ÁNH SÁNG SỞ HỮU (${refreshedWpns.length} MÓN)`)
        .setColor('#eab308')
        .setDescription(wpnLines || '⚠️ Chưa có Nón Ánh Sáng nào trong kho!')
        .setFooter({ text: `Trang ${p} / ${totalPages} | Dùng nút ◀ ▶ bên dưới để chuyển trang OwO Style` }),
      totalPages,
      page: p
    };
  }

  function buildArtifactsEmbed(page = 1) {
    const refreshedArts = db.getUserArtifacts(userId);
    const totalPages = Math.ceil(refreshedArts.length / itemsPerPage) || 1;
    const p = Math.min(Math.max(1, page), totalPages);

    const start = (p - 1) * itemsPerPage;
    const pageItems = refreshedArts.slice(start, start + itemsPerPage);

    const slotsMap = { Head: '🎩 [Head]', Hands: '🥊 [Hands]', Body: '🥼 [Body]', Feet: '👟 [Feet]' };

    const artLines = pageItems.map((art, idx) => {
      const slotLabel = slotsMap[art.slot] || `[${art.slot || 'Head'}]`;
      const equippedMsg = art.equipped_char_id ? `👤 Đang trang bị cho **${art.equipped_char_id.toUpperCase()}**` : '⚪ Chưa ai trang bị';
      const subStr = (art.subStats || []).map(s => `${s.name}: +${parseFloat(s.value).toFixed(1)}`).join(' | ');

      return `**${start + idx + 1}. 🆔 [\`${art.keycode || '#A-NONE'}\`] ${slotLabel} ${art.setName} (${art.rarity || 5}★) (+${art.level}/15)**\n   • Main: **${art.mainStat}** (+${art.mainValue.toFixed(1)})\n   • Dòng phụ: \`${subStr || 'ATK% +3.5'}\` \n   • Trạng thái: ${equippedMsg}`;
    }).join('\n\n');

    return {
      embed: new EmbedBuilder()
        .setTitle(`🔮 KHO THÁNH DI VẬT SỞ HỮU (${refreshedArts.length} MÓN)`)
        .setColor('#8b5cf6')
        .setDescription(artLines || '⚠️ Chưa có Thánh Di Vật nào trong kho! Đánh Boss ở `/battle` để nhặt!')
        .setFooter({ text: `Trang ${p} / ${totalPages} | Dùng nút ◀ ▶ bên dưới để chuyển trang OwO Style` }),
      totalPages,
      page: p
    };
  }

  function getActionRows(view, page, totalPages) {
    const row1Buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('inv_view_weapons').setLabel('⚔️ Kho Vũ Khí').setStyle(view === 'weapons' ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('inv_view_artifacts').setLabel('🔮 Kho Di Vật').setStyle(view === 'artifacts' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('inv_view_main').setLabel('🏠 Trang Chủ Kho').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('inv_recycle_trash').setLabel('♻️ Phân Tách Rác 3★').setStyle(ButtonStyle.Danger)
    );

    if (view === 'main') {
      return [row1Buttons];
    }

    const navRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('inv_prev_page').setLabel('◀ Trang Trước').setStyle(ButtonStyle.Primary).setDisabled(page <= 1),
      new ButtonBuilder().setCustomId('inv_page_indicator').setLabel(`📌 Trang ${page} / ${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('inv_next_page').setLabel('Trang Sau ▶').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages)
    );

    return [row1Buttons, navRow];
  }

  const initialPayload = {
    embeds: [buildMainEmbed()],
    components: getActionRows('main', 1, 1),
    fetchReply: true
  };

  const response = await interaction.reply(initialPayload);

  const collector = response.createMessageComponentCollector({
    filter: i => i.message.id === response.id && i.user.id === userId,
    time: 300000
  });

  collector.on('collect', async i => {
    if (i.message.id !== response.id || i.user.id !== userId) return;

    await i.deferUpdate().catch(() => {});

    if (i.customId === 'inv_recycle_trash') {
      const result = db.recycleTrashItems(userId);
      if (!result.success) {
        return i.followUp({ content: '⚠️ Bạn không có Nón Ánh Sáng 3★ rác nào để phân tách!', ephemeral: true });
      }
      await i.editReply({ embeds: [buildMainEmbed()], components: getActionRows('main', 1, 1) });
      await i.followUp({ content: `🎉 **Đã phân tách ${result.count} món rác**! Nhận được **+${result.jadesGained} Nguyên Thạch**!`, ephemeral: true });
      return;
    }

    if (i.customId === 'inv_view_main') {
      currentView = 'main';
      currentPage = 1;
      await i.editReply({ embeds: [buildMainEmbed()], components: getActionRows('main', 1, 1) });
      return;
    }

    if (i.customId === 'inv_view_weapons') {
      currentView = 'weapons';
      currentPage = 1;
      const data = buildWeaponsEmbed(currentPage);
      await i.editReply({ embeds: [data.embed], components: getActionRows('weapons', data.page, data.totalPages) });
      return;
    }

    if (i.customId === 'inv_view_artifacts') {
      currentView = 'artifacts';
      currentPage = 1;
      const data = buildArtifactsEmbed(currentPage);
      await i.editReply({ embeds: [data.embed], components: getActionRows('artifacts', data.page, data.totalPages) });
      return;
    }

    if (i.customId === 'inv_prev_page') {
      currentPage = Math.max(1, currentPage - 1);
    } else if (i.customId === 'inv_next_page') {
      currentPage++;
    }

    if (currentView === 'weapons') {
      const data = buildWeaponsEmbed(currentPage);
      currentPage = data.page;
      await i.editReply({ embeds: [data.embed], components: getActionRows('weapons', data.page, data.totalPages) });
    } else if (currentView === 'artifacts') {
      const data = buildArtifactsEmbed(currentPage);
      currentPage = data.page;
      await i.editReply({ embeds: [data.embed], components: getActionRows('artifacts', data.page, data.totalPages) });
    }
  });
}

module.exports = {
  data: inventoryCommand,
  execute: executeInventory
};
