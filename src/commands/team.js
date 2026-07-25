const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const teamCommand = new SlashCommandBuilder()
  .setName('team')
  .setDescription('Quản lý đội hình thi đấu (4 vị trí)')
  .addSubcommand(sub =>
    sub.setName('view')
      .setDescription('Xem đội hình hiện tại của bạn')
  )
  .addSubcommand(sub =>
    sub.setName('set')
      .setDescription('Cài đặt 4 vị trí nhân vật trong đội hình')
      .addStringOption(opt =>
        opt.setName('slot1')
          .setDescription('Vị trí 1 (DPS chính)')
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addStringOption(opt =>
        opt.setName('slot2')
          .setDescription('Vị trí 2 (Sub-DPS / Buffer)')
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addStringOption(opt =>
        opt.setName('slot3')
          .setDescription('Vị trí 3 (Shielder / Tank)')
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addStringOption(opt =>
        opt.setName('slot4')
          .setDescription('Vị trí 4 (Healer / Support)')
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand(sub =>
    sub.setName('select')
      .setDescription('Chọn đội hình tương tác bằng Menu Dropdown chọn sẵn')
  );

// Autocomplete handler when typing in Discord slash options
async function handleAutocomplete(interaction) {
  const focusedOption = interaction.options.getFocused(true);
  const userId = interaction.user.id;
  const userInv = db.getUserInventory(userId);

  const choices = userInv.map(item => {
    const char = charactersData.find(c => c.id === item.char_id);
    if (!char) return null;
    const stars = char.rarity === 5 ? '🌟' : '⭐';
    return {
      name: `${stars} ${char.name} (${char.element} • ${char.path})`,
      value: char.id
    };
  }).filter(Boolean);

  const filtered = choices.filter(choice =>
    choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())
  );

  await interaction.respond(filtered.slice(0, 25));
}

async function executeTeam(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;
  const userInv = db.getUserInventory(userId);
  const ownedCharIds = userInv.map(i => i.char_id);

  if (subcommand === 'view') {
    const team = db.getUserTeam(userId);
    const slots = [team.slot1, team.slot2, team.slot3, team.slot4];

    const embed = new EmbedBuilder()
      .setTitle(`🛡️ ĐỘI HÌNH HIỆN TẠI - ${interaction.user.username}`)
      .setColor('#3b82f6');

    slots.forEach((charId, idx) => {
      const char = charactersData.find(c => c.id === charId) || charactersData[0];
      embed.addFields({
        name: `Vị trí ${idx + 1}: ${char.name}`,
        value: `Nguyên tố: **${char.element}** | Vận mệnh: **${char.path}** | SPD: **${char.baseStats.speed}**`
      });
    });

    return interaction.reply({ embeds: [embed] });
  }

  if (subcommand === 'set') {
    const s1 = interaction.options.getString('slot1').toLowerCase().trim();
    const s2 = interaction.options.getString('slot2').toLowerCase().trim();
    const s3 = interaction.options.getString('slot3').toLowerCase().trim();
    const s4 = interaction.options.getString('slot4').toLowerCase().trim();

    const selectedSlots = [s1, s2, s3, s4];

    // Check duplicate
    if (new Set(selectedSlots).size !== 4) {
      return interaction.reply({ content: '❌ Không thể chọn trùng lặp nhân vật trong cùng 1 đội hình!', ephemeral: true });
    }

    // Check ownership
    for (const charId of selectedSlots) {
      if (!ownedCharIds.includes(charId)) {
        const char = charactersData.find(c => c.id === charId);
        const name = char ? char.name : charId;
        return interaction.reply({ content: `❌ Bạn chưa sở hữu nhân vật **${name}**! Hãy quay /gacha trước.`, ephemeral: true });
      }
    }

    db.updateTeam(userId, s1, s2, s3, s4);

    const getCharName = (id) => {
      const c = charactersData.find(item => item.id === id);
      return c ? c.name : id;
    };

    const embed = new EmbedBuilder()
      .setTitle('✅ Cập nhật Đội hình Thành công!')
      .setColor('#10b981')
      .setDescription(`Đội hình mới của bạn:\n1. ⚔️ **${getCharName(s1)}**\n2. 💥 **${getCharName(s2)}**\n3. 🛡️ **${getCharName(s3)}**\n4. 💚 **${getCharName(s4)}**`);

    return interaction.reply({ embeds: [embed] });
  }

  if (subcommand === 'select') {
    const options = userInv.map(item => {
      const char = charactersData.find(c => c.id === item.char_id);
      if (!char) return null;
      return {
        label: `${char.name} (${char.element})`,
        description: `Vận mệnh: ${char.path} | SPD: ${char.baseStats.speed}`,
        value: char.id,
        emoji: char.rarity === 5 ? '🌟' : '⭐'
      };
    }).filter(Boolean);

    if (options.length < 4) {
      return interaction.reply({ content: '❌ Bạn cần có ít nhất 4 nhân vật để dùng Menu xếp đội hình!', ephemeral: true });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('team_select_menu')
      .setPlaceholder('Chọn đúng 4 nhân vật cho Đội hình...')
      .setMinValues(4)
      .setMaxValues(4)
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setTitle('👥 CHỌN ĐỘI HÌNH BẰNG MENU DROPDOWN')
      .setColor('#9333ea')
      .setDescription('Hãy chọn **đúng 4 nhân vật** trong danh sách sở hữu bên dưới để thiết lập đội hình!');

    const response = await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
      fetchReply: true
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) return;

      const chosen = i.values;
      db.updateTeam(userId, chosen[0], chosen[1], chosen[2], chosen[3]);

      const getCharName = (id) => {
        const c = charactersData.find(item => item.id === id);
        return c ? c.name : id;
      };

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Cập nhật Đội hình Thành công!')
        .setColor('#10b981')
        .setDescription(`Đội hình mới của bạn:\n1. ⚔️ **${getCharName(chosen[0])}**\n2. 💥 **${getCharName(chosen[1])}**\n3. 🛡️ **${getCharName(chosen[2])}**\n4. 💚 **${getCharName(chosen[3])}**`);

      await i.update({ embeds: [successEmbed], components: [] });
    });
  }
}

module.exports = {
  data: teamCommand,
  execute: executeTeam,
  autocomplete: handleAutocomplete
};
