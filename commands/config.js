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
            let name = interaction.options.getSubcommand()
            let content = null
            let role = interaction.options.getRole('role')
            let sh = new StorageHandler(role.guild.id)

            try{
                if(!['init', 'edit'].includes(name)) throw new Error('com_not_exist') // checks if command exists
                if(sh.checkGuildFile() && name === 'init') throw new Error('init_done') // checks if file exists and /config init was typed
                if(!sh.checkGuildFile() && name === 'edit') throw new Error('init_not_done') // checks if file NOT exists and /config edit was typed
                if(interaction.guild.ownerId !== interaction.member.id) throw new Error('not_permission') // checks if user has permission to run this script(must be owner)
                if(sh.checkGuildFile()) sh.readGuildFile({sync: true}) // loads config file if exists

                sh.setSudoRole = role.id
                sh.writeGuildFile()
                content = 'sudo role successfully set'
            }catch(error){
                switch(error.message){
                    case 'com_not_exist': content = 'wrong command'; break;
                    case 'init_done': content = "config already initialized"; break;
                    case 'init_not_done': content = 'config not initialized, run /config init'; break;
                    case 'not_permission': content = 'to run this command you must be server admin'; break;
                    default: content = 'Error Occured'; console.error(error.message);
                }
            }finally{
                interaction.reply({content, ephemeral: true})
            }
        }
}