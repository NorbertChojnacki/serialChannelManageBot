// @ts-ignore
const {SlashCommandBuilder, SlashCommandSubcommandBuilder} = require('@discordjs/builders');
// @ts-ignore
const {CategoryChannel, Permissions, Interaction} = require('discord.js');

const StorageHandler = require(require('path').join(__dirname, '../src/storageHandler.js'))

class SubCom{
    constructor(name, desc){
        this.sub = new SlashCommandSubcommandBuilder();
        this.sub.setName(name);
        this.sub.setDescription(desc);
        this.values = {}
    }

    get getSubCom(){
        return this.sub;
    }

    /**
     * @param {Interaction} interaction 
     */
    async respond(interaction){
        await interaction.reply({content:'inline', ephemeral: true});

        this.inter = interaction;
        this.guild = this.inter.guild
        this.catchValues()
        this.doWhatHaveTo()
    }

    catchValues(){
        let {options} = this.inter;

        options._hoistedOptions.forEach(val=>{
            this.values[val.name] = val.value;
        })
    }

    doWhatHaveTo(){

    }

}

class Create extends SubCom{
    constructor(){
        super('create','Creates channels');

        //* Creating subcommand 
        this.sub
            .addStringOption(option => {
                return option
                    .setName('channel_name')
                    .setDescription('Write down name for your channels and folder (if chosen)')
                    .setRequired(true)
            })
            .addIntegerOption(option => {
                return option
                    .setName('channel_quantity')
                    .setDescription('How many channels you want to create (from 1 to 50)')
                    .setMinValue(1)
                    .setMaxValue(50)
                    .setRequired(true)
            })
            .addBooleanOption(option =>{
                return option
                    .setName('create_folder')
                    .setDescription('Do you want to put all your created channels in dedicated folder?')
                    .setRequired(true)
            })
            .addStringOption(option =>{
                return option
                    .setName('what_channels')
                    .setDescription('What channels you wish to create?')
                    .addChoice('Text Channel', 'GUILD_TEXT')
                    .addChoice('Voice Channel', 'GUILD_VOICE')
                    .addChoice('Both', 'BOTH')
                    .setRequired(true)
            })
            .addBooleanOption(option=>{
                return option
                    .setName('start_from_zero')
                    .setDescription('Do you want want to start from zero?')
                    .setRequired(false)
            })
            .addStringOption(option =>{
                return option
                    .setName('create_shared_channel')
                    .setDescription('Do you want to create shared channel(s) for your groups?')
                    .addChoice('Text Channel', 'GUILD_TEXT')
                    .addChoice('Voice Channel', 'GUILD_VOICE')
                    .addChoice('Both', 'BOTH')
                    .setRequired(false)
            })
    }

    /**
     * Returns changing name
     * @callback creationForCallback
     * @param {string} callback
     */
    creationFor(callback){
        let name = this.values.channel_name;
        let x = !this.values?.start_from_zero ? 1 : 0;

        for(let i = 0 + x; i < this.values.channel_quantity + x; i++){
            let num =  i < 10 ? `0${i}`: i;

            /**
             * @param {creationForCallback} callback
             */
            callback(`${num}-${name}`);
        }
    }

    /**
     * @returns {Promise<Array>}
     */
    async getRoles(){
        let roles = this.guild.roles;
    
        this.creationFor(name=>{
            roles.create({
                name,
                color: 'RANDOM',
                reason: 'role manage bot'
            });
        })

        let regex = new RegExp(`\\d\\d\-${this.values.channel_name}`)
        let allRoles = await roles.fetch();
        let createdRoles = allRoles.filter(elem => {
            if(regex.test(elem.name)){
                delete elem.guild;
                return elem;
            }
        })

        allRoles = {};
        createdRoles.forEach(elem=>{
            allRoles[elem.name] = elem.id;
        })

        return allRoles;
    }

    async doWhatHaveTo(){
        let channels = this.guild.channels;
        let roles = this.guild.roles;

        let {id} = this.values.create_folder ? await channels.create(this.values.channel_name, {type: 'GUILD_CATEGORY'}) : {id: null};

        let allRoles = await this.getRoles();

        /**
         * Creates channel
         * @param {string} name channel name
         * @param {string} type channel type
         * @param {string|number} roleId role id that gets the permission
         * @returns {Promise<Void>} Return Promise that resolves
         */
        function createChannel(name, type, roleId){
            return Promise.resolve().then(v=>{
                channels.create(name,{
                    parent: id,
                    type,
                    permissionOverwrites:[
                        {
                            id: roleId,
                            allow: [Permissions.FLAGS.VIEW_CHANNEL]
                        },
                        {
                            id: roles.everyone.id,
                            deny: [Permissions.FLAGS.VIEW_CHANNEL]
                        }
                    ]
                })
            })
        }

        //* get-role channel creation
        if(this.values.create_folder){
            channels.create(`get-role-${this.values.channel_name}`, {
                parent: id,
                type: 'GUILD_TEXT',
                permissionOverwrites:[{
                    id: roles.everyone.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL]
                }]
            }).then(channel=>{
                channel.send({embeds: [{
                    color: 'PURPLE',
                    title: 'Groups you can join',
                    description: 'To get role just type: /join group_number-group_name',
                    fields:[
                        {
                            name: `example`,
                            value: `/join ${this.values?.start_from_zero ? '00' : '01'}-${this.values.channel_name}`,
                            inline: false
                        },
                        {
                            name: `available number of groups`,
                            value: `${this.values.channel_quantity}`,
                            inline: false
                        },
                        {
                            name: `name of the group`,
                            value: `${this.values.channel_name}`,
                            inline: false
                        },
                        {
                            name: `lowest channel number`,
                            value: `${this.values?.start_from_zero ? '00' : '01'}`,
                            inline: false
                        }
                    ]
                }]})
            }).catch(console.error)
        }

        //* Shared channel creation
        if(this.values?.create_shared_channel !== "BOTH" && this.values?.create_shared_channel){
            console.log('shared', this.values?.create_shared_channel)
            channels.create(`coop-channel-${this.values.channel_name}`,{
                parent: id,
                type: this.values.create_shared_channel,
                permissionOverwrites:[{
                    id: roles.everyone.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL]
                }]
            })
        }else if(this.values?.create_shared_channel === 'BOTH'){
            channels.create(`coop-channel-${this.values.channel_name}`,{
                parent: id,
                type: "GUILD_VOICE",
                permissionOverwrites:[{
                    id: roles.everyone.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL]
                }]
            })
            channels.create(`coop-channel-${this.values.channel_name}`,{
                parent: id,
                type: "GUILD_TEXT",
                permissionOverwrites:[{
                    id: roles.everyone.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL]
                }]
            })
        }

        //* creating all wanted channels
        this.creationFor(name=>{
            if(this.values.what_channels !== 'BOTH'){
                createChannel(name, this.values.what_channels, allRoles[name])
            }else{
                createChannel(name, 'GUILD_TEXT', allRoles[name])
                createChannel(name, 'GUILD_VOICE', allRoles[name])
            }
        })

    }
}

class Delete extends SubCom{
    constructor(){
        super('delete', 'Deletes chosen channels or categories')
    }

    async doWhatHaveTo(){

    }
}

const subCommands = {
    create: new Create(),
    delete: new Delete()
}

module.exports = {
    data: new SlashCommandBuilder()
            .setName('channels')
            .setDescription('Manages channels')
            .addSubcommand(subCommands.create.getSubCom)
        ,
        async execute(interaction){

            let sh = new StorageHandler(interaction.guildId)

            if(sh.checkGuildFile()){
                let name = interaction.options.getSubcommand();
                
                if(subCommands[name]) subCommands[name].respond(interaction);
                 
            }else{
                interaction.reply({content:'Please run /config init command before going any further', ephemeral: true})
            }
   
        }
}