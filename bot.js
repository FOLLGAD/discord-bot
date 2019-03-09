let discord = require('discord.js')
let auth = require('./auth.json')

// Initialize discord client
let client = new discord.Client()

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
})

// Prefix that beppe-bot will listen to
const { prefix } = require('./config.json')

client.on('message', ({ content, channel }) => {
    let trimmedContent = content.trim()
    if (trimmedContent.indexOf(prefix) === 0) {
        let argsRaw = trimmedContent.substring(prefix.length).trim()
        let args = argsRaw.split(' ')
        let cmd = args[0]

        switch (cmd) {
            case 'ping':
                channel.send('boop')
                break
            case 'about':
                channel.send('I am beppe-bot v0.1')
                break
        }
    }
})

let joinMsgChannel = '536261976200839211'
client.on('guildMemberAdd', member => {
    member.guild.channels.get(joinMsgChannel).send(`Welcome <@${member.id}>`)
    member.guild.channel
    member.addRole('fella') // TODO: customizable default role
})
client.on('guildMemberRemove', member => {
    member.guild.channels.get(joinMsgChannel).send(`${member.user.username} has left the server`)
    member.addRole('fella') // TODO: customizable default role
})

let stdin = process.openStdin();

let chatting = {
    state: false,
    guild: 426099086047969283,
    channel: 426099086047969287,
}

function sendMsg(guild, channel, content) {
    client.guilds.get(guild).channels.get(channel).send(content)
}

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
        sendMsg(chatting.guild, chatting.channel, msg)
    } else if (id == "chat") {
        let [guild, channel] = msg.match(/(\d+):(\d+)/g)[0].split(":")
        chatting.guild = guild
        chatting.channel = channel
        chatting.state = true

        console.log("You are now chatting")
    } else if (id == "msg") {
        let [guild, channel] = msg.match(/(\d+):(\d+)/g)[0].split(":")
        let content = msg.slice(msg.indexOf("=") + 1)

        sendMsg("426099086047969283", "426099086047969287", content)
    }
});

client.login(auth.token);

// https://discordapp.com/oauth2/authorize?client_id=431035746099658772&scope=bot&permissions=8