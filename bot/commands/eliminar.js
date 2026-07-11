const { SlashCommandBuilder } = require('discord.js');
const svc = require('../../shared/componentsService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('eliminar')
    .setDescription('Elimina un componente del inventario')
    .addIntegerOption((o) => o.setName('id').setDescription('ID del componente').setRequired(true)),

  async execute(interaction) {
    const id = interaction.options.getInteger('id');
    const eliminado = await svc.eliminar(id);

    if (!eliminado) {
      return interaction.reply({ content: `No existe un componente con ID ${id}.`, ephemeral: true });
    }

    await interaction.reply(`🗑️ Eliminado: **${eliminado.name}** (ID ${id})`);
  },
};
