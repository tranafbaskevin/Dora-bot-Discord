const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const inventoryCommand = new SlashCommandBuilder()
  .setName('inventory')
  .setDescription('Xem và quản lý túi đồ, nguyên liệu, vũ khí và thánh di vật');

async function executeInventory(interaction) {
  const userId = interaction.user.id;
  const user = db.getUser(userId);
  const inventory = db.getUserInventory(userId);

  const rawDb = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../database.json'), 'utf8'));
  const userArts = (rawDb.artifacts && rawDb.artifacts[userId]) || [];

  const mainEmbed = new EmbedBuilder()
    .setTitle(`🎒 TÚI ĐỒ VẬT PHẨM & TRANG BỊ - ${interaction.user.username}`)
    .setColor('#f59e0b')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setDescription('Nhấn vào các nút bên dưới để xem chi tiết thông tin **Nón Ánh Sáng (Vũ Khí)** hoặc **Thánh Di Vật (Artifacts)** có sẵn!')
    .addFields(
      { name: '💎 Nguyên Thạch (Stellar Jade)', value: `**${user.jades.toLocaleString()}**`, inline: true },
      { name: '🗑️ Nón Ánh Sáng 3★ Rác', value: `**${user.trash_items || 0}** món`, inline: true },
      { name: '🔮 Di Vật Trong Kho', value: `**${user.artifacts ? user.artifacts.length : userArts.length}** món`, inline: true },
      {
        name: '📦 Kho Vật Liệu Nâng Cấp',
        value: `📘 **Sách EXP**: ${user.materials?.char_exp_book || 0} cuốn\n⚔️ **Tinh Thể Vũ Khí**: ${user.materials?.weapon_exp_crystal || 0} tinh thể\n🔮 **Bụi Di Vật**: ${user.materials?.artifact_dust || 0} túi\n📜 **Mầm Kỹ Năng**: ${user.materials?.trace_material || 0} mầm`,
        inline: false
      }
    )
    .setFooter({ text: 'Nhấn "Phân Tách Rác 3★" để đổi lấy Nguyên Thạch (20 Jades / món)!' });

  const buttonsRow1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('inv_char_0').setLabel(`Slot 1: ${inventory[0] ? inventory[0].char_id : '1'}`).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('inv_char_1').setLabel(`Slot 2: ${inventory[1] ? inventory[1].char_id : '2'}`).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('inv_char_2').setLabel(`Slot 3: ${inventory[2] ? inventory[2].char_id : '3'}`).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('inv_char_3').setLabel(`Slot 4: ${inventory[3] ? inventory[3].char_id : '4'}`).setStyle(ButtonStyle.Primary)
  );

  const buttonsRow2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('inv_recycle_trash').setLabel('♻️ Phân Tách Rác 3★ (+20 Jades/món)').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('inv_view_artifacts').setLabel('🔮 Xem Kho Di Vật & Chỉ Số Dòng').setStyle(ButtonStyle.Secondary)
  );

  const response = await interaction.reply({
    embeds: [mainEmbed],
    components: [buttonsRow1, buttonsRow2],
    fetchReply: true
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 300000
  });

  collector.on('collect', async i => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: '❌ Bạn không phải là người sở hữu túi đồ này!', ephemeral: true });
    }

    if (i.customId === 'inv_recycle_trash') {
      const result = db.recycleTrashItems(userId);
      if (!result.success) {
        return i.reply({ content: '⚠️ Bạn không có Nón Ánh Sáng 3★ rác nào để phân tách!', ephemeral: true });
      }

      const updatedUser = db.getUser(userId);
      mainEmbed.spliceFields(0, 1, { name: '💎 Nguyên Thạch (Stellar Jade)', value: `**${updatedUser.jades.toLocaleString()}**`, inline: true });
      mainEmbed.spliceFields(1, 1, { name: '🗑️ Nón Ánh Sáng 3★ Rác', value: `**0** món`, inline: true });

      await i.update({ embeds: [mainEmbed], components: [buttonsRow1, buttonsRow2] });
      await i.followUp({ content: `🎉 **Đã phân tách ${result.count} món rác**! Nhận được **+${result.jadesGained} Nguyên Thạch**!`, ephemeral: true });
    } else if (i.customId === 'inv_view_artifacts') {
      const currentArts = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../database.json'), 'utf8')).artifacts[userId] || [];

      if (currentArts.length === 0) {
        return i.reply({ content: '⚠️ Kho Di Vật của bạn đang trống! Hãy đánh Boss ở `/battle` để nhặt Di vật 5★!', ephemeral: true });
      }

      const artLines = currentArts.map((art, idx) => {
        const subStr = art.subStats.map(s => `${s.name}: +${s.value.toFixed(1)}`).join(' | ');
        return `**${idx + 1}. ${art.setName} (+${art.level}/15)**\n   • Main: **${art.mainStat}** (+${art.mainValue.toFixed(1)})\n   • Dòng phụ: ${subStr}`;
      }).join('\n\n');

      const artEmbed = new EmbedBuilder()
        .setTitle(`🔮 KHO THÁNH DI VẬT SỞ HỮU (${currentArts.length} MÓN)`)
        .setColor('#8b5cf6')
        .setDescription(artLines)
        .setFooter({ text: 'Dùng /upgrade -> 🔮 Cường Hóa Di Vật để RNG Roll dòng phụ!' });

      await i.update({ embeds: [artEmbed], components: [buttonsRow1, buttonsRow2] });
    } else if (i.customId.startsWith('inv_char_')) {
      const idx = parseInt(i.customId.replace('inv_char_', ''), 10);
      const item = inventory[idx];
      if (!item) {
        return i.reply({ content: '⚠️ Không tìm thấy thông tin nhân vật ở slot này!', ephemeral: true });
      }

      const char = charactersData.find(c => c.id === item.char_id);
      const charLvl = item.level || 1;
      const wpnLvl = item.weapon_level || 1;

      const charEmbed = new EmbedBuilder()
        .setTitle(`🛡️ THÔNG TIN TRANG BỊ - ${char.name.toUpperCase()}`)
        .setColor(char.color || '#3b82f6')
        .setThumbnail(char.icon || interaction.user.displayAvatarURL())
        .addFields(
          { name: '👤 Cấp Nhân Vật', value: `**Lv.${charLvl} / 80**`, inline: true },
          { name: '⚔️ Nón Ánh Sáng (Vũ Khí)', value: `**${item.light_cone || 'Tiêu Chuẩn'}** (Lv.${wpnLvl}/80)`, inline: true },
          { name: '🔮 Bộ Di Vật', value: `**${item.artifact_set || 'Bộ Tiêu Chuẩn'}**`, inline: true },
          { name: '📜 Cấp Kỹ Năng', value: `Đánh thường: Lv.${item.basic_lvl || 1} | Chiến kỹ: Lv.${item.skill_lvl || 1} | Tuyệt kỹ: Lv.${item.ult_lvl || 1}`, inline: false },
          {
            name: '📊 Chỉ Số Thực Tế (Scaled Stats)',
            value: `• **HP**: ${char.baseStats.hp + (charLvl - 1) * 35}\n• **ATK**: ${char.baseStats.atk + (charLvl - 1) * 15 + (wpnLvl - 1) * 12}\n• **DEF**: ${char.baseStats.def + (charLvl - 1) * 10}\n• **Tốc độ (SPD)**: ${char.baseStats.speed}`,
            inline: false
          }
        );

      await i.update({ embeds: [charEmbed], components: [buttonsRow1, buttonsRow2] });
    }
  });
}

module.exports = {
  data: inventoryCommand,
  execute: executeInventory
};
