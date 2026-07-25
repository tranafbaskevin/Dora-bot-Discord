const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const infoCommand = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Tra cứu chi tiết chỉ số & Kỹ năng nhân vật');

async function executeInfo(interaction) {
  const userId = interaction.user.id;

  const mainEmbed = new EmbedBuilder()
    .setTitle('📖 THƯ VIỆN KỸ NĂNG NHÂN VẬT')
    .setColor('#9333ea')
    .setDescription('Vui lòng chọn danh mục bên dưới để tra cứu kỹ năng:')
    .addFields(
      { name: '🟢 Nhân vật đang sở hữu', value: 'Xem chi tiết kỹ năng các nhân vật bạn đã sở hữu.', inline: true },
      { name: '🔴 Nhân vật chưa sở hữu', value: 'Khám phá bộ kỹ năng của các nhân vật khác.', inline: true }
    );

  const rowButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('info_cat_owned')
      .setLabel('🟢 Nhân vật đang sở hữu')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('info_cat_unowned')
      .setLabel('🔴 Nhân vật chưa sở hữu')
      .setStyle(ButtonStyle.Secondary)
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
      return i.reply({ content: '❌ Bạn không phải là người gọi lệnh này!', ephemeral: true });
    }

    const userInv = db.getUserInventory(userId);
    const ownedCharIds = userInv.map(inv => inv.char_id);

    // 1. Handle Category Buttons Click
    if (i.customId === 'info_cat_owned' || i.customId === 'info_cat_unowned') {
      const isOwnedCategory = i.customId === 'info_cat_owned';
      const targetChars = charactersData.filter(c =>
        isOwnedCategory ? ownedCharIds.includes(c.id) : !ownedCharIds.includes(c.id)
      );

      if (targetChars.length === 0) {
        return i.reply({
          content: isOwnedCategory ? '⚠️ Bạn chưa sở hữu nhân vật nào!' : '🎉 Bạn đã sở hữu tất cả nhân vật!',
          ephemeral: true
        });
      }

      const selectMenuOptions = targetChars.map(char => ({
        label: `${char.name} (${char.element})`,
        description: `Vận mệnh: ${char.path} | ${char.rarity}★`,
        value: `info_char_${char.id}`,
        emoji: char.rarity === 5 ? '🌟' : '⭐'
      }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('info_select_char')
        .setPlaceholder(isOwnedCategory ? 'Chọn nhân vật đang sở hữu...' : 'Chọn nhân vật chưa sở hữu...')
        .addOptions(selectMenuOptions);

      const menuRow = new ActionRowBuilder().addComponents(selectMenu);

      const catEmbed = new EmbedBuilder()
        .setTitle(isOwnedCategory ? '🟢 DANH SÁCH NHÂN VẬT SỞ HỮU' : '🔴 DANH SÁCH NHÂN VẬT CHƯA SỞ HỮU')
        .setColor(isOwnedCategory ? '#10b981' : '#ef4444')
        .setDescription('Chọn nhân vật từ danh sách bên dưới để xem bộ kỹ năng chi tiết:');

      await i.update({
        embeds: [catEmbed],
        components: [menuRow, rowButtons]
      });
    }

    // 2. Handle Character Selection from Dropdown Menu
    else if (i.customId === 'info_select_char') {
      const selectedValue = i.values[0];
      const charId = selectedValue.replace('info_char_', '');
      const char = charactersData.find(c => c.id === charId);

      if (!char) return;

      const userCharRecord = userInv.find(inv => inv.char_id === charId);
      const ownershipStatus = userCharRecord
        ? `✅ Đã sở hữu (Tinh Hồn E${userCharRecord.eidolon})`
        : '❌ Chưa sở hữu (Có thể quay `/gacha`)';

      const detailEmbed = new EmbedBuilder()
        .setTitle(`${char.rarity === 5 ? '🌟🌟🌟🌟🌟' : '⭐⭐⭐⭐'} ${char.name.toUpperCase()} (${char.element})`)
        .setColor(char.color || '#3b82f6')
        .setDescription(`**Vận mệnh (Path)**: ${char.path} | **Trạng thái**: ${ownershipStatus}`)
        .addFields(
          {
            name: '📊 Chỉ số Cơ bản (Base Stats)',
            value: `❤️ **HP**: ${char.baseStats.hp} | ⚔️ **ATK**: ${char.baseStats.atk} | 🛡️ **DEF**: ${char.baseStats.def} | ⚡ **SPD**: ${char.baseStats.speed} | 🔋 **Max EP**: ${char.baseStats.maxEnergy}`
          },
          {
            name: `🗡️ Đánh Thường: ${char.skills.basic.name}`,
            value: `${char.skills.basic.description}\n*(Sát thương: x${char.skills.basic.multiplier} | Hồi +1 SP | Nạp +${char.skills.basic.energyGain} EP)*`
          },
          {
            name: `💥 Chiến Kỹ: ${char.skills.skill.name}`,
            value: `${char.skills.skill.description}\n*(Sát thương: x${char.skills.skill.multiplier} | Tiêu hao -1 SP | Nạp +${char.skills.skill.energyGain} EP)*`
          },
          {
            name: `🌟 Tuyệt Kỹ: ${char.skills.ultimate.name}`,
            value: `${char.skills.ultimate.description}\n*(Sát thương: x${char.skills.ultimate.multiplier} | Năng lượng tiêu hao: ${char.skills.ultimate.energyCost} EP)*`
          }
        )
        .setFooter({ text: 'Nhấn các nút bên dưới để chọn nhân vật khác!' });

      await i.update({
        embeds: [detailEmbed],
        components: [rowButtons]
      });
    }
  });
}

module.exports = {
  data: infoCommand,
  execute: executeInfo
};
