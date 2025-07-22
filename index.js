// index.js

// Set up express, bodyparser and EJS
const express = require('express');
const app = express();
const port = 3000;
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); // set the app to use ejs for rendering
app.use(express.static(__dirname + '/public')); // set location of static files

// Set up SQLite
// Items in the global namespace are accessible throught out the node application
const sqlite3 = require('sqlite3').verbose();
global.db = new sqlite3.Database('./database.db',function(err){
    if(err){
        console.error(err);
        process.exit(1); // bail out we can't connect to the DB
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON"); // tell SQLite to pay attention to foreign key constraints

        // Automatically create the schema if DB is empty
        const fs = require('fs');
        const schema = fs.readFileSync('./db_schema.sql', 'utf8');

        global.db.exec(schema, (err) => {
            if (err) {
                console.error("Failed to initialize schema:", err.message);
            } else {
                console.log("Database schema created or already exists.");
            }
        });

    }
});

// Handle requests to the home page 
app.get('/', (req, res, next) => {
  global.db.get("SELECT * FROM settings LIMIT 1", [], (err, settings) => {
    if (err) return next(err);
    // render plain homepage without site branding
    res.render("home.ejs");
  });
});

const session = require("express-session");

app.use(session({
  secret: 'secureRandomSessionSecret',
  resave: false,
  saveUninitialized: false
}));

// Organiser routes
const organiserRoutes = require('./routes/organiser.js');
app.use('/organiser', organiserRoutes);

// Attendee routes
const attendeeRoutes = require("./routes/attendee");
app.use("/attendee", attendeeRoutes);

// Make the web application listen for HTTP requests
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

