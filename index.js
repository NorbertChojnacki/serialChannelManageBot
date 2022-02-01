// @ts-ignore
const DiscordJS = require('discord.js');
// @ts-ignore
const { MessageActionRow,MessageEmbed, MessageSelectMenu } = require('discord.js');
// @ts-ignore
const { SlashCommandBuilder } = require('@discordjs/builders');
// @ts-ignore
const {REST} = require('@discordjs/rest');
// @ts-ignore
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
// @ts-ignore
const dotenv = require('dotenv')
dotenv.config()

const client = new DiscordJS.Client({
    intents: [
        DiscordJS.Intents.FLAGS.GUILD_MESSAGES,
        DiscordJS.Intents.FLAGS.GUILD_MEMBERS,
        DiscordJS.Intents.FLAGS.GUILDS
    ]
})

client.once('ready', ()=>{
    console.log('Ready!');
})

//* Requires commands from command folder. Later used in command handler
client.commands = new DiscordJS.Collection();
const commandFiles = fs.readdirSync('./commands');
const Commands = [];

for(let file of commandFiles){
    let command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    Commands.push(command.data.toJSON());
}


//* Reloades command 
const rest = new REST({version: '9'}).setToken(process.env.TOKEN);

(async ()=>{
    try{
        console.log('Started refreshing application (/) commands');

        await rest.put(
            //* reloades commands for testing sever
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            {body: Commands}
        );
        console.log('Successfully reloaded application (/) commands');
    }catch(error){
        console.error(error);
    }
})();

//* Command Handler
client.on('interactionCreate', async interaction=>{
    if(!interaction.isCommand()) return;
    let command = client.commands.get(interaction.commandName);

    if(!command) return;

    try{
        await command.execute(interaction);
    }catch(error){
        console.error(error);
        await interaction.reply({content: "Error occurred", ephemeral:true});
    }
})

client.login(process.env.TOKEN)