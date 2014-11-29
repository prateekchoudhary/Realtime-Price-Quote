var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
http.listen(process.env.PORT || 3001);

// Redis client connection
var redis = require('redis');
var credentials = { "host": "127.0.0.1", "port": 6379 };
// Check if we are in BlueMix or localhost
/*
if(process.env.VCAP_SERVICES) {
  // On BlueMix read connection settings from
  // VCAP_SERVICES environment variable
  var env = JSON.parse(process.env.VCAP_SERVICES);
  credentials = env['redis-2.6'][0]['credentials'];
} else {
  // On localhost just hardcode the connection details
  credentials = { "host": "127.0.0.1", "port": 6379 }
}
*/
var redisClient;
var connectToRedis = function() {
  redisClient = redis.createClient(credentials.port, credentials.host);
  if('password' in credentials) {
    redisClient.auth(credentials.password);
  }
};
connectToRedis();

// There's an issue with the Redis client for Node where it
// will time out every so often and hang the client browser
// This code gets around this issue by reconnecting on timeout
var refreshRedis = function() {
  var replaceClient = function() {
    redisClient.closing = true;
    redisClient.end();

    connectToRedis();
    refreshRedis();
  };

  redisClient.once("end", function() {
    replaceClient();
  });
};
refreshRedis();

// Configure Jade template
var path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));

// handle HTTP GET request to the "/" URL
app.get('/', function(req, res) {
  function fetch( callback ) {
    var bidresult = new Array();
    redisClient.smembers('users', function(err, users) {
     if ( users.length == 0 )
         return callback( bidresult );
     if(!err) {
      users.forEach( function(username){
        console.log('username : '+username);
	redisClient.hgetall("username:"+username, function(errs, bid){
	  if(!errs) {
	    bidresult.push(bid);
            if(bidresult.length == users.length){
	      callback(bidresult);
	    }
	  }
	});
      });
     }
    });
  }

  fetch(function(bidresult){
      console.log(bidresult.length);
      res.render('index', { messages: bidresult });
  });
	/* 
      userresult.push(JSON.parse(users[user]));
      var bidresult = [];
      console.log('userresult = '+userresult[i].username);
      redisClient.hgetall("username:"+userresult[i].username, function(errs, bid) {
        if(!errs) {
	  bidresult.push(JSON.stringify(bid));
	  res.render('index', { messages: bidresult })
          //console.log('bidresult = '+bidresult);
        }
      });
	*/
   // i++;
   // }
   // console.log('bidresult = '+bidresult);
   // res.render('index', { messages: bidresult });
  //}else res.render('index');

 /* 
  redisClient.hgetall("username:pcs", function(err, reply) {
    if(!err) {        
      var result = [];
      //console.log(reply);
      result.push(reply);
      // Loop through the list, parsing each item into an object
      //for(var msg in reply) result.push(JSON.parse(reply[msg]));
      console.log(result);
      // Pass the message list to the view
      res.render('index', { messages: result });    
    } else res.render('index');
   
  });
  */
});

// socket.io listen for messages
io.on('connection', function(socket) {
  // When a message is received, broadcast it 
  // to all users except the originating client
  socket.on('msg', function(data) { //"{\"username\":\"pcs\"}"
    //var list_string = {"username":data.nickname};
    //redisClient.lpush('users', JSON.stringify(list_string));
    redisClient.sadd('users', data.nickname);
    redisClient.hmset('username:'+data.nickname, 'username', data.nickname, 'quote', data.msg, 'time', data.when);      
    //redisClient.lpush('messages', JSON.stringify(data));
    //redisClient.ltrim('messages', 0, 99);  
    socket.broadcast.emit('msg', data);        
  });

  // When a user joins the chat, send a notice
  // to all users except the originating client
  socket.on('join', function(nickname) {
    // Attach the user's nickname to the socket
    socket.nickname = nickname;
    socket.broadcast.emit('notice', nickname + ' has joined the bid pool.');
  });

  // When a user disconnects, send a notice
  // to all users except the originating client
  socket.on('disconnect', function() {
    socket.broadcast.emit('notice', socket.nickname + ' has left the bid pool.');
  });
});
