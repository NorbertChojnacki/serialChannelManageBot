// @ts-ignore
const {SlashCommandBuilder, SlashCommandSubcommandBuilder} = require('@discordjs/builders');
// @ts-ignore
const {CategoryChannel, Permissions, Interaction} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Command to join group')
        .addStringOption(option =>{
            return option
            .setName('role_name')
            .setDescription('Channel name you want to join')
            .setRequired(true)
        })
        ,
        async execute(interaction){
            const member = interaction.member.roles.cache;
            const allRoles = interaction.guild.roles.cache;
            const roleName = interaction.options.getString('role_name');
            this.respond = "Done :D";
            try{
                let regex = new RegExp(`\\d\\d\-.*`)
                if(!regex.test(roleName)) throw new Error('do_not_match_pattern');
                if(!allRoles.some(elem => elem.name === roleName)) throw new Error('role_do_not_exist');  
                if(member.some(role => role.name === roleName)) throw new Error('user_has_role');

                let role = allRoles.filter(elem => elem.name === roleName)
                interaction.member.roles.add(role.firstKey())
                
            }catch(error){
                switch(error.message){
                    case 'do_not_match_pattern': this.respond = 'Given group does not match our pattern.'; break;
                    case 'user_has_role': this.respond = "User already is in the group."; break;
                    case 'role_do_not_exist': this.respond = "Given group does not match existing ones."; break;
                    default: this.respond = "Another error"; console.log(error.message);
                }
            }finally{

                interaction.reply({content: this.respond, ephemeral: true});
            } 
        }
}