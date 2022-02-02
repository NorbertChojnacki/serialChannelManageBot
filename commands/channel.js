// @ts-ignore
const {SlashCommandBuilder, SlashCommandSubcommandBuilder} = require('@discordjs/builders');
// @ts-ignore
const { channel } = require('diagnostics_channel');
// @ts-ignore
// @ts-ignore
const {CategoryChannel, Permissions, Interaction} = require('discord.js');
// @ts-ignore
const { SHARE_ENV } = require('worker_threads');

const StorageHandler = require(require('path').join(__dirname, '../src/storageHandler.js'))

let sh = new StorageHandler()
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
        this.inter = interaction;
        this.guild = this.inter.guild

        sh.setGuildId = interaction.guild.id
        let content = 'channel management'
        try{
                if(!sh.checkGuildFile()) throw new Error('not_init') // checks if config file exists
                sh.readGuildFile({sync:true})
                
                if(interaction.guild.ownerId !== interaction.member.id || interaction.member.roles.cache.some(elem => elem.id === sh.main_model.sudo_role)) throw new Error('not_permission'); //checks if user has permission to run this command ( must be owner or role must be in config file)

                this.catchValues()
                this.doWhatHaveTo()
            
        }catch(error){
            switch(error.message){
                case 'not_init': content = 'Please run /config init command before going any further'; break;
                case 'not_permission': content = "You don't have permission to run this command"; break;
                default: content = "Error occurred"; break;
            }
        }finally{
            await interaction.reply({content, ephemeral: true});
        }     
    }

    catchValues(){
        let {options} = this.inter;

        options._hoistedOptions.forEach(val=>{
            this.values[val.name] = val.value;
        })
    }

    async doWhatHaveTo(){}
}

class Create extends SubCom{
    constructor(){
        super('create','Creates channels');
        this.channelsToPromise = []

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
            }).then(role=> sh.addElem(role))
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

        let bot = this.inter.guild.members.cache.filter(user =>user.user.id === this.inter.client.user.id)
        this.bot_role = bot.first()._roles[0]

        let val = this.values.create_folder ? await channels.create(this.values.channel_name, {type: 'GUILD_CATEGORY'}) : {id: null};

        let {id} = val
        val.type = 'GUILD_CATEGORY'
        if(id !== null) sh.addElem(val);

        let allRoles = await this.getRoles();

        /**
         * Creates channel
         * @param {string} name channel name
         * @param {string} type channel type
         *
         */
        async function createChannel(name, type, permissionOverwrites){
            // @ts-ignore
            return new Promise((resolve, reject)=>{
                let retVal = channels.create(name,{
                    parent: id,
                    type,
                    permissionOverwrites
                })
                resolve(retVal)
            })
        }

        //* get-role channel creation
        if(this.values.create_folder){
            createChannel(`get-role-${this.values.channel_name}`,'GUILD_TEXT', [{
                    id: roles.everyone.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL]
                }]).then(channel=>{
                    channel.type = 'GUILD_TEXT'
                    sh.addElem(channel)
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
        let permits = [{
                    id: roles.everyone.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL]
                },{
                    id: this.bot_role,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL]
                }]
        if(this.values?.create_shared_channel !== "BOTH" && this.values?.create_shared_channel){
            this.channelsToPromise.push(createChannel(`coop-channel-${this.values.channel_name}`,this.values.create_shared_channel, permits));
        }else if(this.values?.create_shared_channel === 'BOTH'){
            this.channelsToPromise.push(createChannel(`coop-channel-${this.values.channel_name}`,"GUILD_VOICE", permits));
            this.channelsToPromise.push(createChannel(`coop-channel-${this.values.channel_name}`,"GUILD_TEXT", permits));
        }

        //* creating all wanted channels
        this.creationFor(name=>{
            let permits = [
                        {
                            id: allRoles[name],
                            allow: [Permissions.FLAGS.VIEW_CHANNEL]
                        },
                        {
                            id: roles.everyone.id,
                            deny: [Permissions.FLAGS.VIEW_CHANNEL]
                        },
                        {
                            id: this.bot_role,
                            allow: [Permissions.FLAGS.VIEW_CHANNEL]
                        }
                    ];
            if(this.values.what_channels !== 'BOTH'){
                this.channelsToPromise.push(createChannel(name, this.values.what_channels,permits ))
            }else{
                this.channelsToPromise.push(createChannel(name, 'GUILD_TEXT', permits))
                this.channelsToPromise.push(createChannel(name, 'GUILD_VOICE', permits))
            }
        })
        Promise.allSettled(this.channelsToPromise).then(results =>{
            results.forEach(index=>{
                // @ts-ignore
                sh.addElem(index.value)
            })
            sh.writeGuildFile();
        }
            
        ).catch(console.error)
    }
}

class Delete extends SubCom{
    constructor(){
        super('delete', 'Deletes choosen channels or categories')

        this.sub
            .addStringOption(option => {
                return option
                    .setName('channel_name')
                    .setDescription('Provide channel to be deleted')
                    .setRequired(true)
            })
    }

    async doWhatHaveTo(){
        // @ts-ignore
        let content = 'successfully deleted'
        try{
            let regex = new RegExp(this.values.channel_name)

            // @ts-ignore
            let roleManage = new Promise((res,rej)=>{
                sh.main_model.roles.forEach(elem => {
                    if(regex.test(elem.name)) this.inter.guild.roles.delete(elem.id)
                })
                let ret = sh.main_model.roles.filter(role => regex.test(role.name));
                res(['role', ret])
            })
            
            let channelManage = new Promise((res, rej)=>{
                let test = this.inter.guild.channels.cache.filter(channel => regex.test(channel.name))

                sh.main_model.channels.forEach(elem => {
                    if(regex.test(elem.name)){
                        test.forEach(channel => {
                            if(channel.id === elem.id) channel.delete()
                        });
                    }
                });
                
                let ret = sh.main_model.channels.filter(channel => regex.test(channel.name))
                res(['channel', ret])
            })
            
            Promise.allSettled([roleManage,channelManage]).then(res=>{

                res.forEach(key=>{
                    // @ts-ignore
                    key?.value[1].forEach(element => {
                        // @ts-ignore
                        sh.removeElem(element.name, key?.value[0])
                    });
                })
                sh.writeGuildFile();
            }).catch(err=>{
                console.error(err)
                throw new Error(err.message)
            })
        }catch(error){
            console.error(error.message)
        }
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
            .addSubcommand(subCommands.delete.getSubCom)
        ,
        async execute(interaction){   
            let name = interaction.options.getSubcommand()
        
            if(subCommands[name]) subCommands[name].respond(interaction)
        }
}