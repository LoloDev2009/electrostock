const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const svc = require('../shared/componentsService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buscar')
    .setDescription('Busca componentes por nombre, valor o número de parte')
    .addStringOption((o) => o.setName('termino').setDescription('Texto a buscar').setRequired(true)),

  async execute(interaction) {
    const termino = interaction.options.getString('termino');
    const items = await svc.listar({ search: termino, limit: 15 });

    if (items.length === 0) {
      return interaction.reply(`No se encontraron resultados para "${termino}".`);
    }

    const embed = new EmbedBuilder()
      .setTitle(`🔍 Resultados para "${termino}"`)
      .setColor(0x9b59b6)
      .setDescription(
        items
          .map((c) => `**#${c.id} ${c.name}** — ${c.quantity} un. — cat: ${c.category}`)
          .join('\n')
      );

    await interaction.reply({ embeds: [embed] });
  },
};
