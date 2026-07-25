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
  const userWeapons = db.getUserWeapons(userId);

  const rawDb = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../database.json'), 'utf8'));
  const userArts = (rawDb.artifacts && rawDb.artifacts[userId]) || [];

  const mainEmbed = new EmbedBuilder()
    .setTitle(`🎒 TÚI ĐỒ VẬT PHẨM & TRANG BỊ - ${interaction.user.username}`)
    .setColor('#f59e0b')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setDescription('Nhấn vào các nút bên dưới để xem chi tiết **Nón Ánh Sáng (Vũ Khí S1-S5)** hoặc **Thánh Di Vật (Artifacts)** có sẵn!')
    .addFields(
      { name: '💎 Nguyên Thạch (Stellar Jade)', value: `**${user.jades.toLocaleString()}**`, inline: true },
      { name: '⚔️ Nón Ánh Sáng Sở Hữu', value: `**${userWeapons.length}** món (S1 - S5)`, inline: true },
      { name: '🔮 Di Vật Trong Kho', value: `**${userArts.length}** món`, inline: true },
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
    new ButtonBuilder().setCustomId('inv_view_weapons').setLabel('⚔️ Xem Kho Vũ Khí (Nón S1-S5)').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('inv_view_artifacts').setLabel('🔮 Xem Kho Di Vật & Chỉ Số Dòng').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('inv_recycle_trash').setLabel('♻️ Phân Tách Rác 3★').setStyle(ButtonStyle.Danger)
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

    // 1. Recycle Trash Items
    if (i.customId === 'inv_recycle_trash') {
      const result = db.recycleTrashItems(userId);
      if (!result.success) {
        return i.reply({ content: '⚠️ Bạn không có Nón Ánh Sáng 3★ rác nào để phân tách!', ephemeral: true });
      }

      const updatedUser = db.getUser(userId);
      mainEmbed.spliceFields(0, 1, { name: '💎 Nguyên Thạch (Stellar Jade)', value: `**${updatedUser.jades.toLocaleString()}**`, inline: true });

      await i.update({ embeds: [mainEmbed], components: [buttonsRow1, buttonsRow2] });
      await i.followUp({ content: `🎉 **Đã phân tách ${result.count} món rác**! Nhận được **+${result.jadesGained} Nguyên Thạch**!`, ephemeral: true });
    }

    // 2. View Weapon Inventory (Light Cones S1-S5)
    else if (i.customId === 'inv_view_weapons') {
      const currentWeapons = db.getUserWeapons(userId);

      if (currentWeapons.length === 0) {
        return i.reply({ content: '⚠️ Kho Vũ Khí của bạn đang trống! Hãy quay Gacha ở `/gacha` để nhận Nón Ánh Sáng 5★!', ephemeral: true });
      }

      const wpnLines = currentWeapons.map((wpn, idx) => {
        const sLevel = wpn.superimpose || 1;
        const starStr = '⭐'.repeat(wpn.rarity || 4);
        const equippedMsg = wpn.char_id ? ` (Đang trang bị cho **${wpn.char_id.toUpperCase()}**)` : '';
        return `**${idx + 1}. ${starStr} ${wpn.name}**\n   • Cấp độ: **Lv.${wpn.level || 1} / 80** | Cung Mệnh Tích Chồng: **Tích Chồng S${sLevel} / S5** ✨${equippedMsg}\n   • Hiệu ứng: Tăng +${10 + sLevel * 5}% ATK & +${5 + sLevel * 5}% CRIT Rate!`;
      }).join('\n\n');

      const wpnEmbed = new EmbedBuilder()
        .setTitle(`⚔️ KHO NÓN ÁNH SÁNG & CUNG MỆNH VŨ KHÍ S1-S5 (${currentWeapons.length} MÓN)`)
        .setColor('#eab308')
        .setDescription(wpnLines)
        .setFooter({ text: 'Khi roll trùng Nón Ánh Sáng ở /gacha, Vũ khí sẽ tự động Tích Chồng S1 -> S5!' });

      await i.update({ embeds: [wpnEmbed], components: [buttonsRow1, buttonsRow2] });
    }

    // 3. View Artifact Inventory
    else if (i.customId === 'inv_view_artifacts') {
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
    }

    // 4. Character Equipment Inspection
    else if (i.customId.startsWith('inv_char_')) {
      const idx = parseInt(i.customId.replace('inv_char_', ''), 10);
      const item = inventory[idx];
      if (!item) {
        return i.reply({ content: '⚠️ Không tìm thấy thông tin nhân vật ở slot này!', ephemeral: true });
      }

      const char = charactersData.find(c => c.id === item.char_id);
      const charLvl = item.level || 1;
      const wpnLvl = item.weapon_level || 1;

      const userWpns = db.getUserWeapons(userId);
      const equippedWpn = userWpns.find(w => w.char_id === item.char_id || w.name.includes(item.light_cone)) || { name: item.light_cone, superimpose: 1 };

      const charEmbed = new EmbedBuilder()
        .setTitle(`🛡️ THÔNG TIN TRANG BỊ - ${char.name.toUpperCase()}`)
        .setColor(char.color || '#3b82f6')
        .setThumbnail(char.icon || interaction.user.displayAvatarURL())
        .addFields(
          { name: '👤 Cấp Nhân Vật', value: `**Lv.${charLvl} / 80**`, inline: true },
          { name: '⚔️ Nón Ánh Sáng (Vũ Khí)', value: `**${equippedWpn.name}** (Lv.${wpnLvl} • **Tích Chồng S${equippedWpn.superimpose || 1}**)`, inline: true },
          { name: '🔮 Bộ Di Vật', value: `**${item.artifact_set || 'Bộ Tiêu Chuẩn'}**`, inline: true },
          { name: '📜 Cấp Kỹ Năng', value: `Đánh thường: Lv.${item.basic_lvl || 1} | Chiến kỹ: Lv.${item.skill_lvl || 1} | Tuyệt kỹ: Lv.${item.ult_lvl || 1}`, inline: false },
          {
            name: '📊 Chỉ Số Thực Tế (Scaled Stats)',
            value: `• **HP**: ${char.baseStats.hp + (charLvl - 1) * 40}\n• **ATK**: ${char.baseStats.atk + (charLvl - 1) * 18 + (wpnLvl - 1) * 12}\n• **DEF**: ${char.baseStats.def + (charLvl - 1) * 12}\n• **Tốc độ (SPD)**: ${char.baseStats.speed}`,
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
