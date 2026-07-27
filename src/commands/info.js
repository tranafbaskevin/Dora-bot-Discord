const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const charactersData = require('../data/characters.json');
const artifactsData = require('../data/artifacts.json');
const weaponsData = require('../data/weapons.json');

const infoCommand = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Thư viện tra cứu Nhân vật, Thánh Di Vật và Nón Ánh Sáng (Phân Trang OwO Style)');

function getCharAvatarAttachment(char) {
  if (!char || !char.icon) return { url: null, attachment: null };
  if (char.icon.startsWith('http')) return { url: char.icon, attachment: null };

  const localPath = path.join(__dirname, '../../', char.icon);
  if (fs.existsSync(localPath)) {
    const ext = path.extname(localPath).replace('.', '') || 'jpg';
    const filename = `info_avatar_${char.id}.${ext}`;
    const attachment = new AttachmentBuilder(localPath, { name: filename });
    return { url: `attachment://${filename}`, attachment };
  }
  return { url: null, attachment: null };
}

async function executeInfo(interaction) {
  const userId = interaction.user.id;
  const userInv = db.getUserInventory(userId);

  let currentCategory = 'main'; // 'main', 'char', 'artifact', 'weapon'
  let charPage = 1;
  const itemsPerPage = 5;

  const mainEmbed = new EmbedBuilder()
    .setTitle('📖 THƯ VIỆN TRA CỨU GAMEPLAY & CẨM NANG DORA-BOT')
    .setColor('#a855f7')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setDescription('Chọn 1 trong 3 danh mục tra cứu bên dưới để xem thông tin chi tiết kỹ năng, di vật phù hợp và vũ khí Nón Ánh Sáng!')
    .setFooter({ text: 'Dùng các nút bấm bên dưới để lật trang OwO Style giữa Nhân vật, Di vật và Vũ khí!' });

  const rowButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('info_cat_char').setLabel('👤 Thư Viện Nhân Vật').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('info_cat_artifact').setLabel('🛡️ Thư Viện Di Vật').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('info_cat_weapon').setLabel('⚔️ Thư Viện Vũ Khí').setStyle(ButtonStyle.Secondary)
  );

  const response = await interaction.reply({
    embeds: [mainEmbed],
    components: [rowButtons],
    fetchReply: true
  });

  const collector = response.createMessageComponentCollector({
    filter: i => i.message.id === response.id && i.user.id === userId,
    time: 300000
  });

  collector.on('collect', async i => {
    if (i.message.id !== response.id || i.user.id !== userId) return;

    await i.deferUpdate().catch(() => {});
    const customId = i.customId;

    // Category 1: Characters Library with OwO Pagination
    if (customId === 'info_cat_char' || customId === 'info_char_prev' || customId === 'info_char_next') {
      currentCategory = 'char';
      if (customId === 'info_char_prev') charPage = Math.max(1, charPage - 1);
      else if (customId === 'info_char_next') charPage++;
      else if (customId === 'info_cat_char') charPage = 1;

      const ownedIds = userInv.map(inv => inv.char_id);
      const totalPages = Math.ceil(charactersData.length / itemsPerPage) || 1;
      charPage = Math.min(Math.max(1, charPage), totalPages);

      const start = (charPage - 1) * itemsPerPage;
      const pageChars = charactersData.slice(start, start + itemsPerPage);

      const charListText = pageChars.map((c, idx) => {
        const isOwned = ownedIds.includes(c.id);
        const ownedBadge = isOwned ? '✅ [Đã sở hữu]' : '🔒 [Chưa sở hữu]';
        return `**${start + idx + 1}. ${c.name} (${c.rarity}★ - ${c.element})** ${ownedBadge}\n   • Vận mệnh: **${c.path}** | Đánh thường: \`${c.skills.basic.name}\` | Skill: \`${c.skills.skill.name}\``;
      }).join('\n\n');

      const charEmbed = new EmbedBuilder()
        .setTitle(`👤 THƯ VIỆN NHÂN VẬT (${charactersData.length} NHÂN VẬT)`)
        .setColor('#3b82f6')
        .setDescription(`${charListText}\n\n👉 *Chọn nhân vật bên dưới menu để đọc chi tiết Kỹ Năng & Chỉ Số!*`)
        .setFooter({ text: `Trang ${charPage} / ${totalPages} | Dùng ◀ ▶ để lật trang OwO Style` });

      const menuOptions = pageChars.map(c => ({
        label: `${c.name} (${c.rarity}★ - ${c.element})`,
        description: `Vận mệnh: ${c.path} | Sát thương: ${c.element}`,
        value: `info_char_select_${c.id}`,
        emoji: c.rarity === 5 ? '🌟' : '⭐'
      }));

      const charMenu = new StringSelectMenuBuilder()
        .setCustomId('info_menu_char')
        .setPlaceholder(`Chọn Nhân vật (Trang ${charPage}/${totalPages}) để xem Chi Tiết Kỹ Năng...`)
        .addOptions(menuOptions);

      const menuRow = new ActionRowBuilder().addComponents(charMenu);

      const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('info_char_prev').setLabel('◀ Trang Trước').setStyle(ButtonStyle.Primary).setDisabled(charPage <= 1),
        new ButtonBuilder().setCustomId('info_char_page').setLabel(`📌 Trang ${charPage} / ${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('info_char_next').setLabel('Trang Sau ▶').setStyle(ButtonStyle.Primary).setDisabled(charPage >= totalPages)
      );

      await i.editReply({ embeds: [charEmbed], components: [menuRow, navRow, rowButtons], files: [] }).catch(err => console.error('❌ Lỗi editReply info char:', err));
    }

    // Handle Character Detail Selection
    else if (customId === 'info_menu_char') {
      const charId = i.values[0].replace('info_char_select_', '');
      const char = charactersData.find(c => c.id === charId) || charactersData[0];
      const avatarInfo = getCharAvatarAttachment(char);

      const detailEmbed = new EmbedBuilder()
        .setTitle(`🌟 CHI TIẾT: ${char.name.toUpperCase()} (${char.rarity}★ - ${char.element})`)
        .setColor(char.color || '#f59e0b')
        .setDescription(`Vận mệnh: **${char.path}** | Thuộc tính sát thương: **${char.element}**`)
        .addFields(
          { name: '📊 Chỉ Số Cơ Bản (Base Stats)', value: `HP: **${char.baseStats.hp}** | ATK: **${char.baseStats.atk}** | DEF: **${char.baseStats.def}** | SPD: **${char.baseStats.speed}**`, inline: false },
          { name: '⚔️ Đánh Thường', value: `**${char.skills.basic.name}**: ${char.skills.basic.description}`, inline: false },
          { name: '💥 Chiến Kỹ', value: `**${char.skills.skill.name}**: ${char.skills.skill.description}`, inline: false },
          { name: '🌟 Tuyệt Kỹ (Ultimate)', value: `**${char.skills.ultimate.name}**: ${char.skills.ultimate.description}`, inline: false }
        )
        .setFooter({ text: 'Nhấn "👤 Thư Viện Nhân Vật" để quay lại danh sách!' });

      if (avatarInfo.url) detailEmbed.setThumbnail(avatarInfo.url);

      const payload = { embeds: [detailEmbed], components: [rowButtons] };
      if (avatarInfo.attachment) payload.files = [avatarInfo.attachment];

      await i.editReply(payload).catch(err => console.error('❌ Lỗi editReply info char detail:', err));
    }

    // Category 2: Artifacts Library
    else if (customId === 'info_cat_artifact') {
      currentCategory = 'artifact';

      const artLines = artifactsData.map((art, idx) => {
        const recs = art.recommendedChars.map(c => `\`[${c}]\``).join(', ');
        return `**${idx + 1}. ${art.name} (4★ / 5★)**\n   • **Bộ 2 món**: ${art.twoPieceDescription}\n   • **Bộ 4 món**: ${art.fourPieceDescription}\n   💡 **Gợi ý cho**: ${recs}`;
      }).join('\n\n');

      const artEmbed = new EmbedBuilder()
        .setTitle('🛡️ THƯ VIỆN THÁNH DI VẬT & GỢI Ý ĐỘI HÌNH')
        .setColor('#10b981')
        .setDescription(artLines)
        .setFooter({ text: 'Khiêu chiến Boss ở /battle hoặc farm quái ở /hunt để nhặt Di vật!' });

      await i.editReply({ embeds: [artEmbed], components: [rowButtons], files: [] });
    }

    // Category 3: Weapons Library
    else if (customId === 'info_cat_weapon') {
      currentCategory = 'weapon';

      const wpn5 = weaponsData.filter(w => w.rarity === 5);
      const wpn4 = weaponsData.filter(w => w.rarity === 4);

      const fields5 = wpn5.slice(0, 4).map(w => ({
        name: `🌟 ${w.name} [Vận Mệnh: ${w.path}]`,
        value: `📜 **Nội Tại**: ${w.passiveDescription}`,
        inline: false
      }));

      const fields4 = wpn4.slice(0, 3).map(w => ({
        name: `⭐ ${w.name} [Vận Mệnh: ${w.path}]`,
        value: `📜 **Nội Tại**: ${w.passiveDescription}`,
        inline: false
      }));

      const wpnEmbed = new EmbedBuilder()
        .setTitle(`⚔️ THƯ VIỆN NÓN ÁNH SÁNG (${weaponsData.length} VŨ KHÍ)`)
        .setColor('#eab308')
        .setDescription(`Tổng hợp **${weaponsData.length} Nón Ánh Sáng** thuộc 7 Vận Mệnh. Mọi Vũ Khí khi nhận được đều có **Dòng Nội Tại Đặc Biệt** + **4 Dòng Buff Ngẫu Nhiên**!`)
        .addFields(...fields5, ...fields4)
        .setFooter({ text: 'Dùng /gacha Banner Vũ Khí để nhận các loại Nón Ánh Sáng!' });

      await i.editReply({ embeds: [wpnEmbed], components: [rowButtons], files: [] });
    }
  });
}

module.exports = {
  data: infoCommand,
  execute: executeInfo
};
