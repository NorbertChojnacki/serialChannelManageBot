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
                    .setDescription('Choose allowed to manage channels')
                    .setRequired(true)
                })
            })
            .addSubcommand(sub=>{
                return sub
                .setName('edit')
                .setDescription('Edit Configuration')
                .addRoleOption(option=>{
                    return option
                    .setName('role')
                    .setDescription('Choose new role allowed to manage channels')
                    .setRequired(true)
                })
            })

        ,
        async execute(interaction){
            let name = interaction.options.getSubcommand();
            let content;
            let role = interaction.options.getRole('role');
            let sh = new StorageHandler(role.guild.id)

            if(name === 'init'){
                content = 'config init command already initiated'
                if(!sh.checkGuildFile()){
                    sh.setSudoRole = role.id;
                    sh.writeGuildFile();
                    content = 'config init successfully done'
                }
            }

            if(name === 'edit'){
                sh.setSudoRole = role.id;
                sh.writeGuildFile();
                content = 'role successfully changed'
            }
            
            interaction.reply({content, ephemeral: true})
        }
}