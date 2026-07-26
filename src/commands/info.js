const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const charactersData = require('../data/characters.json');
const artifactsData = require('../data/artifacts.json');
const weaponsData = require('../data/weapons.json');

const infoCommand = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Thư viện tra cứu Nhân vật, Thánh Di Vật và Vũ khí Nón Ánh Sáng vĩnh cửu');

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

  // STRICT MESSAGE-SPECIFIC COLLECTOR (PER-USER & PER-MESSAGE ISOLATION)
  const collector = response.createMessageComponentCollector({
    filter: i => i.message.id === response.id && i.user.id === userId,
    time: 300000
  });

  collector.on('collect', async i => {
    if (i.message.id !== response.id || i.user.id !== userId) return;

    const customId = i.customId;

    // 1. Characters Category
    if (customId === 'info_cat_char') {
      await i.deferUpdate().catch(() => {});

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

      await i.editReply({ embeds: [charEmbed], components: [menuRow, rowButtons] });
    }

    // Handle Character Detail Menu Selection
    else if (customId === 'info_menu_char') {
      await i.deferUpdate().catch(() => {});

      const charId = i.values[0].replace('info_char_select_', '');
      const char = charactersData.find(c => c.id === charId);
      const avatarInfo = getCharAvatarAttachment(char);

      const detailEmbed = new EmbedBuilder()
        .setTitle(`🌟 ${char.name.toUpperCase()} (${char.element} - ${char.path})`)
        .setColor(char.color || '#f59e0b')
        .addFields(
          { name: '📊 Chỉ Số Cơ Bản (Base Stats)', value: `HP: **${char.baseStats.hp}** | ATK: **${char.baseStats.atk}** | DEF: **${char.baseStats.def}** | SPD: **${char.baseStats.speed}**`, inline: false },
          { name: '⚔️ Đánh Thường', value: `**${char.skills.basic.name}**: ${char.skills.basic.description}`, inline: false },
          { name: '💥 Chiến Kỹ', value: `**${char.skills.skill.name}**: ${char.skills.skill.description}`, inline: false },
          { name: '🌟 Tuyệt Kỹ (Ultimate)', value: `**${char.skills.ultimate.name}**: ${char.skills.ultimate.description}`, inline: false }
        );

      if (avatarInfo.url) detailEmbed.setThumbnail(avatarInfo.url);

      const payload = { embeds: [detailEmbed], components: [rowButtons] };
      if (avatarInfo.attachment) payload.files = [avatarInfo.attachment];

      await i.editReply(payload).catch(err => console.error('❌ Lỗi editReply info char detail:', err));
    }

    // 2. Artifacts Category
    else if (customId === 'info_cat_artifact') {
      await i.deferUpdate().catch(() => {});

      const artLines = artifactsData.map((art, idx) => {
        const recs = art.recommendedChars.map(c => `\`[${c}]\``).join(', ');
        return `**${idx + 1}. ${art.name} (4★ / 5★)**\n   • **Bộ 2 món**: ${art.twoPieceDescription}\n   • **Bộ 4 món**: ${art.fourPieceDescription}\n   💡 **Phù hợp nhất cho**: ${recs}`;
      }).join('\n\n');

      const artEmbed = new EmbedBuilder()
        .setTitle('🛡️ THƯ VIỆN THÁNH DI VẬT (4★ & 5★) & GỢI Ý CHO NEWBIE')
        .setColor('#10b981')
        .setDescription(artLines)
        .setFooter({ text: 'Khiêu chiến Boss ở /battle để farm các bộ Di vật tương ứng!' });

      await i.editReply({ embeds: [artEmbed], components: [rowButtons] });
    }

    // 3. Weapons Category (36+ WEAPONS DATABASE WITH PASSIVE & RANDOM SUBSTATS)
    else if (customId === 'info_cat_weapon') {
      await i.deferUpdate().catch(() => {});

      const wpn5 = weaponsData.filter(w => w.rarity === 5);
      const wpn4 = weaponsData.filter(w => w.rarity === 4);

      const fields5 = wpn5.slice(0, 5).map(w => ({
        name: `🌟 ${w.name} [Vận Mệnh: ${w.path}]`,
        value: `📜 **Dòng Nội Tại**: ${w.passiveDescription}\n🎲 **4 Dòng Buff Ngẫu Nhiên**: \`ATK% +6.5%, CRIT Rate% +4.2%, SPD +4, CRIT DMG% +8.5%\``,
        inline: false
      }));

      const fields4 = wpn4.slice(0, 4).map(w => ({
        name: `⭐ ${w.name} [Vận Mệnh: ${w.path}]`,
        value: `📜 **Dòng Nội Tại**: ${w.passiveDescription}\n🎲 **3 Dòng Buff Ngẫu Nhiên**: \`ATK% +4.5%, DEF% +5.2%, SPD +3\``,
        inline: false
      }));

      const wpnEmbed = new EmbedBuilder()
        .setTitle(`⚔️ THƯ VIỆN NÓN ÁNH SÁNG VĨNH CỬU (36+ VŨ KHÍ)`)
        .setColor('#eab308')
        .setDescription(`Tổng hợp **${weaponsData.length} Nón Ánh Sáng** thuộc 7 Vận Mệnh. Mọi Vũ Khí khi nhận được đều có **Dòng Nội Tại Đặc Biệt** cố định + **4 Dòng Buff Chỉ Số % Ngẫu Nhiên 100%**!`)
        .addFields(...fields5, ...fields4)
        .setFooter({ text: 'Dùng /gacha Banner Vũ Khí Vĩnh Cửu để quay nhận các loại Nón Ánh Sáng!' });

      await i.editReply({ embeds: [wpnEmbed], components: [rowButtons] });
    }
  });
}

module.exports = {
  data: infoCommand,
  execute: executeInfo
};
