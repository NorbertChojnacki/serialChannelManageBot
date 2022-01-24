// @ts-ignore
const {SlashCommandBuilder, SlashCommandSubcommandBuilder} = require('@discordjs/builders');
// @ts-ignore
const {CategoryChannel, Permissions, Interaction} = require('discord.js');

const StorageHandler = require(require('path').join(__dirname, '../src/storageHandler.js'))

module.exports = {
    data: new SlashCommandBuilder()
            .setName('config')
            .setDescription('Administrative config commands')
            .addSubcommand(sub=>{
                return sub
                .setName('init')
                .setDescription('Initialize configuration')
                .addRoleOption(option=>{
                    return option
                    .setName('role')
                    .setDescription('Choose role you want to be the primary one')
                    .setRequired(true)
                })
            })

        ,
        async execute(interaction){
            let name = interaction.options.getSubcommand();
            let content;

            if(name === 'init'){
                let role = interaction.options.getRole('role');
                let sh = new StorageHandler(role.guild.id)
                content = 'config init command already initiated'

                if(!sh.checkGuildFile()){
                    sh.setSudoRole = role.id;
                    sh.writeGuildFile();
                    content = 'config init successfully done'
                }
            }
            
            interaction.reply({content, ephemeral: true})
        }
}