const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '..', '..', 'settings.json');

function readData() {
    if (!fs.existsSync(settingsPath)) {
        return {
            globalSettings: {},
            groupDefaults: {},
            groupSettings: {},
            bannedUsers: [],
            sudoUsers: [],
            conversationHistory: {}
        };
    }

    const raw = fs.readFileSync(settingsPath);
    return JSON.parse(raw);
}

function writeData(data) {
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
}


async function getSettings() {
    const data = readData();
    return data.globalSettings;
}

async function updateSetting(key, value) {
    const data = readData();
    data.globalSettings[key] = typeof value === 'boolean' ? value.toString() : value;
    writeData(data);
}


async function getGroupSetting(jid) {
    const data = readData();
    const group = data.groupSettings[jid];

    if (!group) {
        data.groupSettings[jid] = { ...data.groupDefaults };
        writeData(data);
        return data.groupDefaults;
    }

    return group;
}

async function updateGroupSetting(jid, key, value) {
    const data = readData();
    if (!data.groupSettings[jid]) {
        data.groupSettings[jid] = { ...data.groupDefaults };
    }
    data.groupSettings[jid][key] = typeof value === 'boolean' ? value.toString() : value;
    writeData(data);
}

async function getAllGroupSettings() {
    const data = readData();
    return data.groupSettings;
}


async function getBannedUsers() {
    return readData().bannedUsers;
}

async function banUser(num) {
    const data = readData();
    if (!data.bannedUsers.includes(num)) {
        data.bannedUsers.push(num);
        writeData(data);
    }
}

async function unbanUser(num) {
    const data = readData();
    data.bannedUsers = data.bannedUsers.filter(n => n !== num);
    writeData(data);
}

async function getSudoUsers() {
    return readData().sudoUsers;
}

async function addSudoUser(num) {
    const data = readData();
    if (!data.sudoUsers.includes(num)) {
        data.sudoUsers.push(num);
        writeData(data);
    }
}

async function removeSudoUser(num) {
    const data = readData();
    data.sudoUsers = data.sudoUsers.filter(n => n !== num);
    writeData(data);
}


async function saveConversation(num, role, message) {
    const data = readData();
    if (!data.conversationHistory[num]) {
        data.conversationHistory[num] = [];
    }

    data.conversationHistory[num].push({ role, message, timestamp: Date.now() });
    writeData(data);
}

async function getRecentMessages(num) {
    const data = readData();
    return data.conversationHistory[num] || [];
}

async function deleteUserHistory(num) {
    const data = readData();
    delete data.conversationHistory[num];
    writeData(data);
}

module.exports = {
    getSettings,
    updateSetting,
    getGroupSetting,
    updateGroupSetting,
    getAllGroupSettings,
    getBannedUsers,
    banUser,
    unbanUser,
    getSudoUsers,
    addSudoUser,
    removeSudoUser,
    saveConversation,
    getRecentMessages,
    deleteUserHistory
};