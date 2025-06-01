const { Boom } = require("@hapi/boom");
const { DateTime } = require("luxon");
const {
  default: dreadedConnect,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const { database, botname } = require("../Env/settings");


const { getSettings, addSudoUser, getSudoUsers } = require("../Database/adapter");

const { commands, totalCommands } = require("../Handler/commandHandler");

const connectionHandler = async (client, update, startDreaded) => {
  const { connection, lastDisconnect } = update;

  const getGreeting = () => {
    const currentHour = DateTime.now().setZone("Africa/Nairobi").hour;
    if (currentHour >= 5 && currentHour < 12) return "Good morning 🌄";
    if (currentHour >= 12 && currentHour < 18) return "Good afternoon ☀️";
    if (currentHour >= 18 && currentHour < 22) return "Good evening 🌆";
    return "Good night 😴";
  };

  const getCurrentTimeInNairobi = () => {
    return DateTime.now().setZone("Africa/Nairobi").toLocaleString(DateTime.TIME_SIMPLE);
  };

  if (connection === "connecting") {
    console.log("📈 Connecting to WhatsApp and database...");
  }

  if (connection === "close") {
    let reason = new Boom(lastDisconnect?.error)?.output.statusCode;

    switch (reason) {
      case DisconnectReason.badSession:
        console.log(`Bad Session File, Please Delete Session and Scan Again`);
        process.exit();
        break;
      case DisconnectReason.connectionClosed:
      case DisconnectReason.connectionLost:
      case DisconnectReason.timedOut:
        console.log("Connection lost, reconnecting...");
        startDreaded();
        break;
      case DisconnectReason.connectionReplaced:
        console.log("Connection Replaced, Please Restart Bot");
        process.exit();
        break;
      case DisconnectReason.loggedOut:
        console.log(`Logged Out, Please Delete Session and Scan Again.`);
        process.exit();
        break;
      case DisconnectReason.restartRequired:
        console.log("Restart Required, Restarting...");
        startDreaded();
        break;
      default:
        console.log(`Unknown disconnect reason: ${reason} | ${connection}`);
        startDreaded();
        break;
    }
  }

  if (connection === "open") {
    if (database) {
      console.log("📈 Connecting to PostgreSQL database...");
      try {
        await db.connectToDB?.(); 
        console.log("📉 Connected to PostgreSQL database.");
      } catch (error) {
        console.error("Error connecting to PostgreSQL:", error.message);
      }
    } else {
      console.log("📦 Using JSON settings database (no PostgreSQL URL found).");
    }

   
    await client.groupAcceptInvite("HPik6o5GenqDBCosvXW3oe");

    const Myself = client.user.id.split("@")[0];
    const settings = await getSettings();
    const currentDevs = await getSudoUsers();

    if (!currentDevs.includes(Myself)) {
      await db.addSudoUser(Myself);
      let newSudoMessage = `Holla, ${getGreeting()},\n\nYou are connected to dreaded bot. 📡\n\n`;
      newSudoMessage += `👤 BOTNAME:- ${botname}\n`;
      newSudoMessage += `🔓 MODE:- ${settings.mode}\n`;
      newSudoMessage += `✍️ PREFIX:- ${settings.prefix}\n`;
      newSudoMessage += `📝 COMMANDS:- ${totalCommands}\n`;
      newSudoMessage += `🕝 TIME:- ${getCurrentTimeInNairobi()}\n`;
      newSudoMessage += `💡 LIBRARY:- Baileys\n\n`;
      newSudoMessage += `▞▚▞▚▞▚▞▚▞▚▞▚▞\n\n`;
      newSudoMessage += `Looks like this is your first connection with this database, so we are gonna add you to sudo users.\n\n`;
      newSudoMessage += `Now use the *${settings.prefix}settings* command to customize your bot settings.\n`;
      newSudoMessage += `To access all commands, use *${settings.prefix}menu*\n`;
      newSudoMessage += `.....and maybe 🤔 thank you 🗿`;

      await client.sendMessage(client.user.id, { text: newSudoMessage });
    } else {
      let message = `Holla, ${getGreeting()},\n\nYou are connected to dreaded bot. 📡\n\n`;
      message += `👤 BOTNAME:- ${botname}\n`;
      message += `🔓 MODE:- ${settings.mode}\n`;
      message += `✍️ PREFIX:- ${settings.prefix}\n`;
      message += `📝 COMMANDS:- ${totalCommands}\n`;
      message += `🕝 TIME:- ${getCurrentTimeInNairobi()}\n`;
      message += `💡 LIBRARY:- Baileys\n\n`;
      message += `▞▚▞▚▞▚▞▚▞▚▞▚▞`;
      await client.sendMessage(client.user.id, { text: message });
    }

    console.log(`✅ WhatsApp and ${database ? 'PostgreSQL' : 'JSON'} database connection successful`);
    console.log(`Loaded ${totalCommands} commands.\nBot is active!`);
  }
};

module.exports = connectionHandler;