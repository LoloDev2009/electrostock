const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const svc = require('../../shared/componentsService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stock-bajo')
    .setDescription('Muestra componentes con cantidad igual o menor al mínimo configurado'),

  async execute(interaction) {
    const items = await svc.stockBajo();

    if (items.length === 0) {
      return interaction.reply('✅ No hay componentes con stock bajo.');
    }

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Stock bajo')
      .setColor(0xe74c3c)
      .setDescription(
        items
          .map((c) => `**#${c.id} ${c.name}** — ${c.quantity}/${c.min_quantity} un.`)
          .join('\n')
      );

    await interaction.reply({ embeds: [embed] });
  },
};
