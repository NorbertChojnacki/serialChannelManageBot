const fs = require('fs');
const path = require('path');

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
        let aa = await this._readDir();
        let result = aa.some(dir => dir === `${this.main_model.guildId}.json`)
        return result;
    }

    readGuildFile(setting){
        if(setting?.sync){
            // @ts-ignore
            this.main_model = JSON.parse(fs.readFileSync(path.join(this.dir, `/${this.main_model.guildId}.json`)))
        }else{
            return fs.promises.readFile(path.join(this.dir, `/${this.main_model.guildId}.json`))
        }
    }

    writeGuildFile(){
        fs.promises.writeFile(path.join(this.dir, `/${this.main_model.guildId}.json`), JSON.stringify(this.main_model))
    }

    addElem(val){
        let {id, name, type, parentId} = val
        let value = (type === 'GUILD_VOICE' || type === 'GUILD_TEXT' || type === 'GUILD_CATEGORY' )? 'channel' : 'role';
        let elem = Object.assign({}, this[`${value}_model`]);
        
        elem.id = id
        elem.name = name  
        elem.parentId = parentId;
        elem.type = type;

        if(value === 'role'){
            delete elem.parentId
            delete elem.type
        }
        
        this.main_model[`${value}s`].push(elem);
    }

    /**
     * @param {String} value digit channel/role id or name
     * @param {'channel'|'role'} type 
     */
    removeElem(value, type){
        let store = this.main_model[`${type}s`].filter(channel => channel.name !== value)
        this.main_model[`${type}s`] = store
    }

}

module.exports = StorageHandler;
