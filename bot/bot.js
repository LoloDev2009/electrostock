const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

const commandsParaRegistrar = [];
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
  commandsParaRegistrar.push(command.data.toJSON());
}

client.once('ready', () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
    } else if (interaction.isModalSubmit()) {
      const command = [...client.commands.values()].find((c) => c.modalCustomId === interaction.customId);
      if (!command || !command.handleModal) return;
      await command.handleModal(interaction);
    }
  } catch (err) {
    console.error(err);
    const mensaje = { content: 'Hubo un error al procesar la interacción.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(mensaje);
    } else {
      await interaction.reply(mensaje);
    }
  }
});

// Registra los slash commands en el servidor (guild) configurado
async function registrarComandos() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log('Registrando slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
      { body: commandsParaRegistrar }
    );
    console.log('Slash commands registrados correctamente.');
  } catch (err) {
    console.error('Error registrando comandos:', err);
  }
}

registrarComandos().then(() => client.login(process.env.DISCORD_TOKEN));