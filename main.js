"use strict";

const settings = require("./.settings.json");
const Discordie = require("discordie");

const client = new Discordie();

function getTimeFormat(date) {
    const dateinfo = date.toString().split(" ").splice(1, 5);
    const timeZone = dateinfo.pop();
    const time = dateinfo.pop();
    return `${dateinfo.join("/")} at ${time} (${timeZone})`;
}

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
    const time = getTimeFormat(new Date());

    console.log(`[${time}] ${authorName} said: ${content}`);
});

client.connect(settings);

client.Dispatcher.on(Discordie.Events.DISCONNECTED, e => {
    console.log(e);
    console.log("Disconnected from Discord... Trying to reconnect in 10 seconds");
    return new Promise((resolve) => {
        setTimeout(() => {
            client.connect(settings);
            resolve();
        }, 10000);
    });
});