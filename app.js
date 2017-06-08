var express = require('express');
var bodyParser = require("body-parser");
var path = require('path');
var game = require('./Game/game');

var Game = new game.Game();

var app = express();

//View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));

// Set Static Path
//app.use(express.static(path.join(__dirname, 'config')));

var array = ["test", "test"];
app.get('/', function(req, res){
	res.render('index', {
		title: "Hello",
		plays: Game.getPlays()
	});
});

app.listen(3000, function(){


});