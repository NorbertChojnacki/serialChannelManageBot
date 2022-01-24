const fs = require('fs');
const path = require('path');

// @ts-ignore
const dotenv = require('dotenv');
const { resolveSoa } = require('dns');
dotenv.config()

class StorageHandler{

    #main_model = {
        guildId: null,
        sudo_role: null,
        channels: [],
        roles: []
    }

    #channel_model = {
        id: null,
        parentId: null,
        name: null,
        type: null
    }

    #role_model = {
        id: null,
        name: null
    }

    #dir = path.join(__dirname, '../data');

    constructor(guildId = null){
        this.#main_model.guildId = guildId;

        if(this.checkGuildFile()){
            this.readGuildFile().then(val=>{
                // @ts-ignore
                this.#main_model = JSON.parse(val);
            })
        }
    }

    set setGuildId(guildId){
        this.#main_model.guildId = guildId;
    }

    set setSudoRole(roleId){
        this.#main_model.sudo_role = roleId;
    }

    /**
     * @returns {Promise<String[]>} array contains elements that are in the directory
     */
    async _readDir(){
        return await fs.promises.readdir(this.#dir);
    }

    /**
     * @returns {boolean} if guild file exists returns true, otherwise false
     */
    checkGuildFile(){
        let result = false;
        this._readDir().then(res=>{
            if(res.some(dir => dir === `${this.#main_model.guildId}.json`)) result = true;
        })

        return process.env.DEVELOPMENT_STATUS === 'True'? true : result;
    }

    readGuildFile(){
        return fs.promises.readFile(path.join(this.#dir, `/${this.#main_model.guildId}`));
    }

    writeGuildFile(){
        fs.promises.writeFile(path.join(this.#dir, `/${this.#main_model.guildId}.json`), JSON.stringify(this.#main_model))
    }

    /**
     * @param {*} id 
     * @param {*} name 
     * @param {Object=} param2
     */
    add(id, name, {type = null, parentId = null}){
        let value = type === null ? 'role' : 'channel';
        let elem = Object.assign({}, this[`#${value}_model`]);
        
        elem.id = id
        elem.name = name
        
        if(elem?.parentId) elem.parentId = parentId;
        if(elem?.type) elem.type = type;
        
        this.#main_model[value].push(elem);
    }

    /**
     * @param {String} value digit channel/role id or name
     * @param {'channel'|'role'} type 
     */
    remove(value, type){
        this.#main_model[`${type}s`] = this.#main_model[`${type}s`].filter(channel => channel.name !== value || channel.id !== value)
    }

    /**
     * TODO: stworzyć metode ktora zajmie sie wyciaganiem danych z callbacka then przy tworzeniu kanalow
     */
    channelProcess(){

    }
}

module.exports = StorageHandler;