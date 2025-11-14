const path = require('path');
const fs = require('fs');
let config = {};

if (fs.existsSync('config.json')) {
    config = JSON.parse(fs.readFileSync('config.json'));
}

module.exports = {
  description: 'https://appembed.netlify.app/e?description=Type%20VARhelp%20(command%20name)%20for%20help%20on%20a%20specific%20command.&color=%23FF0000&provider=TonyskalYT%27s%20Selfbot&author=VARhelp',
  run: async (client, message, handler, prefix) => {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args[1]?.toLowerCase();

    const commandsFolder = path.join(__dirname, '../commands'); 

    const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));

    if (!commandName) {
      message.reply('Please specify a command name to get help with.');
      return;
    }

    const commandFile = commandFiles.find(file => file.replace('.js', '') === commandName);

    if (commandFile) {
      const command = require(path.join(commandsFolder, commandFile));
      const replacedDescription = command.description.replace(/VAR/g, prefix);
      message.reply(`${config.longstringoftext} ${replacedDescription}`);
    } else {
      message.reply('Please specify a valid command name to get help with.');
    }
  },
};


const cmds = [
  `https://appembed.netlify.app/e?description=Type%20VARReplace%20%22Hi%22%20%22Bye%22%20%225%22%20this%20will%20replace%20every%20instance%20of%20%22Hi%22%20with%20%22Bye%22%20in%20the%20past%205%20messages%20sent%20in%20the%20channel&provider=TonyskalYTs%20selfbot&author=VARReplace%20%22text%22%20%22replace%20text%22%20%22messages%20to%20check%201-100%22&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VARPurge%20%2250%22%20to%20purge%20the%20last%2050%20messages%20in%20the%20channel%20sent%20by%20you&redirect=&provider=TonyskalYTs%20selfbot&author=VARPurge%20(amount)&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Typing%20VARcy%20or%20VARcn%20will%20either%20send%20a%20cat%20yes%20gif%20or%20a%20cat%20no%20gif&provider=TonyskalYTs%20selfbot&author=VARcy%20or%20VARcn&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Typing%20VARzetalic%20will%20bring%20up%20the%20zetalic%20basics%20sheet%20and%20some%20information%20on%20zetalic&redirect=&provider=TonyskalYTs%20selfbot&author=VARzetalic&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VARzetalicize%20Hello!%20to%20automatically%20translate%20%22Hello!%22%20to%20zetalic&provider=TonyskalYTs%20selfbot&author=VARzetalicize%20(text)&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VARzetalicdecode%20%E2%B7%9E%20%E1%99%91%20%E1%92%BA%20%E1%92%BA%20%E1%97%9D%20%E1%96%B3%20%20%E1%97%8E%20to%20automatically%20translate%20%22%E2%B7%9E%20%E1%99%91%20%E1%92%BA%20%E1%92%BA%20%E1%97%9D%20%E1%96%B3%20%20%E1%97%8E%22%20to%20%22Hello%22&provider=TonyskalYTs%20selfbot&author=VARzetalicdecode%20(text)&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VARscramble%20EA%20Sports%20to%20randomly%20scramble%20the%20message&provider=TonyskalYTs%20selfbot&author=VARscramble%20(text)&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VARblock%20698542169476169749%20so%20whenever%20that%20user%20sends%20a%20message%2C%20it%22ll%20say%20the%20default%20%22your%20message%20could%20not%20be%20delivered%22%20this%20doesn%22t%20actually%20block%20somebody%2C%20just%20a%20prank.&provider=TonyskalYTs%20selfbot&author=VARblock%20(users%20ID)&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VARreact%20%22698542169476169749%22%20%22%F0%9F%A4%93%22%20this%20will%20react%20the%20persons%20messages%20with%20a%20nerd%20emoji%20when%20they%20talk!%20also%20use%20VARUnreact%20to%20stop%20this.&provider=TonyskalYTs%20selfbot&author=VARreact%20%22(users%20ID)%22%20%22(insert%20some%20emoji)&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VARreply%20%22698542169476169749%22%20%22%F0%9F%A4%93%22%20this%20will%20reply%20to%20the%20users%20message%20with%20a%20nerd%20emoji!%20Say%20VARUnreply%20to%20turn%20it%20off.&provider=TonyskalYTs%20selfbot&author=VARreply%20%22(users%20ID)%22%20%22some%20message%20here%22&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=type%20VARemoji%20(your%20emoji)%20to%20get%20the%20emoji%20link&provider=TonyskalYTs%20selfbot&author=VAR%20emoji&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VARHowToGetEmojiIDs%20for%20a%20tutorial%20on%20how%20to%20get%20emoji%20ID%22s&provider=TonyskalYTs%20selfbot&author=VARHowToGetEmojiIDs&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VARlinkendpoint%20%22https%3A%2F%2Fgrabify.link%2FMYO52A%22%20for%20example%20to%20get%20the%20link%20endpoint%20of%20a%20potentially%20dangerious%20link!%20(basically%20gets%20rid%20of%20the%20IP%20grabber%20shit)&provider=TonyskalYTs%20selfbot&author=VARlinkendpoint%20%22%20%22&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VARmoveedit%20%22this%20message%20is%20not%20(edited)%20because%20I%20didn%22t%20edit%20it%22%20to%20change%20the%20position%20of%20where%20the%20%22edited%22%20message%20is.&provider=TonyskalYTs%20selfbot&author=VARmoveedit%20%22%20%22&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VAREnableAutoDelete%20%221000%22%20to%20turn%20on%20auto%20delete%20and%20auto%20delete%20your%20messages%20after%201000%20ms!%20VARDisableAutoDelete%20to%20turn%20it%20off&provider=TonyskalYTs%20selfbot&author=VAREnable%2FDisableAutoDelete%20%22(delay)%22&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=type%20VARmeme%205%20to%20get%205%20memes!%20You%20can%20also%20say%20VARmeme%20to%20only%20get%20one%20meme.&provider=TonyskalYTs%20selfbot&author=VARmeme&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=type%20VARflipacoin%20to%20get%20flip%20a%20coin!%2050%2F50%20change%20of%20heads%20or%20tails.&provider=TonyskalYTs%20selfbot&author=VARflipacoin&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VARJoke%20to%20get%20a%20random%20joke!&provider=TonyskalYTs%20selfbot&author=VARJoke&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Text%20%20VAR8ball%20Am%20I%20gay%3F%20To%20ask%20the%208ball%20a%20question!&provider=TonyskalYTs%20selfbot&author=VAR8ball&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=There%20are%20alot%20of%20hangman%20game%20commands.%20Simply%20type%20one%20of%20the%20following%3A%5CnStart%20a%20new%20hangman%20game%20%3C%3D%20starts%20a%20new%20game%20of%20hangman%0AHangmanGuess%20(letter)%20%3C%3D%20guesses%20a%20letter%2C%2015%20guesses%0Ahangmanhint%20%3C%3D%20reveals%20a%20letter%20(3%20hints)%0Ahangmanendgame%20%3C%3D%20ends%20the%20current%20game%0A%24%7Bprefix%7Dhowtoplayhangman%20%3C%3D%20detailed%20description%20of%20the%20commands%20&provider=TonyskalYTs%20selfbot&author=Hangman%20game&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=There%20are%20alot%20of%202048%20game%20commands.%20Simply%20type%20one%20of%20the%20following%3A%5Cnstart%20a%20new%202048%20game%20%3C%3D%20starts%20a%20new%20hangman%20game%0A2048%20end%20%3C%3D%20ends%20the%20current%202048%20game%0A2048%20left%20%3C%3D%20move%20the%20board%20left%0A2048%20right%20%3C%3D%20move%20the%20board%20right%0A2048%20up%20%3C%3D%20move%20the%20board%20up%0A2048%20down%20%3C%3D%20move%20the%20board%20down%0A%24%24%7Bprefix%7Dhowtoplay2048%20%3C%3D%20for%20these%20instructions%20&provider=TonyskalYTs%20selfbot&author=2048&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Tiktaktoe%20start%20%40(mention)%20will%20start%20a%20new%20game.%2050%2F50%20chance%20of%20being%20X%20or%20O.%5CnTiktaktoe%20end%20%3C%3D%20self%20explanitory%0ATiktaktoe%20(0-8)%20%3C%3D%20for%20examle%3A%20%22tiktaktoe%203%22%20will%20clain%20the%20tile%203.&provider=TonyskalYTs%20selfbot&author=tiktaktoe&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20%22VARNews%205%22%20to%20get%205%20recent%20news%20articles%20from%20ABC%20news&provider=TonyskalYTs%20selfbot&author=VARNews&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?provider=TonyskalYTs%20selfbot&author=~Image&description=Type%20%22~Image%20cat%22%20for%20example%20to%20generate%20a%20random%20cat%20picture&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Send%20VARai%20(message)%20to%20get%20an%20AI%20response!%20For%20example%2C%20VARai%20how%20to%20backflip%3F&provider=TonyskalYTs%20selfbot&author=VARai&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Send%20VARaa%20OR%20VARra%20to%20AA%20(add%20auth)%20or%20RA%20(remove%20auth)%20for%20%20the%20users%20id%20mentioned%20after%20the%20command!%20For%20example%2C%20VARaa%20121081179976761344&provider=TonyskalYTs%20selfbot&author=Authorizing%20accounts&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Send%20VARcaption%20%22image%20link%22%20%22top%22%20%22middle%22%20%22bottom%22%20to%20caption%20a%20image!%20Leave%20quotes%20empty%20if%20unwanted!&provider=TonyskalYTs%20selfbot&author=VARcaption&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Sendng%20VARsummerize%20(your%20long%20message)%20will%20use%20an%20AI%20program%20to%20summerize%20useless%20long%20text%20into%20a%20shorter%20form!&provider=TonyskalYTs%20selfbot&author=VARsummerize&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Send%20VARpp%20%40user%20to%20get%20that%20users%20PP%20size!&provider=TonyskalYTs%20selfbot&author=VARpp&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Send%20VARgayrate%20%40user%20to%20get%20that%20users%20gay%20rate!&provider=TonyskalYTs%20selfbot&author=VARgayrate&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VARniggarate%20%40user%20to%20see%20how%20much%20their%20niggarate%20is!&provider=TonyskalYTs%20selfbot&author=VARniggarate&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VARboobs%203%20to%20get%203%20boob%20pics%20from%20r%2Fbiggerthanherhead%20or%20r%2Fbiggerthanhertorso&provider=TonyskalYTs%20selfbot&author=VARboobs&image=Image&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Send%20VARretard%20to%20make%20fun%20of%20somebody%20for%20not%20knowing%20how%20to%20look%20in%20%23bot-invite!&provider=TonyskalYTs%20selfbot&author=VARretard&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VARmoron%20to%20make%20fun%20of%20a%20dumbass%20by%20scolding%20them%20with%20an%20automatically%20generated%20meme&provider=TonyskalYTs%20selfbot&author=VARmoron&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VARmommy%20%40user%20to%20automatically%20edit%20a%20video%20of%20Stewie%20Griffen%20calling%20the%20user%20%22Mommy%22&provider=TonyskalYTs%20selfbot&author=VARmommy&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VARni%20to%20send%20the%20%22There%20is%20no%20sign%20of%20intelegent%20life%20here%22%20meme&provider=TonyskalYTs%20selfbot&author=VARni&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Type%20VARnm%20to%20scare%20somebody%20by%20flashing%20their%20screen%20with%20NIGHTMARE%20WAKE%20UP%20then%20deleteing%20it%20soon%20after&provider=TonyskalYTs%20selfbot&author=VARnm&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=React%20to%20a%20message%20with%20the%20AI%20emoji%20to%20get%20an%20automated%20response%20from%20an%20AI!&provider=TonyskalYTs%20selfbot&author=AI%20reaction&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=React%20to%20a%20message%20with%20the%20ST%20emoji%20and%20any%20nitro%20emojis%20in%20the%20reacted%20message%20will%20be%20sent%20in%20link%20form%20so%20you%20can%20copy%20and%20paste%20them%20into%20your%20own%20server!&provider=TonyskalYTs%20selfbot&author=Emoji%20stealer%20reaction&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=React%20to%20a%20message%20with%20the%20%22note%22%20emoji%20and%20add%20that%20message%20to%20your%20personal%20notes!&provider=TonyskalYTs%20selfbot&author=Note%20reaction&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Send%20VARnotes%20to%20get%20access%20to%20all%20your%20currently%20saved%20notes&provider=TonyskalYTs%20selfbot&author=VARnotes&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Send%20VARremovenote%20(note%20ID)%20OR%20removenote%20(note.id%22s%20seporated%20by%20commas)%20to%20remove%20one%20or%20multiple%20notes%20at%20once%2C%20for%20example%3A%20VARremovenote%20dRkVqigr%2C1kWrgRBB%2C5GGppwVB%20to%20remove%20multiple%20notes&provider=TonyskalYTs%20selfbot&author=VARremovenote&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Send%20VARcreatenote%20to%20create%20a%20new%20note%20directly%20sent%20to%20the%20database.%20For%20example%2C%20%22VARcreatenote%20feed%20the%2014%20starving%20children%20in%20my%20basement%20in%202%20days%22&provider=TonyskalYTs%20selfbot&author=VARcreatenote&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=React%20to%20a%20message%20with%20the%20%22IN%22%20emoji%20to%20generate%20a%20random%20image%20with%20the%20oh%20so%20inspiring%20text%20on%20top%20of%20it.&provider=TonyskalYTs%20selfbot&author=Insipiring%20reaction%20message%20&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=React%20to%20a%20message%20with%20the%20nerdify%20emoji%20to%20put%20the%20users%20message%20behind%20a%20nerdy%20picture!&provider=TonyskalYTs%20selfbot&author=Nerdify&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=~call%23call%20(number)%20(message)%5Cn%0ANumber%20must%20be%209%20didget%20USA%20phone%20number%0AUse%20%5E%20to%20add%20a%201%20second%20delay%20between%20messages%20%22Hello%20%5E%5E%5E%20goodbye%22%20(3%20second%20delay%20between%20hello%20and%20goodbye)%0AUse%20()%20behind%2Finfront%20a%20mp3%20link%20to%20specify%20audio%20to%20play%20&provider=TonyskalYTs%20selfbot&author=VAR%23call&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Say%20VARyta%20(youtube%20link)%20to%20get%20the%20MP3%20audio%20file%20for%20the%20video%20specified&provider=TonyskalYTs%20selfbot&author=VARyta&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?description=Say%20VARytv%20(youtube%20link)%20to%20get%20the%20MP4%20video%2Faudio%20file%20for%20the%20video%20specified&provider=TonyskalYTs%20selfbot&author=VARytv&image=&color=%23FF0000`,
  `https://appembed.netlify.app/e?t=&c=%23FF0000&a=VARcembed&d=Say%20VARcembed%20to%20get%20prompted%20with%20a%20embed%20creator!%20Follow%20the%20instructions%20shown%20in%20the%20embed%20creator.&p=TonyskalYTs%20selfbot&i=&ic=`,
  `https://appembed.netlify.app/e?t=&c=%23FF0000&a=VARserverinfo&d=Send%20VARserverinfo%20in%20a%20discord%20server%20to%20recieve%20info%20on%20the%20discord%20server!&p=TonyskalYTs%20selfbot&i=&ic=`,
  `https://appembed.netlify.app/e?t=&c=%23FF0000&a=VARimagine&d=type%20VARimagine%20(prompt)%20to%20generate%20a%20image%20based%20off%20of%20the%20prompt%20using%20AI.&p=TonyskalYTs%20selfbot&i=&ic=`,
  `https://appembed.netlify.app/e?t=&c=%23FF0000&a=VARfemboytip&d=Type%20VARfemboytip%20(prompt)%20for%20a%20tip%20on%20femboys&p=TonyskalYTs%20selfbot&i=&ic=`,
  `https://appembed.netlify.app/e?description=Type%20VARroullette%20%40user1%20%40user2%20%40user3%20to%20randomly%20pick%20a%20loser%20from%20any%20of%20the%20mentioned%20participents.&color=%23FF0000&provider=TonyskalYT%27s%20selfbot&author=VARroullette`,
  `https://appembed.netlify.app/e?description=Type%20VARqroullette%20%40user1%20%40user2%20%40user3%20to%20randomly%20pick%20a%20loser%20from%20the%20mentioned%20users!%20This%20one%20is%20instant%20however%2C%20alot%20less%20fun%20for%20party%20games%20as%20it%20doesn%27t%20build%20up%20any%20intensity&color=%23FF0000&provider=TonyskalYT%27s%20selfbot&author=VARqroullette`,
  `https://appembed.netlify.app/e?description=Type%20%22VARremind%201m%20take%20out%20the%20trash%22%20to%20be%20reminded%20in%201%20minute%20to%20take%20out%20the%20trash%0A%0A30s%2C%205m%2C%202h%2C%201d&color=%23FF0000&author=VARremind`,
  `https://appembed.netlify.app/e?description=Type%20VARping%20to%20get%20the%20ping%20latency%20of%20discord%20to%20the%20host%20back%20to%20discord.&color=%23FF0000&provider=TonyskalYT%27s%20selfbot&author=VARping`
];
