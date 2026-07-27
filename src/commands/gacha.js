const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const charactersData = require('../data/characters.json');
const weaponsData = require('../data/weapons.json');

const gachaCommand = new SlashCommandBuilder()
  .setName('gacha')
  .setDescription('Bước nhảy không gian / Cầu nguyện gacha nhân vật & vũ khí vĩnh cửu')
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
        { name: '💜 Banner Acheron 5★ (Lightning - Nihility)', value: 'acheron' },
        { name: '🍇 Banner Kafka 5★ (Lightning - Nihility)', value: 'kafka' },
        { name: '🌟 Banner Seele 5★ (Quantum - Hunt)', value: 'seele' },
        { name: '⚡ Banner Jing Yuan 5★ (Lightning - Erudition)', value: 'jing_yuan' },
        { name: '⚔️ Banner Blade 5★ (Wind - Destruction)', value: 'blade' },
        { name: '👾 Banner Silver Wolf 5★ (Quantum - Nihility)', value: 'silver_wolf' },
        { name: '🌸 Banner Fu Xuan 5★ (Quantum - Preservation)', value: 'fu_xuan' },
        { name: '🌀 Banner Bronya 5★ (Wind - Harmony)', value: 'bronya' },
        { name: '🗡️ Banner Nón Ánh Sáng Vĩnh Cửu 36+ (Brilliant Fixation)', value: 'weapon' }
      )
  );

function getCharAvatarAttachment(char) {
  if (!char || !char.icon) return { url: null, attachment: null };
  if (char.icon.startsWith('http')) return { url: char.icon, attachment: null };

  const localPath = path.join(__dirname, '../../', char.icon);
  if (fs.existsSync(localPath)) {
    const ext = path.extname(localPath).replace('.', '') || 'jpg';
    const filename = `gacha_avatar_${char.id}.${ext}`;
    const attachment = new AttachmentBuilder(localPath, { name: filename });
    return { url: `attachment://${filename}`, attachment };
  }
  return { url: null, attachment: null };
}

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

  const validBanners = ['seele', 'jing_yuan', 'bronya', 'acheron', 'kafka', 'blade', 'silver_wolf', 'fu_xuan'];
  const featuredId = validBanners.includes(bannerType) ? bannerType : 'seele';
  const featuredChar5 = charactersData.find(c => c.id === featuredId) || charactersData[0];

  // STRICT OFF-BANNER 50/50 RULE: Off-banner 5★ can ONLY be Standard 5★ (Bronya), NEVER another Limited Event 5★!
  const standardChars5 = charactersData.filter(c => c.rarity === 5 && (c.isStandard === true || c.id === 'bronya'));
  const chars4Star = charactersData.filter(c => c.rarity === 4);

  const weapons5Star = weaponsData.filter(w => w.rarity === 5);
  const weapons4Star = weaponsData.filter(w => w.rarity === 4);
  const weapons3Star = weaponsData.filter(w => w.rarity === 3);

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
        const randWpn = weapons5Star[Math.floor(Math.random() * weapons5Star.length)];
        item = { type: 'weapon', ...randWpn };
      } else {
        if (isGuaranteed || Math.random() < 0.5) {
          item = { type: 'char', ...featuredChar5 };
          wonRateUp = true;
          isGuaranteed = false;
        } else {
          // Off-Banner 50/50 Loss drops strictly Standard 5★ (Bronya)
          const randStandard = standardChars5[Math.floor(Math.random() * standardChars5.length)] || charactersData.find(c => c.id === 'bronya') || charactersData[2];
          item = { type: 'char', ...randStandard };
          lostRateUp = true;
          isGuaranteed = true;
        }
      }
      currentPity5 = 0;
    } else if (currentPity4 >= 10 || Math.random() < 0.051) {
      pulledRarity = 4;
      if (bannerType === 'weapon') {
        const randWpn = weapons4Star[Math.floor(Math.random() * weapons4Star.length)];
        item = { type: 'weapon', ...randWpn };
      } else {
        item = { type: 'char', ...chars4Star[Math.floor(Math.random() * chars4Star.length)] };
      }
      currentPity4 = 0;
    } else {
      pulledRarity = 3;
      if (bannerType === 'weapon') {
        const randWpn = weapons3Star[Math.floor(Math.random() * weapons3Star.length)];
        item = { type: 'weapon', ...randWpn };
      } else {
        trashCount++;
      }
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
        const wpnResult = db.addWeapon(discordId, item);
        results.push({
          item,
          rarity: pulledRarity,
          name: item.name,
          weaponObj: wpnResult.weapon,
          isNew: wpnResult.isNew,
          superimpose: wpnResult.superimpose
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

function buildGachaEmbedPayload(username, res, bannerType) {
  const bannerTitle = bannerType === 'weapon'
    ? '⚔️ BƯỚC NHẢY VŨ KHÍ VĨNH CỬU (Brilliant Fixation - 36+ Nón Ánh Sáng)'
    : `🌟 BƯỚC NHẢY EVENT: ${res.featuredChar.name.toUpperCase()} 5★`;

  const autoNotice = res.adjusted
    ? `\n⚠️ *Bạn yêu cầu ${res.requestedAmount} lượt nhưng chỉ đủ Nguyên thạch quay **${res.actualAmount} lượt**.*`
    : '';

  const guaranteedBadge = res.isGuaranteed ? '🛡️ **BẢO HIỂM 100% CHO LẦN 5★ TIẾP THEO!**' : '🎲 50/50 Rate Up';

  const embed = new EmbedBuilder()
    .setTitle(`✨ KẾT QUẢ GACHA (${res.actualAmount} LƯỢT)`)
    .setColor(res.featuredChar.color || '#ffd700')
    .setDescription(`**${bannerTitle}**${autoNotice}\n\n💎 **Nguyên thạch còn lại**: **${res.remainingJades.toLocaleString()}** | 🎯 **Pity 5★**: **${res.pity5}/90**\n${guaranteedBadge}`)
    .setFooter({ text: `Người quay: ${username} | Chọn các nút bên dưới để tiếp tục quay!` });

  const avatarInfo = getCharAvatarAttachment(res.featuredChar);
  if (avatarInfo.url) embed.setThumbnail(avatarInfo.url);

  let resultLines = [];
  res.results.forEach((r, idx) => {
    if (r.rarity === 5) {
      if (r.item && r.item.type === 'char') {
        const status = r.isNew ? '🆕 [MỚI!]' : `✨ [Tinh Hồn E${r.eidolon}]`;
        const rateTag = r.lostRateUp ? '🔴 [LỆCH RATE 50/50!]' : (r.wonRateUp ? '🌟 [WIN RATE UP!]' : '');
        resultLines.push(`\`${idx + 1}.\` 🌟🌟🌟🌟🌟 **${r.item.name}** (${r.item.element}) ${rateTag} - ${status}`);
      } else {
        const status = r.isNew ? '🆕 [MỚI!]' : `⚔️ [TÍCH CHỒNG S${r.superimpose}]`;
        const subs = (r.weaponObj?.subStats || []).map(s => `${s.name} +${s.value}`).join(', ');
        resultLines.push(`\`${idx + 1}.\` 🌟🌟🌟🌟🌟 **${r.name}** - ${status}\n      🎲 Buff ngẫu nhiên: \`${subs || 'ATK% +5.2%, CRIT Rate% +3.8%'}\``);
      }
    } else if (r.rarity === 4) {
      if (r.item && r.item.type === 'char') {
        const status = r.isNew ? '🆕 [MỚI!]' : `🟣 [Tinh Hồn E${r.eidolon}]`;
        resultLines.push(`\`${idx + 1}.\` ⭐⭐⭐⭐ **${r.item.name}** (${r.item.element}) - ${status}`);
      } else {
        const status = r.isNew ? '🆕 [MỚI!]' : `⚔️ [TÍCH CHỒNG S${r.superimpose}]`;
        const subs = (r.weaponObj?.subStats || []).map(s => `${s.name} +${s.value}`).join(', ');
        resultLines.push(`\`${idx + 1}.\` ⭐⭐⭐⭐ **${r.name}** - ${status}\n      🎲 Buff ngẫu nhiên: \`${subs || 'ATK% +3.2%, SPD +3'}\``);
      }
    } else {
      if (r.item && r.item.type === 'weapon') {
        resultLines.push(`\`${idx + 1}.\` ⚪ ⭐⭐⭐ **${r.name}** (Vũ khí 3★)`);
      } else {
        resultLines.push(`\`${idx + 1}.\` ⚪ 3★ Nón Ánh Sáng Rác (Đã lưu vào Túi đồ)`);
      }
    }
  });

  embed.addFields({ name: '🎁 Vật phẩm thu được:', value: resultLines.join('\n') });

  const payload = { embeds: [embed] };
  if (avatarInfo.attachment) payload.files = [avatarInfo.attachment];
  return payload;
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

  const payload = buildGachaEmbedPayload(interaction.user.username, res, currentBanner);
  payload.components = [buildGachaButtons()];

  const response = await interaction.reply({
    ...payload,
    fetchReply: true
  });

  // STRICT MESSAGE-SPECIFIC COLLECTOR (PER-USER & PER-MESSAGE ISOLATION)
  const collector = response.createMessageComponentCollector({
    filter: i => i.message.id === response.id && i.user.id === interaction.user.id,
    time: 300000
  });

  collector.on('collect', async i => {
    if (i.message.id !== response.id || i.user.id !== interaction.user.id) return;

    const customId = i.customId;

    if (customId === 'gacha_btn_1') {
      await i.deferUpdate().catch(() => {});
      const pullRes = handleGachaPull(interaction.user.id, 1, currentBanner);
      if (!pullRes.success) {
        return i.followUp({ content: pullRes.message, ephemeral: true });
      }
      const newPayload = buildGachaEmbedPayload(interaction.user.username, pullRes, currentBanner);
      newPayload.components = [buildGachaButtons()];
      await i.editReply(newPayload);
    } else if (customId === 'gacha_btn_max') {
      await i.deferUpdate().catch(() => {});
      const pullRes = handleGachaPull(interaction.user.id, 10, currentBanner);
      if (!pullRes.success) {
        return i.followUp({ content: pullRes.message, ephemeral: true });
      }
      const newPayload = buildGachaEmbedPayload(interaction.user.username, pullRes, currentBanner);
      newPayload.components = [buildGachaButtons()];
      await i.editReply(newPayload);
    } else if (customId === 'gacha_btn_change_banner') {
      await i.deferUpdate().catch(() => {});
      const bannerMenu = new StringSelectMenuBuilder()
        .setCustomId('gacha_menu_select_banner')
        .setPlaceholder('Chọn Banner Gacha Muốn Đổi...')
        .addOptions(
          { label: '💜 Banner Acheron 5★ (Lightning - Nihility)', value: 'acheron' },
          { label: '🍇 Banner Kafka 5★ (Lightning - Nihility)', value: 'kafka' },
          { label: '🌟 Banner Seele 5★ (Quantum - Hunt)', value: 'seele' },
          { label: '⚡ Banner Jing Yuan 5★ (Lightning - Erudition)', value: 'jing_yuan' },
          { label: '⚔️ Banner Blade 5★ (Wind - Destruction)', value: 'blade' },
          { label: '👾 Banner Silver Wolf 5★ (Quantum - Nihility)', value: 'silver_wolf' },
          { label: '🌸 Banner Fu Xuan 5★ (Quantum - Preservation)', value: 'fu_xuan' },
          { label: '🌀 Banner Bronya 5★ (Wind - Harmony)', value: 'bronya' },
          { label: '🗡️ Banner Nón Ánh Sáng Vĩnh Cửu 36+', value: 'weapon' }
        );

      const menuRow = new ActionRowBuilder().addComponents(bannerMenu);
      await i.editReply({ components: [menuRow] });
    } else if (customId === 'gacha_menu_select_banner') {
      await i.deferUpdate().catch(() => {});
      currentBanner = i.values[0];
      const pullRes = handleGachaPull(interaction.user.id, 10, currentBanner);

      if (!pullRes.success) {
        return i.followUp({ content: pullRes.message, ephemeral: true });
      }

      const newPayload = buildGachaEmbedPayload(interaction.user.username, pullRes, currentBanner);
      newPayload.components = [buildGachaButtons()];
      await i.editReply(newPayload);
    }
  });
}

module.exports = {
  data: gachaCommand,
  execute: executeGacha
};
