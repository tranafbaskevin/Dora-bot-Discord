const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const equipmentCommand = new SlashCommandBuilder()
  .setName('equipment')
  .setDescription('Quản lý trang bị: Chọn nhân vật -> Đổi Vũ Khí hoặc Thánh Di Vật');

async function executeEquipment(interaction) {
  const userId = interaction.user.id;
  const userInv = db.getUserInventory(userId);

  if (userInv.length === 0) {
    return interaction.reply({ content: '⚠️ Bạn chưa có nhân vật nào trong túi đồ!', ephemeral: true });
  }

  // Step 1 Embed: Select Character
  const step1Embed = new EmbedBuilder()
    .setTitle('🛡️ TRUNG TÂM QUẢN LÝ TRANG BỊ - BƯỚC 1: CHỌN NHÂN VẬT')
    .setColor('#3b82f6')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setDescription('Hãy chọn 1 nhân vật bên dưới để xem và thay đổi **Vũ Khí (Nón Ánh Sáng)** hoặc **Thánh Di Vật**:');

  const charOptions = userInv.map(inv => {
    const char = charactersData.find(c => c.id === inv.char_id);
    if (!char) return null;
    return {
      label: `${char.name} (Lv.${inv.level || 1})`,
      description: `Nguyên tố: ${char.element} | Vận mệnh: ${char.path}`,
      value: `char_equip_${char.id}`,
      emoji: '👤'
    };
  }).filter(Boolean);

  const charMenu = new StringSelectMenuBuilder()
    .setCustomId('equip_step1_char_menu')
    .setPlaceholder('1. Chọn Nhân Vật Muốn Thay Đổi Trang Bị...')
    .addOptions(charOptions);

  const row1 = new ActionRowBuilder().addComponents(charMenu);

  const response = await interaction.reply({
    embeds: [step1Embed],
    components: [row1],
    fetchReply: true
  });

  const collector = response.createMessageComponentCollector({
    time: 300000
  });

  collector.on('collect', async i => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: '❌ Bạn không có quyền thao tác trên túi đồ này!', ephemeral: true });
    }

    await i.deferUpdate().catch(() => {});

    const customId = i.customId;

    // Step 1 -> Step 2: Character selected
    if (customId === 'equip_step1_char_menu') {
      const charId = i.values[0].replace('char_equip_', '');
      const char = charactersData.find(c => c.id === charId) || charactersData[0];
      const invRec = userInv.find(rec => rec.char_id === charId) || { level: 1, weapon_level: 1, light_cone: 'Nón Ánh Sáng Tiêu Chuẩn', artifact_set: 'Bộ Duyên Kiếp' };

      const userWpns = db.getUserWeapons(userId);
      const equippedWpn = userWpns.find(w => w.char_id === charId || w.name.includes(invRec.light_cone)) || { name: invRec.light_cone, superimpose: 1, level: invRec.weapon_level || 1 };
      const wpnLvl = Math.max(invRec.weapon_level || 1, equippedWpn.level || 1);

      const step2Embed = new EmbedBuilder()
        .setTitle(`🛡️ TRANG BỊ HIỆN TẠI: ${char.name.toUpperCase()} (Lv.${invRec.level || 1})`)
        .setColor(char.color || '#3b82f6')
        .setThumbnail(char.icon || interaction.user.displayAvatarURL())
        .setDescription(`Nhân vật: **${char.name}** | Nguyên tố: **${char.element}** | Vận mệnh: **${char.path}**`)
        .addFields(
          {
            name: '⚔️ Vũ Khí / Nón Ánh Sáng Đang Đeo',
            value: `• **${equippedWpn.name}**\n  Cấp độ: **Lv.${wpnLvl} / 80** | Cung mệnh Tích chồng: **S${equippedWpn.superimpose || 1}**`,
            inline: false
          },
          {
            name: '🔮 Bộ Thánh Di Vật Đang Đeo',
            value: `• **${invRec.artifact_set || 'Bộ Tiêu Chuẩn (5★)'}**\n  Hiệu ứng: Tăng +15% Sát Thương Thuộc Tính & +10% CRIT Rate`,
            inline: false
          }
        )
        .setFooter({ text: 'Chọn 1 trong 2 nút bên dưới để Đổi Vũ Khí hoặc Đổi Thánh Di Vật!' });

      const actionButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`btn_swap_wpn_${charId}`).setLabel(`⚔️ Đổi Vũ Khí Cho ${char.name}`).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`btn_swap_art_${charId}`).setLabel(`🔮 Đổi Di Vật Cho ${char.name}`).setStyle(ButtonStyle.Primary)
      );

      await i.editReply({
        embeds: [step2Embed],
        components: [row1, actionButtons]
      });
    }

    // Step 2 -> Step 3 (Weapon Selection)
    else if (customId.startsWith('btn_swap_wpn_')) {
      const targetCharId = customId.replace('btn_swap_wpn_', '');
      const targetChar = charactersData.find(c => c.id === targetCharId) || charactersData[0];
      const userWpns = db.getUserWeapons(userId);

      const wpnOptions = userWpns.map(w => ({
        label: `${w.name} (Lv.${w.level || 1} • S${w.superimpose || 1})`,
        description: w.char_id ? `Đang trang bị cho ${w.char_id.toUpperCase()}` : 'Chưa trang bị',
        value: `do_equip_wpn_${targetCharId}_${w.id}`,
        emoji: '⚔️'
      }));

      const wpnMenu = new StringSelectMenuBuilder()
        .setCustomId(`menu_do_equip_wpn_${targetCharId}`)
        .setPlaceholder(`Chọn Vũ khí trong kho để trang bị cho ${targetChar.name}...`)
        .addOptions(wpnOptions.slice(0, 25));

      const wpnRow = new ActionRowBuilder().addComponents(wpnMenu);

      const wpnEmbed = new EmbedBuilder()
        .setTitle(`⚔️ BẢNG CHỌN VŨ KHÍ CHO: ${targetChar.name.toUpperCase()}`)
        .setColor('#eab308')
        .setDescription(`Chọn 1 trong **${userWpns.length}** Nón Ánh Sáng khả dụng trong kho bên dưới để trang bị cho **${targetChar.name}**:`);

      await i.editReply({
        embeds: [wpnEmbed],
        components: [wpnRow]
      });
    }

    // Execute Weapon Swap
    else if (customId.startsWith('menu_do_equip_wpn_')) {
      const val = i.values[0].replace('do_equip_wpn_', '');
      const parts = val.split('_wpn_');
      const targetCharId = parts[0];
      const wpnId = `wpn_${parts[1]}`;

      const rawDb = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../database.json'), 'utf8'));

      if (rawDb.weapons && rawDb.weapons[userId]) {
        // Unequip old weapon owner
        rawDb.weapons[userId].forEach(w => {
          if (w.char_id === targetCharId) w.char_id = null;
        });

        // Equip target weapon
        const targetWpn = rawDb.weapons[userId].find(w => w.id === wpnId || w.id.endsWith(parts[1]));
        if (targetWpn) {
          targetWpn.char_id = targetCharId;

          // Sync inventory table
          if (rawDb.inventory[userId]) {
            const invChar = rawDb.inventory[userId].find(c => c.char_id === targetCharId);
            if (invChar) {
              invChar.light_cone = targetWpn.name;
              invChar.weapon_level = Math.max(invChar.weapon_level || 1, targetWpn.level || 1);
            }
          }
        }
        require('fs').writeFileSync(require('path').join(__dirname, '../../database.json'), JSON.stringify(rawDb, null, 2));
      }

      const targetChar = charactersData.find(c => c.id === targetCharId) || charactersData[0];

      const successEmbed = new EmbedBuilder()
        .setTitle(`🎉 TRANG BỊ VŨ KHÍ THÀNH CÔNG CHO ${targetChar.name.toUpperCase()}!`)
        .setColor('#10b981')
        .setDescription(`✨ **${targetChar.name}** đã được trang bị Nón Ánh Sáng mới thành công!\nChỉ số và hiệu ứng đã được tự động áp dụng.`);

      await i.editReply({
        embeds: [successEmbed],
        components: [row1]
      });
    }

    // Step 2 -> Step 3 (Artifact Selection)
    else if (customId.startsWith('btn_swap_art_')) {
      const targetCharId = customId.replace('btn_swap_art_', '');
      const targetChar = charactersData.find(c => c.id === targetCharId) || charactersData[0];

      const relicSets = [
        { label: 'Bộ Thiện Xạ Trường Hoang (5★)', description: 'Tăng +12% ATK & +10% Tốc độ', value: `do_equip_art_${targetCharId}_musketeer` },
        { label: 'Bộ Thiên Tài Kim Loại (5★)', description: 'Tăng +10% Sát thương Lượng Tử', value: `do_equip_art_${targetCharId}_genius` },
        { label: 'Bộ Thợ Săn Băng Tuyết (5★)', description: 'Tăng +10% Sát thương Băng', value: `do_equip_art_${targetCharId}_hunter` },
        { label: 'Bộ Hiệp Sĩ Thánh Điện (5★)', description: 'Tăng +15% Phòng Thủ & Khiên', value: `do_equip_art_${targetCharId}_knight` },
        { label: 'Bộ Lãng Khách Âm Thầm (5★)', description: 'Tăng +10% Lượng Hồi Máu', value: `do_equip_art_${targetCharId}_passerby` },
        { label: 'Bộ Chim Ưng Ranh Ma (5★)', description: 'Tăng +10% Sát thương Phong', value: `do_equip_art_${targetCharId}_eagle` }
      ];

      const artMenu = new StringSelectMenuBuilder()
        .setCustomId(`menu_do_equip_art_${targetCharId}`)
        .setPlaceholder(`Chọn Bộ Thánh Di Vật để trang bị cho ${targetChar.name}...`)
        .addOptions(relicSets);

      const artRow = new ActionRowBuilder().addComponents(artMenu);

      const artEmbed = new EmbedBuilder()
        .setTitle(`🔮 BẢNG CHỌN THÁNH DI VẬT CHO: ${targetChar.name.toUpperCase()}`)
        .setColor('#8b5cf6')
        .setDescription(`Chọn 1 trong các Bộ Thánh Di Vật 5★ khả dụng bên dưới để trang bị cho **${targetChar.name}**:`);

      await i.editReply({
        embeds: [artEmbed],
        components: [artRow]
      });
    }

    // Execute Artifact Swap
    else if (customId.startsWith('menu_do_equip_art_')) {
      const val = i.values[0].replace('do_equip_art_', '');
      const parts = val.split('_');
      const targetCharId = parts[0];
      const selectedSetName = parts[1];

      const setDisplayNames = {
        musketeer: 'Bộ Thiện Xạ Trường Hoang (5★)',
        genius: 'Bộ Thiên Tài Kim Loại (5★)',
        hunter: 'Bộ Thợ Săn Băng Tuyết (5★)',
        knight: 'Bộ Hiệp Sĩ Thánh Điện (5★)',
        passerby: 'Bộ Lãng Khách Âm Thầm (5★)',
        eagle: 'Bộ Chim Ưng Ranh Ma (5★)'
      };

      const finalSetName = setDisplayNames[selectedSetName] || 'Bộ Thiện Xạ Trường Hoang (5★)';

      const rawDb = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../database.json'), 'utf8'));

      if (rawDb.inventory[userId]) {
        const invChar = rawDb.inventory[userId].find(c => c.char_id === targetCharId);
        if (invChar) {
          invChar.artifact_set = finalSetName;
        }
        require('fs').writeFileSync(require('path').join(__dirname, '../../database.json'), JSON.stringify(rawDb, null, 2));
      }

      const targetChar = charactersData.find(c => c.id === targetCharId) || charactersData[0];

      const successEmbed = new EmbedBuilder()
        .setTitle(`🎉 TRANG BỊ DI VẬT THÀNH CÔNG CHO ${targetChar.name.toUpperCase()}!`)
        .setColor('#10b981')
        .setDescription(`✨ **${targetChar.name}** đã được trang bị **${finalSetName}** thành công!\nHiệu ứng kích hoạt bộ di vật 2 món & 4 món đã sẵn sàng.`);

      await i.editReply({
        embeds: [successEmbed],
        components: [row1]
      });
    }
  });
}

module.exports = {
  data: equipmentCommand,
  execute: executeEquipment
};
