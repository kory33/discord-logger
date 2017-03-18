"use strict";

const settings = require("./.settings.json");
const Discordie = require("discordie");
const rp = require("request-promise");
const fs = require("fs");

const cache_dir = __dirname + "/cache";
if (!fs.existsSync(cache_dir)) {
    fs.mkdirSync(cache_dir);
}

const client = new Discordie();
let reconnect_interval = 1;

function getTimeFormat(date) {
    const dateinfo = date.toString().split(" ").splice(1, 5);
    const timeZone = dateinfo.pop();
    const time = dateinfo.pop();
    return `${dateinfo.join("/")} at ${time} (${timeZone})`;
}

function getFilename(original_file_name) {
    const date = new Date();

    let name = "";
    name += date.getFullYear();
    name += ("0" + date.getMonth()).slice(-2);
    name += ("0" + date.getDate()).slice(-2);
    name += "_";
    name += ("0" + date.getHours()).slice(-2);
    name += ("0" + date.getMinutes()).slice(-2);
    name += ("0" + date.getSeconds()).slice(-2);

    return name;
}

function getFileExt(original_file_name) {
    const ext_match = original_file_name.match(/\.([^\.]*$)/)[1];
    return ext_match ? "." + ext_match : "";
}

function getMessageInformation(message) {
    const content = message.resolveContent();
    const author = message.author;
    const authorName = message.guild.members.find(member => member.id === author.id).name;
    const time = getTimeFormat(new Date());

    return { "time": time, "authorName": authorName, "content": content };
}

function shouldLog(message) {
    return client.User.getVoiceChannel(message.guild) !== null;
}

function processAttachments(attachments) {
    if (!attachments.length) {
        return;
    }

    // cache attachments
    for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];

        let targetFileName = getFilename(attachment.filename);

        if (attachments.length !== 1) {
            targetFileName += "_" + i;
        }

        targetFileName += getFileExt(attachment.filename);

        rp.get(attachment.url).pipe(fs.createWriteStream(`${cache_dir}/${targetFileName}`));
        console.log(`cached attachment: ${targetFileName}`);
    }
}

client.Dispatcher.on(Discordie.Events.GATEWAY_READY, () => {
    reconnect_interval = 1;
    console.log("connected to Discord");
});

client.Dispatcher.on(Discordie.Events.MESSAGE_CREATE, e => {
    if (!shouldLog(e.message)) {
        return;
    }

    const { time, authorName, content } = getMessageInformation(e.message);
    console.log(`[${time}] ${authorName} said: ${content}`);

    processAttachments(e.message.attachments);
});

client.Dispatcher.on(Discordie.Events.MESSAGE_UPDATE, e => {
    if (!shouldLog(e.message)) {
        return;
    }

    const { time, authorName, content } = getMessageInformation(e.message);
    console.log(`[${time}] ${authorName} updated the message to: ${content}`);
});

client.connect(settings);

client.Dispatcher.on(Discordie.Events.DISCONNECTED, e => {
    console.log(e);
    console.log("Disconnected from Discord... Trying to reconnect in 10 seconds");
    return new Promise((resolve) => {
        setTimeout(() => {
            client.connect(settings);
            resolve();
        }, reconnect_interval * 1000);
        reconnect_interval *= 2;
    });
});

process.on("beforeExit", () => client.connect(settings));