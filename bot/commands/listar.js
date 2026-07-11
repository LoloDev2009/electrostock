const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const svc = require('../../shared/componentsService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listar')
    .setDescription('Lista componentes del inventario')
    .addStringOption((o) => o.setName('categoria').setDescription('Filtrar por categoría')),

  async execute(interaction) {
    const categoria = interaction.options.getString('categoria');
    const items = await svc.listar({ category: categoria, limit: 25 });

    if (items.length === 0) {
      return interaction.reply('No se encontraron componentes.');
    }

    const embed = new EmbedBuilder()
      .setTitle(categoria ? `📦 Inventario — ${categoria}` : '📦 Inventario (primeros 25)')
      .setColor(0x3498db)
      .setDescription(
        items
          .map((c) => `**#${c.id} ${c.name}** — ${c.quantity} un. ${c.value_spec ? `(${c.value_spec})` : ''} ${c.location ? `📍 ${c.location}` : ''}`)
          .join('\n')
      );

    await interaction.reply({ embeds: [embed] });
  },
};
