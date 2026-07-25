const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');
const artifactsData = require('../data/artifacts.json');

const infoCommand = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Thư viện tra cứu Nhân vật, Thánh Di Vật và Vũ khí Nón Ánh Sáng');

async function executeInfo(interaction) {
  const userId = interaction.user.id;
  const userInv = db.getUserInventory(userId);

  const mainEmbed = new EmbedBuilder()
    .setTitle('📖 THƯ VIỆN TRA CỨU GAMEPLAY & CẨM NANG NEWBIE')
    .setColor('#a855f7')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setDescription('Chọn 1 trong 3 danh mục tra cứu bên dưới để xem thông tin chi tiết kỹ năng, di vật phù hợp và vũ khí Nón Ánh Sáng!')
    .setFooter({ text: 'Dùng các nút bấm bên dưới để chuyển đổi giữa Nhân vật, Di vật và Vũ khí!' });

  const rowButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('info_cat_char').setLabel('👤 Thư Viện Nhân Vật').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('info_cat_artifact').setLabel('🛡️ Thư Viện Di Vật & Gợi Ý').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('info_cat_weapon').setLabel('⚔️ Thư Viện Vũ Khí Nón Ánh Sáng').setStyle(ButtonStyle.Secondary)
  );

  const response = await interaction.reply({
    embeds: [mainEmbed],
    components: [rowButtons],
    fetchReply: true
  });

  const collector = response.createMessageComponentCollector({
    time: 300000
  });

  collector.on('collect', async i => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: '❌ Bạn không phải là người tra cứu!', ephemeral: true });
    }

    // 1. Characters Category
    if (i.customId === 'info_cat_char') {
      const ownedIds = userInv.map(inv => inv.char_id);
      const ownedChars = charactersData.filter(c => ownedIds.includes(c.id));
      const unownedChars = charactersData.filter(c => !ownedIds.includes(c.id));

      const charSelectOptions = charactersData.map(c => ({
        label: `${c.name} (${c.rarity}★ - ${c.element})`,
        description: `Vận mệnh: ${c.path} | Sát thương: ${c.element}`,
        value: `info_char_select_${c.id}`,
        emoji: c.rarity === 5 ? '🌟' : '⭐'
      }));

      const menu = new StringSelectMenuBuilder()
        .setCustomId('info_menu_char')
        .setPlaceholder('Chọn Nhân vật muốn đọc chi tiết Kỹ Năng...')
        .addOptions(charSelectOptions);

      const menuRow = new ActionRowBuilder().addComponents(menu);

      const charEmbed = new EmbedBuilder()
        .setTitle('👤 THƯ VIỆN NHÂN VẬT')
        .setColor('#3b82f6')
        .setDescription(`- Nhân vật đã sở hữu: **${ownedChars.length}** (${ownedChars.map(c => c.name).join(', ')})\n- Nhân vật chưa sở hữu: **${unownedChars.length}** (${unownedChars.map(c => c.name).join(', ')})\n\nChọn nhân vật bên dưới để đọc chi tiết Kỹ năng!`);

      await i.update({ embeds: [charEmbed], components: [menuRow, rowButtons] });
    }

    // Handle Character Detail Menu Selection
    else if (i.customId === 'info_menu_char') {
      const charId = i.values[0].replace('info_char_select_', '');
      const char = charactersData.find(c => c.id === charId);

      const detailEmbed = new EmbedBuilder()
        .setTitle(`🌟 ${char.name.toUpperCase()} (${char.element} - ${char.path})`)
        .setColor(char.color || '#f59e0b')
        .setThumbnail(char.icon || interaction.user.displayAvatarURL())
        .addFields(
          { name: '📊 Chỉ Số Cơ Bản (Base Stats)', value: `HP: **${char.baseStats.hp}** | ATK: **${char.baseStats.atk}** | DEF: **${char.baseStats.def}** | SPD: **${char.baseStats.speed}**`, inline: false },
          { name: '⚔️ Đánh Thường', value: `**${char.skills.basic.name}**: ${char.skills.basic.description}`, inline: false },
          { name: '💥 Chiến Kỹ', value: `**${char.skills.skill.name}**: ${char.skills.skill.description}`, inline: false },
          { name: '🌟 Tuyệt Kỹ (Ultimate)', value: `**${char.skills.ultimate.name}**: ${char.skills.ultimate.description}`, inline: false }
        );

      await i.update({ embeds: [detailEmbed], components: [rowButtons] });
    }

    // 2. Artifacts Category with Newbie Recommendations!
    else if (i.customId === 'info_cat_artifact') {
      const artLines = artifactsData.map((art, idx) => {
        const recs = art.recommendedChars.map(c => `\`[${c}]\``).join(', ');
        return `**${idx + 1}. ${art.name} (5★)**\n   • **Bộ 2 món**: ${art.twoPieceDescription}\n   • **Bộ 4 món**: ${art.fourPieceDescription}\n   💡 **Phù hợp nhất cho**: ${recs}`;
      }).join('\n\n');

      const artEmbed = new EmbedBuilder()
        .setTitle('🛡️ THƯ VIỆN THÁNH DI VẬT & GỢI Ý CHO NEWBIE')
        .setColor('#10b981')
        .setDescription(artLines)
        .setFooter({ text: 'Khiêu chiến Boss ở /battle để farm các bộ Di vật tương ứng!' });

      await i.update({ embeds: [artEmbed], components: [rowButtons] });
    }

    // 3. Weapons Category
    else if (i.customId === 'info_cat_weapon') {
      const wpnEmbed = new EmbedBuilder()
        .setTitle('⚔️ THƯ VIỆN VŨ KHÍ / NÓN ÁNH SÁNG')
        .setColor('#eab308')
        .setDescription('Danh sách các Nón Ánh Sáng mạnh nhất trong game:')
        .addFields(
          { name: '🌟 Nón Ánh Sáng 5★: In the Night (Trong Đêm Tối)', value: 'Tăng +18% CRIT Rate. Với mỗi 10 SPD vượt quá 100, tăng +6% Sát thương Đánh thường & Chiến kỹ.', inline: false },
          { name: '🌟 Nón Ánh Sáng 5★: Before Dawn (Trước Bình Minh)', value: 'Tăng +36% CRIT DMG & +18% Sát thương Chiến kỹ/Tuyệt kỹ cho nhân vật.', inline: false },
          { name: '⭐ Nón Ánh Sáng 4★: Only Silence Remains (Chỉ Còn Lại Chốn Lặng Yên)', value: 'Tăng +24% ATK. Khi có ít hơn 2 kẻ địch trên sân, tăng +12% CRIT Rate.', inline: false },
          { name: '⭐ Nón Ánh Sáng 4★: Day One of My New Life (Ngày Đầu Tiên)', value: 'Tăng +24% DEF. Giảm 8% Sát thương gánh chịu cho toàn bộ đồng đội.', inline: false }
        );

      await i.update({ embeds: [wpnEmbed], components: [rowButtons] });
    }
  });
}

module.exports = {
  data: infoCommand,
  execute: executeInfo
};
