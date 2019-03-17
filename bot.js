const version = '0.4'

// Import packages
const discord = require('discord.js')
const fetch = require('node-fetch')
const vm2 = require('vm2')
const fs = require('fs')

// Load configs
let config = require('./config.json')
let { token, imgur } = require('./auth.json')

// Initialize discord client
const client = new discord.Client()

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
})

function isAdmin(member) {
    return config.adminRoles.some(role => member.roles.has(role))
}

let allowedConfigs = [
    'prefix',
    'welcomeChannel',
    'firstRole',
]

function parseSnowflake(str) {
    let snowflakeReg = /<@\d+>/g
    let snow = snowflakeReg.exec(str)
    if (snow[1]) {
        return snow[1]
        // Snowflake
    } else if (str.match(/^\d+$/g)) {
        return str
    } else {
        return null
    }
}

function getMember(guild, str) {
    let id = parseMember(str)
    if (id) {
        let member = guild.members.get(id)
        if (member) {
            return member
        }
    }
}

function handleCommand({ channel, guild, member }, command) {
    let [cmd, ...args] = command.split(/ +/g)
    cmd = cmd.toLowerCase()

    if (cmd === 'ping') {
        channel.send('boop')
    } else if (cmd === 'meme') {
        let randomMeme = new discord.Attachment('https://cdn.discordapp.com/attachments/536262351423537162/536264377985269781/1520541096839.jpg')
        channel.send(randomMeme)
    } else if (cmd === 'doggo' || cmd === 'dog') {
        fetch('https://api.imgur.com/3/album/rjpOa3A', {
            headers: {
                'Authorization': `Client-ID ${imgur.id}`
            }
        })
            .then(data => data.json())
            .then(res => {
                let meme = res.data.images[Math.random() * res.data.images.length | 0].link
                if (meme) {
                    let randomDog = new discord.Attachment(res.data.images[Math.random() * res.data.images.length | 0].link)
                    channel.send(randomDog)
                } else {
                    throw "couldnt fetch"
                }
            })
            .catch(error => {
                channel.send("Couldn't fetch doggo")
                console.error(error)
            })
    } else if (cmd === 'about') {
        channel.send(`I am beppe-bot v${version}`)
    } else if (cmd === 'analysis') {
        let kowalski = new discord.Attachment('https://i.ytimg.com/vi/jSaMm1lK_j8/maxresdefault.jpg')
        channel.send(kowalski)
    } else if (cmd === 'bulkdelete' || cmd === 'purge') {
        if (isAdmin(member)) {
            if (isNaN(args[0])) {
                channel.send(':no_entry_sign: You need to enter a number of messages to delete!')
            } else {
                channel.bulkDelete(parseInt(args[0]) + 1)
            }
        } else {
            channel.send(':no_entry_sign: You have insufficient permissions for this command')
        }
    } else if (cmd === 'praise') {
        if (!args[0]) {
            channel.send('Enter something to praise')
        } else if (args[0].toLowerCase() === 'sheldon') {
            channel.send(":shelpray: He has been praised :shelpray:")
        } else {
            channel.send(`Can't praise ${args[0]}, must praise **sheldon**`)
        }
    } else if (cmd === 'this' && args.join(' ').toLowerCase() === 'is epic') {
        channel.send('This is epic indeed')
    } else if (cmd === 'get') {
        if (isAdmin(member)) {
            if (!args[0]) {
                channel.send(`:no_entry_sign: You need to enter a key to get. \nPossible keys are: \n${allowedConfigs.map(d => "`" + d + "`").join(", ")}`)
            } else {
                let value = config[args[0]]
                channel.send(`*${args[0]}* is set to **${value}**`)
            }
        } else {
            channel.send(':no_entry_sign: You have insufficient permissions for this command')
        }
    } else if (cmd === 'set') {
        let value = args.slice(1).join(" ")
        if (isAdmin(member)) {
            if (!args[0]) {
                channel.send(':no_entry_sign: You need to enter a key to edit!')
            } else if (!value) {
                channel.send(':no_entry_sign: You need to enter a value!')
            } else if (args[0] == 'username') {
                client.user.setUsername(value)
                channel.send(`Changed username`)
            } else if (args[0] == 'avatar') {
                client.user.setAvatar(value)
                channel.send(`Changed avatar`)
            } else {
                config[args[0]] = value
                fs.writeFile('./config.json', JSON.stringify(config), function () {
                    channel.send(`Changed **${args[0]}** to *${value}*`)
                })
            }
        } else {
            channel.send(':no_entry_sign: You have insufficient permissions for this command')
        }
    } else if (cmd === 'admin') {
        if (isAdmin(member)) {
            let member = guild.members.get(args[1])
            if (!member) {
                channel.send(`Member **${args[1]}** not found`)
            }
            if (args[0] === 'add') {
                member.addRole(config.adminRoles[0])
                channel.send(`Set **${member.nickname}** to admin`)
            } else if (args[0] === 'remove') {
                member.removeRole(config.adminRoles[0])
                channel.send(`Removed **${member.nickname}** from admin`)
            }
        } else {
            channel.send(':no_entry_sign: You have insufficient permissions for this command')
        }
    } else if (cmd === 'eval') {
        if (isAdmin(member)) {
            try {
                let vm = new vm2.VM()
                let response = '' + vm.run(args.join(' '))
                channel.send(response)
            } catch (error) {
                channel.send('Error', error)
            }
        } else {
            channel.send(':no_entry_sign: You have insufficient permissions for this command')
        }
    } else {
        channel.send(`Invalid command \`${cmd}\``)
    }
}

client.on('message', message => {
    let { content } = message
    let trimmedContent = content.trimLeft()
    
    if (trimmedContent.toLowerCase().indexOf(config.prefix.toLowerCase()) === 0) {
        handleCommand(message, trimmedContent.slice(config.prefix.length).trimLeft())
    } else if (trimmedContent.indexOf(`<@${client.user.id}>`) === 0) {
        handleCommand(message, trimmedContent.slice(`<@${client.user.id}>`.length).trimLeft())
    }
})

// Welcome/goodbye messages
client.on('guildMemberAdd', member => {
    member.guild.channels.get(config.welcomechannel).send(`Welcome <@${member.id}>`)
    member.addRole(config.firstRole) // TODO: customizable default role
})
client.on('guildMemberRemove', member => {
    member.guild.channels.get(config.welcomechannel).send(`${member.user.username} has left the server`)
})

let stdin = process.openStdin();

let chatting = {
    state: false,
    guild: 426099086047969283,
    channel: 426099086047969287,
}

function sendMsg(channel, content) {
    client.channels.get(channel).send(content)
}

// Commandline commands
stdin.addListener('data', data => {
    // Todo: add a GUI to the node-instance
    let msg = data.toString()

    let id = msg.slice(0, msg.indexOf("-"))
    msg = msg.slice(msg.indexOf("-") + 1)
    if (chatting.state) {
        if (msg.trim() == "") {
            chatting.state = false;
            console.log("No longer chatting")
            return
        }
        sendMsg(chatting.channel, msg)
    } else if (id == "chat") {
        let [guild, channel] = msg.match(/(\d*):(\d*)/g)[0].split(":")
        chatting.channel = channel
        chatting.state = true

        console.log("You are now chatting")
    } else if (id == "msg") {
        let [guild, channel] = msg.match(/(\d+):(\d+)/g)[0].split(":"),
            content = msg.slice(msg.indexOf("=") + 1)

        sendMsg(channel, content)
    } else if (id == "servers") {
        console.log("Currently connected to:")
        console.log(client.guilds.map(g => `${g.id} ${g.name}`).join("\n"))
    }
});

client.login(token);

console.log(`Hello and welcome to beppe-bot version ${version}`)

// https://discordapp.com/oauth2/authorize?client_id=431035746099658772&scope=bot&permissions=8