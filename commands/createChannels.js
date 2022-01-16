const {SlashCommandBuilder, SlashCommandSubcommandBuilder} = require('@discordjs/builders');
const {CategoryChannel, Permissions, Interaction} = require('discord.js');
const wait = require('util').promisify(setTimeout);

class SubCom{
    constructor(name, desc){
        this.sub = new SlashCommandSubcommandBuilder();
        this.sub.setName(name);
        this.sub.setDescription(desc);
    }

    get getSubCom(){
        return this.sub;
    }
}

class Inline extends SubCom{
    constructor(){
        super('inline','Creates channels in simple line command');

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
            .addBooleanOption(option =>{
                return option
                    .setName('create_shared_text_channel')
                    .setDescription('Do you want to create shared text channel for your groups?')
                    .setRequired(false)
            })
    }
    
    /**
     * 
     * @param {Interaction} interaction 
     */
    async respond(interaction){
        await interaction.reply({content:'inline', ephemeral: true});

        this.catchValues(interaction)

        this.doWhatHaveTo(interaction)
    }

    catchValues({options}){
        this.values = new Object();

        options._hoistedOptions.forEach(val=>{
            this.values[val.name] = val.value;
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
             * @param {creationForCallback}
             */
            callback(`${num}-${name}`);
        }
    }

    /**
     * 
     * @param {Interaction} interaction 
     * @returns {Array}
     */
    async getRoles(interaction){
        let roles = interaction.guild.roles;
    
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

    async doWhatHaveTo(interaction){
        let channels = interaction.guild.channels;
        let roles = interaction.guild.roles;

        let {id} = this.values.create_folder ? await channels.create(this.values.channel_name, {type: 'GUILD_CATEGORY'}) : {id: null};

        let allRoles = await this.getRoles(interaction);


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

        if(this.values.create_folder){
            channels.create('get-role', {
                parent: id,
                type: 'GUILD_TEXT',
                permissionOverwrites:[{
                    id: roles.everyone.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL]
                }]
            })
        }

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

class Setup extends SubCom{
    constructor(){
        super('setup','Creates channels simply step by step with description');
    }
    
    respond(interaction){
        interaction.reply('setup')
    }
}

const subCommands = {
    setup: new Setup(),
    inline: new Inline()
}

module.exports = {
    data: new SlashCommandBuilder()
            .setName('createchannels')
            .setDescription('Creates serial channels with given options')
            .addSubcommand(subCommands.inline.getSubCom)
            .addSubcommand(subCommands.setup.getSubCom)
,
        async execute(interaction){
            let respond = 'null';

            let name = interaction.options.getSubcommand();

            if(name === 'inline'){
                subCommands.inline.respond(interaction); 
                // subCommands.inline.doWhatHaveTo(interaction);
            }
            if(name === 'setup') subCommands.setup.respond(interaction);

            
        }
}