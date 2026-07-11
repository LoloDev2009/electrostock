const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const svc = require('../../shared/componentsService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('actualizar')
    .setDescription('Ajusta la cantidad de un componente (suma o resta)')
    .addIntegerOption((o) => o.setName('id').setDescription('ID del componente').setRequired(true))
    .addIntegerOption((o) => o.setName('delta').setDescription('Cantidad a sumar (usa negativo para restar)').setRequired(true)),

  async execute(interaction) {
    const id = interaction.options.getInteger('id');
    const delta = interaction.options.getInteger('delta');

    const actualizado = await svc.ajustarCantidad(id, delta);
    if (!actualizado) {
      return interaction.reply({ content: `No existe un componente con ID ${id}.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`🔄 ${actualizado.name}`)
      .setColor(0xf39c12)
      .setDescription(`Nueva cantidad: **${actualizado.quantity}** (${delta >= 0 ? '+' : ''}${delta})`);

    await interaction.reply({ embeds: [embed] });
  },
};
