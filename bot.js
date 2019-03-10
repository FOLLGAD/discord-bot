const version = '0.1'

const discord = require('discord.js')
const fs = require('fs')
let config = require('./config.json')
let { token } = require('./auth.json')

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

client.on('message', message => {
    let { content, channel, member } = message

    let trimmedContent = content.trim()
    if (trimmedContent.indexOf(config.prefix) === 0) {
        let argsRaw = trimmedContent.substring(config.prefix.length).trim()
        let [cmd, ...args] = argsRaw.split(' ')
        cmd = cmd.toLowerCase()

        if (cmd === 'ping') {
            channel.send('boop')
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
                } else if (!args[1]) {
                    channel.send(':no_entry_sign: You need to enter a value!')
                } else {
                    config[args[0]] = value
                    fs.writeFile('./config.json', JSON.stringify(config), function () {
                        channel.send(`Changed *${args[0]}* to **${value}**`)
                    })
                }
            } else {
                channel.send(':no_entry_sign: You have insufficient permissions for this command')
            }
        } else {
            channel.send(`Invalid command \`${cmd}\``)
        }
    }
})

// Welcome/goodbye messages
client.on('guildMemberAdd', member => {
    member.guild.channels.get(config.welcomeChannel).send(`Welcome <@${member.id}>`)
    member.addRole(config.firstRole) // TODO: customizable default role
})
client.on('guildMemberRemove', member => {
    member.guild.channels.get(config.welcomeChannel).send(`${member.user.username} has left the server`)
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