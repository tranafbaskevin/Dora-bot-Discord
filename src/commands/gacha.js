const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const gachaCommand = new SlashCommandBuilder()
  .setName('gacha')
  .setDescription('Bước nhảy không gian / Cầu nguyện gacha nhân vật & vũ khí')
  .addIntegerOption(opt =>
    opt.setName('amount')
      .setDescription('Số lượt quay (1 - 10 lượt)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(10)
  )
  .addStringOption(opt =>
    opt.setName('banner')
      .setDescription('Chọn Banner Gacha Muốn Roll')
      .setRequired(false)
      .addChoices(
        { name: '🌟 Banner Seele 5★ (Quantum - Hunt)', value: 'seele' },
        { name: '⚡ Banner Jing Yuan 5★ (Lightning - Erudition)', value: 'jing_yuan' },
        { name: '🌀 Banner Bronya 5★ (Wind - Harmony)', value: 'bronya' },
        { name: '⚔️ Banner Nón Ánh Sáng 5★ (Brilliant Fixation)', value: 'weapon' }
      )
  );

function handleGachaPull(discordId, requestedAmount, bannerType) {
  const user = db.getUser(discordId);
  const singleCost = 160;

  const maxAffordable = Math.floor(user.jades / singleCost);

  if (maxAffordable <= 0) {
    return { success: false, message: `❌ Bạn không đủ Nguyên Thạch/Stellar Jade! (Cần ít nhất 160, bạn có ${user.jades.toLocaleString()}).` };
  }

  const actualAmount = Math.min(requestedAmount, maxAffordable);
  const totalCost = actualAmount * singleCost;

  let currentPity5 = user.pity_5star;
  let currentPity4 = user.pity_4star;
  let isGuaranteed = user.is_guaranteed || false;
  const results = [];
  let trashCount = 0;

  const featuredId = (bannerType === 'jing_yuan' || bannerType === 'bronya') ? bannerType : 'seele';
  const featuredChar5 = charactersData.find(c => c.id === featuredId) || charactersData[0];
  const standardChars5 = charactersData.filter(c => c.rarity === 5 && c.id !== featuredId);
  const chars4Star = charactersData.filter(c => c.rarity === 4);

  const weapons5Star = [
    { name: 'Nón Ánh Sáng 5★: In the Night (Seele)', rarity: 5, type: 'weapon' },
    { name: 'Nón Ánh Sáng 5★: Before Dawn (Jing Yuan)', rarity: 5, type: 'weapon' },
    { name: 'Nón Ánh Sáng 5★: But the Battle Isn\'t Over (Bronya)', rarity: 5, type: 'weapon' }
  ];

  const weapons4Star = [
    { name: 'Nón Ánh Sáng 4★: Only Silence Remains', rarity: 4, type: 'weapon' },
    { name: 'Nón Ánh Sáng 4★: Shared Feeling', rarity: 4, type: 'weapon' },
    { name: 'Nón Ánh Sáng 4★: Swordplay', rarity: 4, type: 'weapon' }
  ];

  for (let i = 0; i < actualAmount; i++) {
    currentPity5++;
    currentPity4++;

    let pulledRarity = 3;
    let item = null;
    let wonRateUp = false;
    let lostRateUp = false;

    if (currentPity5 >= 90 || Math.random() < 0.006 + Math.max(0, currentPity5 - 74) * 0.06) {
      pulledRarity = 5;
      if (bannerType === 'weapon') {
        item = weapons5Star[Math.floor(Math.random() * weapons5Star.length)];
      } else {
        if (isGuaranteed || Math.random() < 0.5) {
          item = { type: 'char', ...featuredChar5 };
          wonRateUp = true;
          isGuaranteed = false;
        } else {
          const randStandard = standardChars5[Math.floor(Math.random() * standardChars5.length)] || charactersData[1];
          item = { type: 'char', ...randStandard };
          lostRateUp = true;
          isGuaranteed = true;
        }
      }
      currentPity5 = 0;
    } else if (currentPity4 >= 10 || Math.random() < 0.051) {
      pulledRarity = 4;
      if (bannerType === 'weapon') {
        item = weapons4Star[Math.floor(Math.random() * weapons4Star.length)];
      } else {
        item = { type: 'char', ...chars4Star[Math.floor(Math.random() * chars4Star.length)] };
      }
      currentPity4 = 0;
    } else {
      pulledRarity = 3;
      trashCount++;
    }

    if (item) {
      if (item.type === 'char') {
        const invResult = db.addCharacter(discordId, item.id);
        results.push({
          item,
          rarity: pulledRarity,
          wonRateUp,
          lostRateUp,
          isNew: invResult.isNew,
          eidolon: invResult.eidolon
        });
      } else {
        results.push({
          item,
          rarity: pulledRarity,
          name: item.name
        });
      }
    } else {
      results.push({
        name: '⚪ Nón Ánh Sáng 3★ Rác',
        rarity: 3
      });
    }
  }

  db.updateUserJades(discordId, user.jades - totalCost);
  db.updatePity(discordId, currentPity5, currentPity4);
  db.setGuaranteedState(discordId, isGuaranteed);
  if (trashCount > 0) {
    db.addTrashItems(discordId, trashCount);
  }

  return {
    success: true,
    actualAmount,
    requestedAmount,
    adjusted: actualAmount < requestedAmount,
    isGuaranteed,
    results,
    featuredChar: featuredChar5,
    remainingJades: user.jades - totalCost,
    pity5: currentPity5,
    pity4: currentPity4,
    trashCount
  };
}

function buildGachaEmbed(username, res, bannerType) {
  const bannerTitle = bannerType === 'weapon'
    ? '⚔️ BƯỚC NHẢY NÓN ÁNH SÁNG (Brilliant Fixation)'
    : `🌟 BƯỚC NHẢY EVENT: ${res.featuredChar.name.toUpperCase()} 5★`;

  const autoNotice = res.adjusted
    ? `\n⚠️ *Bạn yêu cầu ${res.requestedAmount} lượt nhưng chỉ đủ Nguyên thạch quay **${res.actualAmount} lượt**.*`
    : '';

  const guaranteedBadge = res.isGuaranteed ? '🛡️ **BẢO HIỂM 100% CHO LẦN 5★ TIẾP THEO!**' : '🎲 50/50 Rate Up';

  const embed = new EmbedBuilder()
    .setTitle(`✨ KẾT QUẢ GACHA (${res.actualAmount} LƯỢT)`)
    .setColor('#ffd700')
    .setDescription(`**${bannerTitle}**${autoNotice}\n\n💎 **Nguyên thạch còn lại**: **${res.remainingJades.toLocaleString()}** | 🎯 **Pity 5★**: **${res.pity5}/90**\n${guaranteedBadge}`)
    .setFooter({ text: `Người quay: ${username} | Chọn các nút bên dưới để tiếp tục quay!` });

  let resultLines = [];
  res.results.forEach((r, idx) => {
    if (r.rarity === 5) {
      if (r.item && r.item.type === 'char') {
        const status = r.isNew ? '🆕 [MỚI!]' : `✨ [Tinh Hồn E${r.eidolon}]`;
        const rateTag = r.lostRateUp ? '🔴 [LỆCH RATE 50/50!]' : (r.wonRateUp ? '🌟 [WIN RATE UP!]' : '');
        resultLines.push(`\`${idx + 1}.\` 🌟🌟🌟🌟🌟 **${r.item.name}** (${r.item.element}) ${rateTag} - ${status}`);
      } else {
        resultLines.push(`\`${idx + 1}.\` 🌟🌟🌟🌟🌟 **${r.name}** ⚔️`);
      }
    } else if (r.rarity === 4) {
      if (r.item && r.item.type === 'char') {
        const status = r.isNew ? '🆕 [MỚI!]' : `🟣 [Tinh Hồn E${r.eidolon}]`;
        resultLines.push(`\`${idx + 1}.\` ⭐⭐⭐⭐ **${r.item.name}** (${r.item.element}) - ${status}`);
      } else {
        resultLines.push(`\`${idx + 1}.\` ⭐⭐⭐⭐ **${r.name}** ⚔️`);
      }
    } else {
      resultLines.push(`\`${idx + 1}.\` ⚪ 3★ Nón Ánh Sáng Rác (Đã lưu vào Túi đồ)`);
    }
  });

  embed.addFields({ name: '🎁 Vật phẩm thu được:', value: resultLines.join('\n') });
  return embed;
}

function buildGachaButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('gacha_btn_1').setLabel('🎯 Roll 1 Lần').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('gacha_btn_max').setLabel('💫 Roll Max (Tối Đa 10 Lượt)').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('gacha_btn_change_banner').setLabel('🔄 Đổi Banner').setStyle(ButtonStyle.Secondary)
  );
}

async function executeGacha(interaction) {
  const requestedAmount = interaction.options.getInteger('amount');
  let currentBanner = interaction.options.getString('banner') || 'seele';

  const res = handleGachaPull(interaction.user.id, requestedAmount, currentBanner);

  if (!res.success) {
    return interaction.reply({ content: res.message, ephemeral: true });
  }

  const embed = buildGachaEmbed(interaction.user.username, res, currentBanner);
  const buttonsRow = buildGachaButtons();

  const response = await interaction.reply({
    embeds: [embed],
    components: [buttonsRow],
    fetchReply: true
  });

  const collector = response.createMessageComponentCollector({
    time: 300000
  });

  collector.on('collect', async i => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: '❌ Bạn không phải là người quay gacha này!', ephemeral: true });
    }

    // 1. Roll 1 Lần
    if (i.customId === 'gacha_btn_1') {
      const pullRes = handleGachaPull(interaction.user.id, 1, currentBanner);
      if (!pullRes.success) {
        return i.reply({ content: pullRes.message, ephemeral: true });
      }
      const newEmbed = buildGachaEmbed(interaction.user.username, pullRes, currentBanner);
      await i.update({ embeds: [newEmbed], components: [buildGachaButtons()] });
    }

    // 2. Roll Max (Up to 10 pulls)
    else if (i.customId === 'gacha_btn_max') {
      const pullRes = handleGachaPull(interaction.user.id, 10, currentBanner);
      if (!pullRes.success) {
        return i.reply({ content: pullRes.message, ephemeral: true });
      }
      const newEmbed = buildGachaEmbed(interaction.user.username, pullRes, currentBanner);
      await i.update({ embeds: [newEmbed], components: [buildGachaButtons()] });
    }

    // 3. Đổi Banner
    else if (i.customId === 'gacha_btn_change_banner') {
      const bannerMenu = new StringSelectMenuBuilder()
        .setCustomId('gacha_menu_select_banner')
        .setPlaceholder('Chọn Banner Gacha Muốn Đổi...')
        .addOptions(
          { label: '🌟 Banner Seele 5★ (Quantum - Hunt)', value: 'seele' },
          { label: '⚡ Banner Jing Yuan 5★ (Lightning - Erudition)', value: 'jing_yuan' },
          { label: '🌀 Banner Bronya 5★ (Wind - Harmony)', value: 'bronya' },
          { label: '⚔️ Banner Nón Ánh Sáng 5★ (Brilliant Fixation)', value: 'weapon' }
        );

      const menuRow = new ActionRowBuilder().addComponents(bannerMenu);
      await i.update({ components: [menuRow] });
    }

    // Handle Banner Select Menu
    else if (i.customId === 'gacha_menu_select_banner') {
      currentBanner = i.values[0];
      const pullRes = handleGachaPull(interaction.user.id, 10, currentBanner);

      if (!pullRes.success) {
        return i.reply({ content: pullRes.message, ephemeral: true });
      }

      const newEmbed = buildGachaEmbed(interaction.user.username, pullRes, currentBanner);
      await i.update({ embeds: [newEmbed], components: [buildGachaButtons()] });
    }
  });
}

module.exports = {
  data: gachaCommand,
  execute: executeGacha
};
