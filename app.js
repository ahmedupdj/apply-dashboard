const Discord = require('discord.js');
const { token, domain, clientId,clientSecret,callbackURL,SupportServer,admin,id,moderator } = require("./config.json")
const client = new Discord.Client({
    intents: [
        Object.keys(Discord.GatewayIntentBits)
    ],
});
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const path = require('path');
const DiscordStrategy = require('passport-discord').Strategy;

const bodyParser = require('body-parser');
const url = require('url');
const app = express();
const port = 3000; 
//Data


const connectToDatabase = require('./Data/conecet')
connectToDatabase();




//end
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
passport.use(new DiscordStrategy({
    clientID: clientId,
    clientSecret: clientSecret,
    callbackURL: callbackURL,
    scope: ['identify', 'guilds'],
}, (accessToken, refreshToken, profile, done) => {
    process.nextTick(function() {
        return done(null, profile);
    });
}));

passport.serializeUser((user, done) => {
    done(null, user);
});
app.get('/invite',  (req, res) => {
    res.redirect(`https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&scope=bot&permissions=703687441776558`);
});
app.get('/sup',  (req, res) => {
    res.redirect(`${SupportServer}`);
});
app.get('/domain',  (req, res) => {
    res.redirect(`${domain}`);
});



passport.serializeUser(function(user, done) {
    done(null, user);
})       
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

app.use(session({
    store: new MemoryStore({checkPeriod:86400000}),
    secret: '#@%#&^$^$%@$^$&%#$%@#$%$^%&$%^#$%@#$%#E%#%@$FEErfgr3g#%GT%536c53cc6%5%tv%4y4hrgrggrgrgf4n',
    resave: false,
    saveUninitialized: false,
}));
app.use((req, res, next) => {
    req.session._token = token;
    next();
});
app.use(passport.initialize());
app.use(passport.session());

app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'ejs');
app.get("/login", (req, res, next) => {
    if (req.session.backURL) {
        req.session.backURL = req.session.backURL;
    } else if (req.headers.referer) {
        const parsed = url.parse(req.headers.referer);
        if (parsed.hostname === app.locals.domain) {
            req.session.backURL = parsed.path;
        }
    } else {
        req.session.backURL = "/";
    }
    next();
}, passport.authenticate("discord"));

app.get("/callback", passport.authenticate("discord", {
    failWithError: true,
    failureFlash: "There was an error logging you in!",
    failureRedirect: "/",
}), async (req, res) => {
    try {
        localStorage.setItem('loggedInUserId', req.user.id);
        const backURL = req.session.backURL || "/";
        req.session.backURL = null; 
        res.redirect(backURL);
    } catch (err) {
        res.redirect('/');
    }
});

    

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});


const checkAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    
    res.redirect('/login');
};

const renderTemplate = (res, req, template, data = {}) => {
    const baseData = {
        bot: client,
        path: req.path,
        _token: req.session['_token'],
        user: req.isAuthenticated() ? req.user : null
    };
    res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(baseData, data));
};


const templateDir = path.resolve(`${process.cwd()}${path.sep}/views`);
app.use("/css", express.static(path.resolve(`${templateDir}${path.sep}assets/css`)));
app.use("/images", express.static(path.resolve(`${templateDir}${path.sep}assets/images`)));
app.use("/js", express.static(path.resolve(`${templateDir}${path.sep}assets/js`)));


app.get('/', (req, res) => {
    renderTemplate(res, req, "index.ejs", {
        user: req.user,
        totalUsers: client.users.cache.size,
        totalGuilds: client.guilds.cache.size,
    });
    
});


app.get("/dashboard", checkAuth, async (req, res) => {
    let guilds = req.user.guilds.filter(g => g.permissions & 8);
    let numberOfGuilds = guilds.length; 

    renderTemplate(res, req, 'servers/dashboard.ejs', {
        guilds,
        numberOfGuilds, 
        req,
    });
});



const AutoReplaySettings = require('./Data/bots-shop/a7a');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

app.get('/server/:guildId/AutoReplay', checkAuth, async (req, res) => {
    const guildId = req.params.guildId; 

    try {
        let serverSettings = await AutoReplaySettings.find({ guildId });

        if (!serverSettings) {
            serverSettings = await AutoReplaySettings.create({ guildId });
        }

        const guild = client.guilds.cache.get(guildId);

        renderTemplate(res, req, 'servers/AutoReplay.ejs', {
            user: req.user,
            serverSettings,
            guild,
            guildId,
            bot: client,
        });

    } catch (error) {
        console.error('Error fetching Leave settings:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/server/:guildId/AutoReplay', checkAuth, async (req, res) => {
    const guildId = req.params.guildId; 
    const { question } = req.body; 

    try {
      if (!question) {
        return res.redirect(`/server/${guildId}/AutoReplay`, {
            alert:'يرجي كتابت السؤال والجواب'
        });
      }
  
      const newQa = new AutoReplaySettings({ question, guildId: req.params.guildId });
      await newQa.save();
  
      res.redirect(`/server/${guildId}/AutoReplay`);
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
});


app.post('/server/:guildId/AutoReplay/delete', checkAuth, async (req, res) => {
    const { questionId } = req.body;
    const guildId = req.params.guildId;
    
    try {
        const guild = client.guilds.cache.get(guildId);
  
        if (!guild) {
            return res.status(404).json({ message: 'Guild not found.' });
        }

        if (!ObjectId.isValid(questionId)) {
            return res.status(400).json({ message: 'Invalid questionId' });
        }

        await AutoReplaySettings.findByIdAndDelete(questionId);
        return res.status(200).json({ success: true, message: 'تم حذف السؤال بنجاح' });    
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
});



app.post('/server/:guildId/AutoReplay/:questionId', checkAuth, async (req, res) => {
    const { question } = req.body;
    const guildId = req.params.guildId;
  
    try {
      if (!question) {
        return res.redirect(`/server/${guildId}/AutoReplay`, {
            alert:'يرجي كتابت السؤال والجواب'
         });
      }
  
      const updatedQuestion = await AutoReplaySettings.findOneAndUpdate(
        { _id: req.params.questionId, guildID: req.params.guildID },
        { question },
        { new: true }
      );
  
      if (!updatedQuestion) return res.redirect(`/server/${guildId}/AutoReplay`, {
        alert:'السؤال غير موجود من الاساس'
     });
  
      res.redirect(`/server/${guildId}/AutoReplay`);
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });





app.listen(port, () => {
    console.log(`Dashboard is running at http://localhost:${port}`);
});
client.login(token);















function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function createID(length) {
    var result = '';
    var characters = '123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function makeidd(length) {
    var result = '';
    var characters = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function makeToken(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function getuser(id) {
    try {
        return client.users.fetch(id)
    } catch (error) {
        return undefined
    }
}