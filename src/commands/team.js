const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const teamCommand = new SlashCommandBuilder()
  .setName('team')
  .setDescription('Quản lý và xem chi tiết đội hình 4 nhân vật')
  .addSubcommand(sub =>
    sub.setName('view')
      .setDescription('Xem thông tin chi tiết chỉ số, vũ khí và di vật của đội hình hiện tại')
  )
  .addSubcommand(sub =>
    sub.setName('select')
      .setDescription('Chọn nhanh nhân vật cho các vị trí Slot 1 - 4 trong đội hình')
  );

function getCharAvatarAttachment(char) {
  if (!char || !char.icon) return { url: null, attachment: null };
  if (char.icon.startsWith('http')) return { url: char.icon, attachment: null };

  const localPath = path.join(__dirname, '../../', char.icon);
  if (fs.existsSync(localPath)) {
    const ext = path.extname(localPath).replace('.', '') || 'jpg';
    const filename = `team_avatar_${char.id}.${ext}`;
    const attachment = new AttachmentBuilder(localPath, { name: filename });
    return { url: `attachment://${filename}`, attachment };
  }
  return { url: null, attachment: null };
}

async function executeTeam(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;

  if (subcommand === 'view') {
    const team = db.getUserTeam(userId);
    const userInv = db.getUserInventory(userId);
    const rawDb = JSON.parse(fs.readFileSync(path.join(__dirname, '../../database.json'), 'utf8'));
    const userArts = (rawDb.artifacts && rawDb.artifacts[userId]) || [];

    const slots = [
      { slotNum: 1, charId: team.slot1 },
      { slotNum: 2, charId: team.slot2 },
      { slotNum: 3, charId: team.slot3 },
      { slotNum: 4, charId: team.slot4 }
    ];

    const slot1Char = charactersData.find(c => c.id === team.slot1);
    const avatarInfo = getCharAvatarAttachment(slot1Char);

    const embed = new EmbedBuilder()
      .setTitle(`🛡️ THÔNG TIN ĐỘI HÌNH VÀ CHỈ SỐ - ${interaction.user.username}`)
      .setColor('#3b82f6')
      .setDescription('Chi tiết thông số, vũ khí và thánh di vật của 4 nhân vật ra trận:');

    if (avatarInfo.url) embed.setThumbnail(avatarInfo.url);

    slots.forEach(s => {
      const char = charactersData.find(c => c.id === s.charId);
      const invRecord = userInv.find(i => i.char_id === s.charId) || { level: 1, weapon_level: 1, light_cone: 'Nón Ánh Sáng Tiêu Chuẩn', artifact_set: 'Bộ Duyên Kiếp', eidolon: 0 };
      const charLvl = invRecord.level || 1;
      const wpnLvl = invRecord.weapon_level || 1;

      if (!char) {
        embed.addFields({ name: `Slot ${s.slotNum}: Trống`, value: 'Chưa trang bị nhân vật', inline: false });
        return;
      }

      const hp = char.baseStats.hp + (charLvl - 1) * 40;
      const atk = char.baseStats.atk + (charLvl - 1) * 18 + (wpnLvl - 1) * 12;
      const def = char.baseStats.def + (charLvl - 1) * 12;
      const spd = char.baseStats.speed;

      const userWpns = db.getUserWeapons(userId);
      const equippedWpn = userWpns.find(w => w.char_id === s.charId || w.name.includes(invRecord.light_cone)) || { name: invRecord.light_cone, superimpose: 1 };
      const wpnMsg = `⚔️ ${equippedWpn.name} (Lv.${wpnLvl} • S${equippedWpn.superimpose || 1})`;
      const artMsg = `🔮 ${invRecord.artifact_set || 'Bộ Tiêu Chuẩn (5★)'}`;

      embed.addFields({
        name: `👤 Slot ${s.slotNum}: ${char.name.toUpperCase()} (Lv.${charLvl} • E${invRecord.eidolon || 0})`,
        value: `**Vận Mệnh**: ${char.path} | **Thuộc Tính**: ${char.element}\n${wpnMsg}\n${artMsg}\n📊 **Chỉ số**: HP **${hp}** | ATK **${atk}** | DEF **${def}** | SPD **${spd}**`,
        inline: false
      });
    });

    const payload = { embeds: [embed] };
    if (avatarInfo.attachment) payload.files = [avatarInfo.attachment];

    await interaction.reply(payload);
  } else if (subcommand === 'select') {
    const userInv = db.getUserInventory(userId);

    const selectOptions = userInv.map(inv => {
      const char = charactersData.find(c => c.id === inv.char_id);
      if (!char) return null;
      return {
        label: `${char.name} (${char.element} - ${char.path})`,
        description: `Level: ${inv.level || 1} | Tinh Hồn E${inv.eidolon || 0}`,
        value: char.id,
        emoji: char.rarity === 5 ? '🌟' : '⭐'
      };
    }).filter(Boolean);

    const menuSlot1 = new StringSelectMenuBuilder().setCustomId('team_select_slot1').setPlaceholder('Chọn nhân vật cho Vị trí 1 (Slot 1)...').addOptions(selectOptions);
    const menuSlot2 = new StringSelectMenuBuilder().setCustomId('team_select_slot2').setPlaceholder('Chọn nhân vật cho Vị trí 2 (Slot 2)...').addOptions(selectOptions);
    const menuSlot3 = new StringSelectMenuBuilder().setCustomId('team_select_slot3').setPlaceholder('Chọn nhân vật cho Vị trí 3 (Slot 3)...').addOptions(selectOptions);
    const menuSlot4 = new StringSelectMenuBuilder().setCustomId('team_select_slot4').setPlaceholder('Chọn nhân vật cho Vị trí 4 (Slot 4)...').addOptions(selectOptions);

    const row1 = new ActionRowBuilder().addComponents(menuSlot1);
    const row2 = new ActionRowBuilder().addComponents(menuSlot2);
    const row3 = new ActionRowBuilder().addComponents(menuSlot3);
    const row4 = new ActionRowBuilder().addComponents(menuSlot4);

    const currentTeam = db.getUserTeam(userId);
    const slot1Char = charactersData.find(c => c.id === currentTeam.slot1);
    const avatarInfo = getCharAvatarAttachment(slot1Char);

    const embed = new EmbedBuilder()
      .setTitle('👥 TÙY CHỈNH ĐỘI HÌNH RA TRẬN')
      .setColor('#9333ea')
      .setDescription(`Chọn nhân vật trực tiếp từ danh sách thả xuống bên dưới cho từng vị trí:\n\n- Slot 1: **${currentTeam.slot1.toUpperCase()}**\n- Slot 2: **${currentTeam.slot2.toUpperCase()}**\n- Slot 3: **${currentTeam.slot3.toUpperCase()}**\n- Slot 4: **${currentTeam.slot4.toUpperCase()}**`);

    if (avatarInfo.url) embed.setThumbnail(avatarInfo.url);

    const payload = { embeds: [embed], components: [row1, row2, row3, row4], fetchReply: true };
    if (avatarInfo.attachment) payload.files = [avatarInfo.attachment];

    const response = await interaction.reply(payload);

    // STRICT MESSAGE-SPECIFIC COLLECTOR (PER-USER & PER-MESSAGE ISOLATION)
    const collector = response.createMessageComponentCollector({
      filter: i => i.message.id === response.id && i.user.id === userId,
      time: 120000
    });

    collector.on('collect', async i => {
      if (i.message.id !== response.id || i.user.id !== userId) return;

      await i.deferUpdate().catch(() => {});

      const updatedTeam = db.getUserTeam(userId);
      const chosenCharId = i.values[0];

      if (i.customId === 'team_select_slot1') updatedTeam.slot1 = chosenCharId;
      if (i.customId === 'team_select_slot2') updatedTeam.slot2 = chosenCharId;
      if (i.customId === 'team_select_slot3') updatedTeam.slot3 = chosenCharId;
      if (i.customId === 'team_select_slot4') updatedTeam.slot4 = chosenCharId;

      db.updateTeam(userId, updatedTeam.slot1, updatedTeam.slot2, updatedTeam.slot3, updatedTeam.slot4);

      const newSlot1Char = charactersData.find(c => c.id === updatedTeam.slot1);
      const newAvatarInfo = getCharAvatarAttachment(newSlot1Char);

      const newEmbed = new EmbedBuilder()
        .setTitle('👥 TÙY CHỈNH ĐỘI HÌNH RA TRẬN')
        .setColor('#9333ea')
        .setDescription(`✅ **Đã cập nhật đội hình thành công!**\n\n- Slot 1: **${updatedTeam.slot1.toUpperCase()}**\n- Slot 2: **${updatedTeam.slot2.toUpperCase()}**\n- Slot 3: **${updatedTeam.slot3.toUpperCase()}**\n- Slot 4: **${updatedTeam.slot4.toUpperCase()}**`);

      if (newAvatarInfo.url) newEmbed.setThumbnail(newAvatarInfo.url);

      const updatePayload = { embeds: [newEmbed], components: [row1, row2, row3, row4] };
      if (newAvatarInfo.attachment) updatePayload.files = [newAvatarInfo.attachment];

      await i.editReply(updatePayload).catch(err => console.error('❌ Lỗi editReply team select:', err));
    });
  }
}

module.exports = {
  data: teamCommand,
  execute: executeTeam
};
