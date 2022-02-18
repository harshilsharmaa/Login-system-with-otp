const express = require('express')
const hbs = require('hbs');
const path = require('path');
const session = require('express-session');
const cookieParser = require("cookie-parser");  

const app = express();


// Session
app.use(session({
    secret: "efasdfasdf433",
    resave: false,
    saveUninitialized: false,
  }))

 
  app.use(cookieParser());


const bodyParser = require('body-parser');
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Path
const views_path = path.join(__dirname,'views');
app.set("view engine", 'hbs');

app.use(express.static(path.join(__dirname, '/public')))


app.get("/", (req,res)=>{
    res.render('index');
})


app.use('/api/user', require('./router/user'))





module.exports = app;

