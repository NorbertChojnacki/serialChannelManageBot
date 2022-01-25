const fs = require('fs');
const path = require('path');

// @ts-ignore
const dotenv = require('dotenv');
const { resolveSoa } = require('dns');
dotenv.config()

class StorageHandler{

    main_model = {
        guildId: null,
        sudo_role: null,
        channels: [],
        roles: []
    }

    channel_model = {
        id: null,
        parentId: null,
        name: null,
        type: null
    }

    role_model = {
        id: null,
        name: null
    }

    dir = path.join(__dirname, '../data');

    constructor(guildId = null){
        this.main_model.guildId = guildId;

        this.checkGuildFile().then(res=>{
            if(res){
            this.readGuildFile().then(val=>{
                // @ts-ignore
                this.main_model = JSON.parse(val);
            })
        }
        })

    }

    set setGuildId(guildId){
        this.main_model.guildId = guildId;
    }

    set setSudoRole(roleId){
        this.main_model.sudo_role = roleId;
    }

    /**
     * @returns {Promise<String[]>} array contains elements that are in the directory
     */
    async _readDir(){
        return await fs.promises.readdir(this.dir);
    }

    /**
     * @returns {Promise<boolean>} if guild file exists returns true, otherwise false
     */
    async checkGuildFile(){
        let result = false;
        let aa = await this._readDir();
        
        return aa.some(dir => dir === `${this.main_model.guildId}.json`);
    }

    readGuildFile(){
        return fs.promises.readFile(path.join(this.dir, `/${this.main_model.guildId}.json`));
    }

    writeGuildFile(){
        fs.promises.writeFile(path.join(this.dir, `/${this.main_model.guildId}.json`), JSON.stringify(this.main_model))
    }

    /**
     * @param {*} id 
     * @param {*} name 
     * @param {Object=} param2
     */
    addElem(id, name, {type = null, parentId = null}){
        let value = type === null ? 'role' : 'channel';
        let elem = Object.assign({}, this[`${value}_model`]);
        
        elem.id = id
        elem.name = name
        
        if(elem?.parentId) elem.parentId = parentId;
        if(elem?.type) elem.type = type;
        
        this.main_model[`${value}s`].push(elem);
    }

    abc(){
        console.log('asdf')
    }

    /**
     * @param {String} value digit channel/role id or name
     * @param {'channel'|'role'} type 
     */
    removeElem(value, type){
        this.main_model[`${type}s`] = this.main_model[`${type}s`].filter(channel => channel.name !== value || channel.id !== value)
    }

    channelProcess(channel){
        this.addElem(channel.id, channel.name, {type: channel.type, parentId: channel.parentId})
    }

    roleProcess(role){
        console.log(this)
        this.addElem(role.id, role.name)
    }
}

module.exports = StorageHandler;

// let sh = new StorageHandler()

// sh.channelProcess({id: 12, name: 'test', type:'text', parentId: 10 })