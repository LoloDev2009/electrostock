const {
  SlashCommandBuilder, EmbedBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder,
} = require('discord.js');
const svc = require('../../shared/componentsService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('agregar')
    .setDescription('Agrega un componente al inventario (abre un formulario)'),

  modalCustomId: 'modal-agregar',

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId(this.modalCustomId)
      .setTitle('Nuevo componente');

    const nombre = new TextInputBuilder()
      .setCustomId('nombre')
      .setLabel('Nombre')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('ej: Resistencia 10kΩ 1/4W')
      .setRequired(true);

    const categoria = new TextInputBuilder()
      .setCustomId('categoria')
      .setLabel('Categoría')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('resistencia, ci, conector, sensor...')
      .setRequired(true);

    const cantidad = new TextInputBuilder()
      .setCustomId('cantidad')
      .setLabel('Cantidad')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('ej: 25')
      .setRequired(true);

    const specs = new TextInputBuilder()
      .setCustomId('specs')
      .setLabel('Valor, Voltaje, Tolerancia, Encapsulado')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('ej: 10kΩ, 16V, ±5%, SMD 0805 (separado por comas, opcional)')
      .setRequired(false);

    const ubicacion = new TextInputBuilder()
      .setCustomId('ubicacion')
      .setLabel('Ubicación')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('ej: Gaveta 3B')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nombre),
      new ActionRowBuilder().addComponents(categoria),
      new ActionRowBuilder().addComponents(cantidad),
      new ActionRowBuilder().addComponents(specs),
      new ActionRowBuilder().addComponents(ubicacion),
    );

    await interaction.showModal(modal);
  },

  async handleModal(interaction) {
    const nombre = interaction.fields.getTextInputValue('nombre').trim();
    const categoria = interaction.fields.getTextInputValue('categoria').trim();
    const cantidadRaw = interaction.fields.getTextInputValue('cantidad').trim();
    const specsRaw = interaction.fields.getTextInputValue('specs').trim();
    const ubicacion = interaction.fields.getTextInputValue('ubicacion').trim();

    const cantidad = Number(cantidadRaw);
    if (Number.isNaN(cantidad) || cantidad < 0) {
      return interaction.reply({ content: `"${cantidadRaw}" no es una cantidad válida.`, ephemeral: true });
    }

    const [value_spec, voltage, tolerance, package_type] = specsRaw
      ? specsRaw.split(',').map((s) => s.trim() || undefined)
      : [];

    const creado = await svc.crear({
      name: nombre,
      category: categoria,
      quantity: cantidad,
      value_spec,
      voltage,
      tolerance,
      package_type,
      location: ubicacion || undefined,
    });

    const embed = new EmbedBuilder()
      .setTitle(`✅ Agregado: ${creado.name}`)
      .setColor(0x2ecc71)
      .addFields(
        { name: 'Categoría', value: creado.category, inline: true },
        { name: 'Cantidad', value: String(creado.quantity), inline: true },
        { name: 'ID', value: String(creado.id), inline: true },
      );
    if (creado.value_spec) embed.addFields({ name: 'Valor', value: creado.value_spec, inline: true });
    if (creado.location) embed.addFields({ name: 'Ubicación', value: creado.location, inline: true });

    await interaction.reply({ embeds: [embed] });
  },
};