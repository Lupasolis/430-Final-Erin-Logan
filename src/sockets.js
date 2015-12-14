var models = require('./models');
var controllers = require('./controllers');
var Account = models.Account;

var io; //socket.io server 

var users = [ ]; //stores all the users
var votes = [ ]; //checks whether all users have voted and stores the votes 
var rooms = [ ]; //stores the rooms and their corresponding game states, unused in this iteration
var gameStatus = 'day'; //stores the current game status
var locked = false; //checks to see if new people can be added to the game


//when a user joins the game, it adds them to the room
var onJoined = function(socket) {
	socket.on("join", function(data) {

		var joinMsg = {
			name: 'Server',
			msg: 'There are ' + Object.keys(users).length + ' users online'
		};

		socket.emit('msg', joinMsg);
		
		console.log("stats = " + data.name + " " + data.health + " " + data.role); 
		//stores the player's stats
		socket.name = data.name;
		socket.health = data.health; 
		socket.role = data.role; 

		socket.join('room1');
		socket.broadcast.to('room1').emit('msg', {
			name: 'Server',
			msg: data.name + " has joined the room."
		} );
		socket.emit('msg', {
			name: 'server',
			msg: 'You joined the room'
		});
		if(!locked){
			users.push(socket.name); 
			console.log("New player: " + socket.name);
		}
	});
};

//outputs a message a user sends to the entire chat
var onMsg = function(socket) {
	socket.on('msgToServer', function(data) {
		var message = data.msg.toString().trim();
		
		if(message == "/roll"){ //allows the user to roll, might allow for random decision making
			var num = Math.floor((Math.random() * 6) + 1); //finds a random number between 1 and 6
			data.msg = " rolls a " + num; 
			data.type = 1;
		}else if(message == "/howl"){
			data.msg = " howls to the full moon.";
			data.type = 1;
		}else {
			data.type = 0;
		}
		//emits the message to the entire room
		io.sockets.in('room1').emit('msg', {
			name: socket.name,
			msg: data.msg,
			type: data.type 
		});
	});
};

//when a user submits a vote during the day time phase
var onVote = function(socket) {
	socket.on('voteToServer', function(data) {
		console.log("The gameStatus = " + gameStatus);

		console.log("The villagers are " + users);
		//if the game is in the day phase, it allows users to vote
		if(gameStatus == 'day'){
			console.log("Vote accepted!"); 
			
			//checks to see if a valid user is being voted out
			for(var i = 0; i<= users.length; i++){
				if(data.vote == users[i]){
					votes.push(data.vote); 
				}
			}
			
			//http://www.w3schools.com/js/js_array_methods.asp
			//adds the vote to the votes array
			
			console.log("The votes are " + votes);
			console.log("The last vote was " + data.vote);
			
			
			//if everyone has voted
			if(votes.length == users.length){
				console.log("The votes are in!"); 
				console.log("There are " + votes.length + " ballots");
				console.log("There are " + users.length + " voters");
				var ballots = [ ]; //stores an amount of ballots
				var winBallots = [ ]; //stores the amount of "winning" ballots
				
				//compares the votes to find the player with the most votes
				for(var i = 0; i <= votes.length; i++){
					//console.log("HIT ME!");
					for(var j = i+1; j <= votes.length; j++){
						
						if(votes[i] == votes[j]){
							//console.log("HIT ME HARDER!");
							ballots.push(votes[i]);
						}
					}
					//if the number of ballots is greater than the current number of winning ballots
					if(ballots.length > winBallots.length){
						winBallots = ballots; 
						ballots = [];
						console.log(winBallots[0] + " is in the lead!"); 
					} 
					//if the number of ballots is equal to the current number of winning ballots
					//this is not proper, but due to time constraints I couldn't figure out a system for this case
					else if(ballots.length == winBallots.length){
						winBallots = ballots; 
						ballots = [];
						console.log(winBallots[0] + " is in the lead!"); 
					}
					//if the number of ballots is less than the number of winning ballots
					else{
						ballots = []; //empties the ballots array to start the count again
						console.log(winBallots[0] + " is in the lead!"); 
					}
				}
				
				//informs the user which player was removed
				io.sockets.in('room1').emit('voted', {
					winner: winBallots[0],
					msg: winBallots[0] + " has been hanged"
				});
				users.splice(users.indexOf(winBallots[0]), 1); //removes the dead character from the pool of users
				votes = [ ]; //empties the votes array
			}
		}else {
			console.log("You can't vote yet");
		}
	});

};


//when a user disconnects, it removes them from the user array and informs the rest of the room
var onDisconnect = function(socket) {
	socket.on('disconnect', function(data) {
		users.splice(users.indexOf(socket.name), 1); //removes the user from the array
		
		//informs all of the users within the room that someone disconnected
		io.sockets.in('room1').emit('msg', {
			name: 'Server',
			msg: socket.name + " has left the village."
		});
	});
};

//when the game switches to the day phase
var onNewDay = function(socket){
	socket.on('newDay', function(data){
		io.sockets.in('room1').emit('day', {
			village: users
		});		
		gameStatus = 'day'; 	
	});
	
};

//when the game switches to the night phase
var onNewNight = function(socket){
	socket.on('newNight', function(data){
		io.sockets.in('room1').emit('night', {
			village: users
		});
		gameStatus = 'night';
	});
};

//https://github.com/IGM-RichMedia-at-RIT/LiveStreamR/blob/master/src/socket.js
//configures the various sockets
var configureSockets = function(socketio) {
	io = socketio; 
	
    //on new socket connections
	io.sockets.on('connection', function(socket) { 
		console.log('connected'); 
		
		//calls event listener functions
		onJoined(socket);
		onMsg(socket);
		onVote(socket); 
		onDisconnect(socket);
		onNewNight(socket);
		onNewDay(socket); 
		 
	});
 
};

module.exports.configureSockets = configureSockets;