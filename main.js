"use strict";

const settings = require("./.settings.json");
const Discordie = require("discordie");

const client = new Discordie();

client.Dispatcher.on(Discordie.Events.GATEWAY_READY, ( ) => {
    console.log("connected to Discord");
});

client.Dispatcher.on(Discordie.Events.MESSAGE_CREATE, e => {
    const messageGuild = e.message.guild;

    if(client.User.getVoiceChannel(messageGuild) === null) {
        return;
    }

    const content = e.message.resolveContent();
    const author = e.message.author;
    const authorName = messageGuild.members.find(member => member.id === author.id).name;

    console.log(`${authorName} said: ${content}`);
});

client.connect(settings);