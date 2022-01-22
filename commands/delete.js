// @ts-ignore
const {SlashCommandBuilder, SlashCommandSubcommandBuilder} = require('@discordjs/builders');
// @ts-ignore
const {CategoryChannel, Permissions, Interaction} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete')
        .setDescription('Command to delete group')
        .addStringOption(option =>{
            return option
            .setName('group_name')
            .setDescription('Channel name you want to delete')
            .setRequired(true)
        })
        , async execut(interacton){
            
        }
    }