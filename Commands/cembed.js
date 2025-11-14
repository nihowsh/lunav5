const {
    Appembed
} = require('kyz'); // Commonjs
const fs = require('fs');
let config = {};

if (fs.existsSync('config.json')) {
    config = JSON.parse(fs.readFileSync('config.json'));
}

module.exports = {
    description: 'https://appembed.netlify.app/e?t=&c=%23FF0000&a=VARcembed&d=Say%20VARcembed%20to%20get%20prompted%20with%20a%20embed%20creator!%20Follow%20the%20instructions%20shown%20in%20the%20embed%20creator.&p=TonyskalYTs%20selfbot&i=&ic=',
    run: async (client, message, handler, prefix, MyID) => {
        if (message.author.id !== client.user.id) {
            return await message.reply(`${config.longstringoftext} https://appembed.netlify.app/e?t=&c=%23FF0000&a=You%20cannot%20run%20this%20command!&d=Only%20${client.user.username}%20can%20run%20this%20command.&p=TonyskalYTs%20selfbot&i=&ic=`)
        } else {
            try {
                const responses = {};
                const embed0 = new Appembed()
                    .setProvider("TonyskalYTs selfbot")
                    .setDescription(`‫`)
                    .setColor("#313338")
                    .build();

                const embedBuildQuestion = await message.channel.send(`${config.longstringoftext} https://appembed.netlify.app/e?t=&c=%23666666&a=Please%20enter%20a%20Title%20for%20your%20embed&d=say%20%22skip%22%20to%20skip.&p=TonyskalYTs%20selfbot&i=\nhttps://appembed.netlify.app/e?t=&c=%23000000&a=Embed%20Preview:&d=\n${embed0}`)
                const response1 = await message.channel.awaitMessages({
                    max: 1,
                    time: 60000,
                    errors: ['time'],
                    filter: (response) => response.author.id === message.author.id
                });
                responses.question1 = response1.first().content;
                if (responses.question1.toLowerCase() === "skip") {
                    responses.question1 = ``;
                }
                await response1.first().delete();

                const embed1 = new Appembed()
                    .setTitle(responses.question1)
                    .setProvider("TonyskalYTs selfbot")
                    .setDescription(`‫`)
                    .setColor("#313338")
                    .build();

                await embedBuildQuestion.edit(`${config.longstringoftext} https://appembed.netlify.app/e?t=&c=%23528552&a=Please%20enter%20an%20Author%20name%20for%20your%20embed&d=say%20%22skip%22%20to%20skip.&p=TonyskalYTs%20selfbot&i=\nhttps://appembed.netlify.app/e?t=&c=%23000000&a=Embed%20Preview:&d=\n${embed1}`)
                const response2 = await message.channel.awaitMessages({
                    max: 1,
                    time: 60000,
                    errors: ['time'],
                    filter: (response) => response.author.id === message.author.id
                });
                responses.question2 = response2.first().content;
                if (responses.question2.toLowerCase() === "skip") {
                    responses.question2 = ``;
                }
                await response2.first().delete();

                const embed2 = new Appembed()
                    .setTitle(responses.question1)
                    .setAuthor(responses.question2)
                    .setDescription(`‫`)
                    .setProvider("TonyskalYTs selfbot")
                    .setColor("#313338")
                    .build();
                await embedBuildQuestion.edit(`${config.longstringoftext} https://appembed.netlify.app/e?t=&c=%233DA33D&a=Please%20enter%20a%20Description%20for%20your%20embed&d=say%20%22skip%22%20to%20skip.&p=TonyskalYTs%20selfbot&i=\nhttps://appembed.netlify.app/e?t=&c=%23000000&a=Embed%20Preview:&d=\n${embed2}`); // Desc
                const response3 = await message.channel.awaitMessages({
                    max: 1,
                    time: 60000,
                    errors: ['time'],
                    filter: (response) => response.author.id === message.author.id
                });
                responses.question3 = response3.first().content;
                if (responses.question3.toLowerCase() === "skip") {
                    responses.question3 = ``;
                }
                await response3.first().delete();

                const embed3 = new Appembed()
                    .setTitle(responses.question1)
                    .setAuthor(responses.question2)
                    .setDescription(responses.question3)
                    .setProvider("TonyskalYTs selfbot")
                    .setColor("#313338")
                    .build();

                await embedBuildQuestion.edit(`${config.longstringoftext} https://appembed.netlify.app/e?t=&c=%2329C229&a=Please%20enter%20an%20Image%20for%20your%20embed.&d=say%20%22skip%22%20to%20skip.&p=TonyskalYTs%20selfbot&i=&ic=\nhttps://appembed.netlify.app/e?t=&c=%23000000&a=Embed%20Preview:&d=\n${embed3}`); // IMG url
                const response4 = await message.channel.awaitMessages({
                    max: 1,
                    time: 60000,
                    errors: ['time'],
                    filter: (response) => response.author.id === message.author.id
                });

                if (response4.first().attachments.size > 0) {
                    const attachment = response4.first().attachments.first();
                    if (attachment.url) {
                        responses.question4 = attachment.url;
                    }
                } else {
                    responses.question4 = response4.first().content;
                }

                if (responses.question4.toLowerCase() === "skip") {
                    responses.question4 = ``;
                }

                await response4.first().delete();

                //

                const embed6 = new Appembed()
                    .setTitle(responses.question1)
                    .setAuthor(responses.question2)
                    .setDescription(responses.question3)
                    .setImage(responses.question4)
                    .setProvider("TonyskalYTs selfbot")
                    .setColor("#313338")
                    .build();

                await embedBuildQuestion.edit(`${config.longstringoftext} https://appembed.netlify.app/e?t=&c=%2314E014&a=Please%20enter%20a%20side%20icon%20for%20your%20embed&d=%22skip%22%20to%20skip.%20Using%20an%20side%20icon%20will%20remove%20the%20Image%20and%20set%20the%20Author%20text%20to%20Title%20to%20avoid%20issues.&p=TonyskalYTs%20selfbot&i=&ic=\nhttps://appembed.netlify.app/e?t=&c=%23000000&a=Embed%20Preview:&d=\n${embed6}`); // Side icon url
                const response6 = await message.channel.awaitMessages({
                    max: 1,
                    time: 60000,
                    errors: ['time'],
                    filter: (response) => response.author.id === message.author.id
                });

                const userResponse = response6.first();

                if (userResponse.attachments.size > 0) {
                    const attachment = userResponse.attachments.first();
                    if (attachment.url) {
                        responses.question6 = attachment.url;
                    }
                } else {
                    responses.question6 = userResponse.content;
                }

                if (responses.question6.toLowerCase() === "skip") {
                    responses.question6 = ``;
                } else {
                    responses.question1 = `${responses.question2}`;
                    responses.question2 = ``;
                    responses.question4 = ``;
                }

                await userResponse.delete();

                //

                const embed4 = new Appembed()
                    .setTitle(responses.question1)
                    .setAuthor(responses.question2)
                    .setDescription(responses.question3)
                    .setImage(responses.question4)
                    .setIcon(responses.question6)
                    .setProvider("TonyskalYTs selfbot")
                    .setColor("#313338")
                    .build();

                await embedBuildQuestion.edit(`${config.longstringoftext} https://appembed.netlify.app/e?t=&c=%2300FF00&a=Please%20enter%20an%20Hex%20Color%20Code%20for%20your%20embed&d=say%20%22skip%22%20to%20skip.%20Hex%20color%20code%20examples%3A%20%23FF5000%2C%20FF5000&p=TonyskalYTs%20selfbot&i=\nhttps://appembed.netlify.app/e?t=&c=%23000000&a=Embed%20Preview:&d=\n${embed4}`); // Hex code
                const response5 = await message.channel.awaitMessages({
                    max: 1,
                    time: 60000,
                    errors: ['time'],
                    filter: (response) => response.author.id === message.author.id
                });
                responses.question5 = response5.first().content;
                if (responses.question5.toLowerCase() === "skip") {
                    responses.question5 = ``;
                }
                if (responses.question5.length === 6) {
                    responses.question5 = `#${responses.question5}`;
                }
                const finalEmbed = new Appembed()
                    .setTitle(responses.question1)
                    .setColor(responses.question5)
                    .setAuthor(responses.question2)
                    .setDescription(responses.question3)
                    .setProvider("TonyskalYTs selfbot")
                    .setImage(responses.question4)
                    .setIcon(responses.question6)
                    .build();
                const thingy = ("```")

                const userResponse5 = response5.first();
                await userResponse5.delete()
                await embedBuildQuestion.edit(`${config.longstringoftext} https://appembed.netlify.app/e?t=&c=%2300FF00&a=Your%20embed%20is%20complete!&d=&p=TonyskalYTs%20selfbot&i=\nhttps://appembed.netlify.app/e?t=&c=%23000000&a=Embed%20Preview:&d=\n${finalEmbed}`); // Hex code


                message.reply(`${thingy}${finalEmbed}${thingy}`);

            } catch (err) {
                console.error(err);
            }
        }
    }
}