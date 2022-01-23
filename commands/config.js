// @ts-ignore
const {SlashCommandBuilder, SlashCommandSubcommandBuilder} = require('@discordjs/builders');
// @ts-ignore
const {CategoryChannel, Permissions, Interaction} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
            .setName('config')
            .setDescription('Administrative config commands')

        ,
        async execute(interaction){
            interaction.reply({content: 'config', ephemeral: true})
        }
}