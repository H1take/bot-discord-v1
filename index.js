const Discord = require("discord.js");
const { token } = require("./config/constants.json");
const config = require("./config/config.json");

const {  promisify } = require("util");

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MEMBERS
  ]
});

const prefix = config.prefix;

client.on("ready", () => {
  console.log("Bot is ready");
});

client.on("messageCreate", (message) => {

  let messageContent = message.content;

  let commandWithOutPrefix = messageContent.replace(prefix, "");

  let commandArr = commandWithOutPrefix.split(/\s+/);

  let command = commandArr[0];

  commandArr.splice(0, 1);

  let args = commandArr;

  if (command.toLowerCase() === "say") {
    message.reply(commandArr.join(" "));
  }

  if (command === "nick") {
    let nick = args.join(" ");

    if (!nick) message.channel.send("Вы не написали ваш новый ник!");

    if (
      message.member.roles.highest.position >=
      message.guild.me.roles.highest.position
    )
      return message.reply("Недостаточно прав!");

    message.member.setNickname(nick);

    return;
  }

  if (command === "getRole") {
    let role = args[0];
    let roleObj =
      message.guild.roles.cache.get(role) ||
      message.guild.roles.cache.find(guildRole => guildRole.name === role);

    if (roleObj) {
      if (roleObj.position >= message.guild.me.roles.highest.position)
        return message.reply("У меня недостаточно прав!");

      if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.reply("У вас недостаточно прав!");

      message.member.roles.add(roleObj);
    } else {
      message.channel.send("Такой роли нет!");
    }
  }

  if (command === "addRoleMention") {
    let user = message.mentions.members.first();

    if (!user) {
      return message.channel.send("Такого пользователя не существует!");
    }

    let roleEmbed = args[1].toLowerCase();

    let mentionedRole =
      message.guild.roles.cache.get(roleEmbed) ||
      message.guild.roles.cache.find(
        role => role.name.toLowerCase() === roleEmbed
      );

    if (!mentionedRole) {
      return message.channel.send("Такой роли нет!");
    }

    if (mentionedRole.position >= message.guild.me.roles.highest.position) {
      return message.reply("У вас недостаточно прав!");
    }

    user.roles.add(mentionedRole);
  }

  if (command === "kick") {
    let user = message.mentions.members.first();

    if (user) {
      if (user.position >= message.guild.me.roles.highest.position) {
        return message.reply(
          "У вас недостаточно прав, чтобы кикнуть этого пользователя"
        );
      } else {
        user.kick();
      }
    } else {
      return message.reply("Такого пользователя не существует!");
    }
  }

  if (command === "clear") {
    let countMessages = Number(args[0]); // NaN

    if (!countMessages) countMessages = 1;

    if (isNaN(countMessages)) {
      return message.channel.send("Это не число!");
    }

    if (countMessages > 100) {
      return message.channel.send(
        "Вы не можете удалить за раз больше 100 сообщений!"
      );
    }

    if (countMessages <= 0) {
      return message.channel.send(
        "Вы не можете ввести число равное 0 или меньше 0"
      );
    }

    message.channel.bulkDelete(countMessages);
    message.channel.send(`Удалено ${countMessages} сообщений!`);
  }

  if (command === "allUsers") {
    let guild = client.guilds.cache.get("933418473168723978");

    let allMembers = await guild.members.fetch();

    allMembers
      .filter(member => !member.user.bot)
      .forEach(member =>
        message.channel.send(`===>>> ${member.user.username}`)
      );
  }

  if (command === "createTextChannel") {
    let nameChannel = message.content.replace("!createTextChannel", "");

    if (nameChannel) {
      message.guild.channels.create(nameChannel, {
        type: "text"
      });
    } else {
      message.channel.send("Вы не ввели название нового текстового канала!");
    }
  }

  if (command === "createVoiceChannel") {
    let nameChannel = message.content.replace("!createVoiceChannel", "");

    if (nameChannel) {
      message.guild.channels.create(nameChannel, {
        type: "voice"
      });
    } else {
      message.channel.send("Вы не ввели название нового голосового канала!");
    }
  }

  if (command === "timeout") {
    let user = message.mentions.members.first();
    let reason = args[1];
    let time = args[2];

    user.timeout(time * 60 * 1000, reason);
  }

  // if (command === "aboutUser") {

  //   let user = args[0];

    

  // }
});

client.on("guildMemberAdd", member => {
  let notifChannel = member.guild.channels.cache.get("933418710419517491");

  let joinEmbed = new Discord.MessageEmbed()
    .setTitle("Новый участник!")
    .setThumbnail(member.avatarURL())
    .setColor("YELLOW")
    .setDescription(
      `Участник \`${member.user.tag}\` присоединился на наш сервер!`
    );

  notifChannel.send({
    embeds: [joinEmbed]
  });
});

client.on("guildMemberRemove", member => {
  let notifChannel = member.guild.channels.cache.get("933418710419517491");

  let kickEmbed = new Discord.MessageEmbed()
    .setTitle("Удален участник!")
    .setThumbnail(member.avatarURL())
    .setColor("YELLOW")
    .setDescription(`Участник \`${member.user.tag}\` удален с сервера!`);

  notifChannel.send({
    embeds: [kickEmbed]
  });
});

client.on("guildMemberUpdate", (oldMember, newMember) => {
  let notifChannel = oldMember.guild.channels.cache.get("933418710419517491");

  let removedRoles = oldMember.roles.cache.filter(
    role => !newMember.roles.cache.has(role.id)
  );

  let addedRoles = newMember.roles.cache.filter(
    role => !oldMember.roles.cache.has(role.id)
  );

  let roles = [...addedRoles].map(roles => roles[1]);

  let rolesDeleted = [...removedRoles].map(roles => roles[1]);

  if (rolesDeleted[0]) {
    let rolesEmbed = new Discord.MessageEmbed()
      .setTitle("Убрана роль!")
      .addField("Участник:", oldMember.user.tag)
      .addField("Роль:", `${rolesDeleted.join(", ")}`)
      .setColor("GOLD");

    notifChannel.send({embeds: [rolesEmbed]});
  }

  if (roles[0]) {
    let rolesEmbed = new Discord.MessageEmbed()
      .setTitle("Добавлена новая роль!")
      .addField("Участник:", oldMember.user.tag)
      .addField("Роль:", `${roles.join(", ")}`)
      .setColor("GREEN");

    notifChannel.send({embeds: [rolesEmbed]});
  }
});

client.login(token);
