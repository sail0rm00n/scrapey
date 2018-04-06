// * Dependencies
const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
const axios = require('axios');
const mongoose = require('mongoose');
const logger = require('morgan');

// requiring env config
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// require models
// connect to the mongoDB
const db = require('./models');
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// Express setup with dependencies
const app = express();
require("./routes/routes.js")(app);

app.use(logger('dev'));
app.engine('handlebars', exphbs({
defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
extended: true
}));
app.use(bodyParser.json());

// scrape route that will get our articles
app.get('/scrapey', function (req, res) {
    db.Headline.deleteMany({saved: false}, function (err) {console.log(err)});
    axios.get('https://www.newyorker.com/news')
    .then(function (response) {
        const $ = cheerio.load(response.data);
        $('.m-posts.item-content').each(function (i, element) {
            const result = {};
            result.title = $(this).children('h2').children('a').text();
            result.url = $(this).children('h3').children('a').attr('href');

            result.summary = $(this).children('p.m-posts-item-intro').children('span').text();
            db.Headline.create(result).then(
                (dbHeadline) => {
                    console.log(dbHeadline);
                }
            )
        });
    });

    res.send('Scrapey');
});

app.listen(PORT, () => {
    console.log('App listening on PORT ' + PORT);
});