var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);
http.listen(process.env.PORT || 3000);

var redis = require('redis');
var credentials;
if(process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);
    credentials = env['redis-2.6'][0]['credentials'];
} else {
    credentials = {
        "host": "127.0.0.1",
        "port": 6379
    }
}
var redisClient = redis.createClient(credentials.port, credentials.host);
if('password' in credentials) {
    redisClient.auth(credentials.password);
}

// view engine setup
var path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));

// handle request to root URL
app.get('/', function(req, res) {
    var messages = redisClient.lrange('messages', 0, 99, function(err, reply) {
        if(!err) {
            var result = [];

            for(var msg in reply) {
                result.push(JSON.parse(reply[msg]));
            }

            res.render('index', { messages: result });    
        }
        
        else res.render('index');
    });    
});

// web socket handler
io.on('connection', function(socket) {    
    socket.on('msg', function(data) {        
        redisClient.lpush('messages', JSON.stringify(data));
        redisClient.ltrim('messages', 0, 99);
        socket.broadcast.emit('msg', data);        
    });

    socket.on('join', function(nickname) {
        socket.nickname = nickname;
        socket.broadcast.emit('notice', nickname + ' has joined the chat.');
    });

    socket.on('disconnect', function() {
        socket.broadcast.emit('notice', socket.nickname + ' has left the chat.');
    })
});