var path = require('path');
var express = require('express');
var compression = require('compression');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose'); 
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var url = require('url');
var csrf = require('csurf');
var http = require('http');
var sockets = require('./sockets.js'); //pull in our socket library
var socketio = require('socket.io'); 


var dbURL = process.env.MONGOLAB_URI || "mongodb://localhost/WolfNight";

var db = mongoose.connect(dbURL, function(err){
	if(err){
		console.log("Could not connect to database");
		throw err;
	}
});

var redisURL = {
	hostname: 'localhost',
	port: 6379
};

var redisPASS;

if(process.env.REDISCLOUD_URL){
	redisURL = url.parse(process.env.REDISCLOUD_URL);
	redisPASS = redisURL.auth.split(":")[1];
}

var router = require('./router.js');

var server; 
var port = process.env.PORT || process.env.NODE_PORT || 3000; //the port equals the port specificied by the user or heroku or defaults to port 3000

var app = express();

/*
//http://stackoverflow.com/questions/25000275/socket-io-error-hooking-into-express-js
var server = http.createServer(app); 
var io = require('socket.io').listen(server);
*/
app.use('/assets', express.static(path.resolve(__dirname +'../../client/')));
app.use(compression());
app.use(bodyParser.urlencoded({
	extended: true
}));

//app creates the session
app.use(session({
	key: "sessionid",
	store: new RedisStore({
		host: redisURL.hostname,
		port: redisURL.port,
		pass:redisPASS
	}),
	secret: 'Peter Stubbe',
	resave: true,
	saveUninitialized: true,
	cookie: {
		httpOnly: true
	}
}));

//sets up the views for use
app.set('view engine', 'jade'); 
app.set('views', __dirname + '/views');
app.use(favicon(__dirname +'/../client/img/favicon.ico'));
app.disable('x-powered-by');
app.use(cookieParser());

app.use(csrf());
//if there is an error with a request or response
app.use(function (err, req, res, next){
	if(err.code !== 'EBADCSRFTOKEN') return next(err); 
		
	return;
});

router(app);

//https://github.com/IGM-RichMedia-at-RIT/LiveStreamR/blob/master/src/app.js
server = app.listen(port, function(err){
	if(err){
		throw err;
	}
	console.log('Listening on port ' + port);
});
/*
io.sockets.on("connection", function(socket) {
	console.log("Connected!"); 
	socketMVC.init(io, socket, {
    debug: true,
    filePath: [__dirname +'/../client/client.js']
  });
});

*/

var io = socketio.listen(server);

sockets.configureSockets(io);

module.exports.db = db;