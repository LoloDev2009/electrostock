const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const svc = require('../../shared/componentsService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('agregar')
    .setDescription('Agrega un componente al inventario')
    .addStringOption((o) => o.setName('nombre').setDescription('Nombre del componente').setRequired(true))
    .addStringOption((o) => o.setName('categoria').setDescription('Categoría (ej: resistencia, ci, conector)').setRequired(true))
    .addIntegerOption((o) => o.setName('cantidad').setDescription('Cantidad disponible').setRequired(true))
    .addStringOption((o) => o.setName('valor').setDescription('Valor/spec (ej: 10kΩ, 100µF)'))
    .addStringOption((o) => o.setName('voltaje').setDescription('Voltaje (ej: 16V)'))
    .addStringOption((o) => o.setName('tolerancia').setDescription('Tolerancia (ej: ±5%)'))
    .addStringOption((o) => o.setName('encapsulado').setDescription('Encapsulado (ej: SMD 0805, DIP-8)'))
    .addStringOption((o) => o.setName('ubicacion').setDescription('Ubicación física'))
    .addIntegerOption((o) => o.setName('minimo').setDescription('Cantidad mínima antes de alerta de stock bajo'))
    .addStringOption((o) => o.setName('notas').setDescription('Notas adicionales')),

  async execute(interaction) {
    const datos = {
      name: interaction.options.getString('nombre'),
      category: interaction.options.getString('categoria'),
      quantity: interaction.options.getInteger('cantidad'),
      value_spec: interaction.options.getString('valor') || undefined,
      voltage: interaction.options.getString('voltaje') || undefined,
      tolerance: interaction.options.getString('tolerancia') || undefined,
      package_type: interaction.options.getString('encapsulado') || undefined,
      location: interaction.options.getString('ubicacion') || undefined,
      min_quantity: interaction.options.getInteger('minimo') || undefined,
      notes: interaction.options.getString('notas') || undefined,
    };

    const creado = await svc.crear(datos);

    const embed = new EmbedBuilder()
      .setTitle(`✅ Agregado: ${creado.name}`)
      .setColor(0x2ecc71)
      .addFields(
        { name: 'Categoría', value: creado.category, inline: true },
        { name: 'Cantidad', value: String(creado.quantity), inline: true },
        { name: 'ID', value: String(creado.id), inline: true }
      );
    if (creado.value_spec) embed.addFields({ name: 'Valor', value: creado.value_spec, inline: true });
    if (creado.location) embed.addFields({ name: 'Ubicación', value: creado.location, inline: true });

    await interaction.reply({ embeds: [embed] });
  },
};
