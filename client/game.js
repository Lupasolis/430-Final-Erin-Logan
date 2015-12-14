"use strict";

function init() {
	
    var message = document.querySelector("#message");
	var chat = document.querySelector("#chat");
	var users = []; //stores the names of all active users
	//var votes = []; //stores the votes of the users
	
	var dayScreen = new Image();
	dayScreen.src = '/assets/img/dayPhase.png'; 
	var nightScreenV = new Image();
	nightScreenV.src = '/assets/img/nightPhaseV.png'; 
	dayScreen.onload = function(){
		switchState(2, ctx, game.width, game.height, dayScreen);  
	}
    //connect our socket
    var socket = io.connect(); 
	
	var game = document.querySelector("#wolfNight"); 
    var ctx = game.getContext('2d'); 
    
    ctx.textAlign = "center";
	
    //once the socket connects, assigns stats
    socket.on('connect', function(){
        console.log('websockets connects!');   
		var number = (Math.floor((Math.random() * 100) + 1)).toString(); 
		socket.emit('join', { name: "Player" + number, health: "healthy",  role: "villager", place: "village"});
		
    });
	
	//listener for msg event
	socket.on('msg', function(data) {
		console.log(data);
		var dataString;
			
		//checks to see what kind of msg it is
		if(data.type == 1){
			dataString = data.name + data.msg + "\n"; 
		}else if(data.type == 2){
			dataString = ''; 
		}else {
			dataString = data.name + ": " + data.msg + "\n";
		} 
		chat.value += dataString; //adds the message to the chat window
	});
	
	//listener for voted event, changes the display after the 
	socket.on('voted', function(data) {
		console.log(data.winner + " has died.");
		chat.value += data.msg + "\n"; 
		
		switchState(4, ctx, game.width, game.height, data.winner);
		//http://www.w3schools.com/jsref/met_win_settimeout.asp
		setTimeout(function(){ socket.emit("newNight")}, 5000);
	});
	
	
	//listener for day event
	socket.on('day', function(data) {
		console.log("Daytime!");
		switchState(2, ctx, game.width, game.height, dayScreen); 
	});
	//listener for night event
	socket.on('night', function(data) {
		console.log("Nighttime!");
		switchState(3, ctx, game.width, game.height, nightScreenV); 
	});
	
	
	var send = document.querySelector("#send"); 
	send.addEventListener('click', msgToServer);
	
	var vote = document.querySelector("#vote"); 
	vote.addEventListener('click', voteToServer);

}
window.onload = init;

//a function that sends a chat message to the server
function msgToServer(e){
		
	var message = document.getElementById("message");
	var chat = document.querySelector("#chat");
		
	var socket = io.connect();
	var m = message.value; 
	
	
	socket.emit("msgToServer", { msg: m}); 
		
}

//sends a vote to the server
function voteToServer(e){
		
	var ballot = document.getElementById("ballot");
		
	var socket = io.connect();
	
	var v = ballot.value; 
	//console.log("My vote is " + v);
	socket.emit("voteToServer", { vote: v}); 
		
}

//a function to change what is displayed depending on the game state
function switchState(gs,ctx,w,h, data){

	switch(gs){
		case 0: //game menu
			ctx.fillStyle = "blue";
			ctx.fillRect(0,0,w,h); 
			ctx.fillStyle = "white"; 
			ctx.font = "100px Times New Roman"; 
			ctx.fillText("Wolf Night", w/2,h/2); 
	
			break;
			
		case 1: //game lobby
			ctx.fillStyle = "blue";
			ctx.fillRect(0,0,w,h); 
			ctx.fillStyle = "white"; 
			ctx.font = "50px Times New Roman"; 
			ctx.fillText("Game Lobby", w/2,h/2); 
			
			break;
			
		case 2: //Day Phase
			ctx.fillStyle = "white";
			ctx.drawImage(data,0,0); 
			
			break;
			
		case 3: //Night Phase, villager
			ctx.fillStyle = "white";
			ctx.drawImage(data,0,0); 
			
			break;
			
		case 4: //Vote Result Page
			ctx.fillStyle = "white";
			ctx.fillRect(0,0,w,h); 
			ctx.fillStyle = "black"; 
			ctx.font = "30px Times New Roman"; 
			ctx.fillText(data + " has perished...", w/2,h/2); 
			ctx.fillText("But the wolf is still among you...", w/2, (h/2)+70); 
			break;
			
		case 5: //Night Phase, werewolf
			ctx.fillStyle = "white";
			ctx.fillRect(0,0,w,h); 
			ctx.fillStyle = "black"; 
			ctx.font = "100px Times New Roman"; 
			ctx.fillText("Night Time", w/2,h/2); 
			
			break;
			
		case 6: //Night Result Page
			ctx.fillStyle = "black";
			ctx.fillRect(0,0,w,h); 
			ctx.fillStyle = "white"; 
			ctx.font = "100px Times New Roman"; 
			ctx.fillText("The night is over...", w/2,h/2); 
			
			break;
			
		case 7: //game over state
				
			//outputs text
			ctx.fillStyle = "white"; 
			ctx.font = "50px Times News Roman"; 
			ctx.fillText("Game Over", w/2, h/2); 

			break; 
			
		case 8: //rules page
			ctx.fillStyle = "white"; 
			ctx.font = "30px Times News Roman";
			ctx.fillText("Rules", w/2, h/2); 
			break; 
		}
	
};
