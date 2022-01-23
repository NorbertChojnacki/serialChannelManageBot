const fs = require('fs');
const path = require('path');

// @ts-ignore
const dotenv = require('dotenv')
dotenv.config()

class StorageHandler{

    #main_model = {
        guildId: null,
        sudo_role: null,
        channels: []
    }

    #channel_model = {
        id: null,
        parentId: null,
        name: null,
        type: null
    }

    #dir = path.join(__dirname, '../data');

    constructor(guildId = null){
        this.#main_model.guildId = guildId;
    }

    set setGuildId(guildId){
        this.#main_model.guildId = guildId;
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

    #createGuildFile(){
        if(!this.checkGuildFile()) fs.writeFileSync(this.#dir, JSON.stringify(this.#main_model))
    }

    #readGuildFile(){
        return fs.promises.readFile(this.#dir);
    }

    writeGuildFile(){
        fs.promises.writeFile(this.#dir, JSON.stringify(this.#main_model))
    }

    addChanel(id, name, type,parentId){
        let channel = Object.assign({}, this.#channel_model)
        
        channel[id] = id
        channel[parentId] = parentId
        channel[name] = name
        channel[type] = type
        
        this.#main_model.channels.push(channel);
    }

    removeChannel(name){
        this.#main_model.channels = this.#main_model.channels.filter(channel => channel.name !== name)
    }
}

module.exports = StorageHandler;