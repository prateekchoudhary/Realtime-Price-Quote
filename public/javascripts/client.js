$(document).ready(function() {
  var socket = io(), nickname, msgList = $('#messages');
  //Nishant Since I am not using any DB so I am treating nickname as a variable and stroing it inside browser localStorage
  // Check if nickname stored in localStorage
  if('localStorage' in window && localStorage.getItem('nickname')) {
    //localStorage.removeItem("nickname");// Please uncomment this line if you want to reset the username refresh ur browser once choose new nickname
    nickname = localStorage.getItem('nickname');
  } else {
    // If not in localStorage, prompt user for nickname
    nickname = prompt('Please enter your nickname');
    if('localStorage' in window) {
      localStorage.setItem('nickname', nickname);
    }
  }  

  // Send message to server that user has joined
  socket.emit('join', nickname);

  // Function to add a message to the page
  var newMessage = function(data) {
    var who = $('<div class="who">').text(data.nickname),
        when = $('<div class="when">').text(new Date().toString().substr(0, 24)),
        msg = $('<div class="msg">').text(data.msg);
	var tempClass = ".header.clearfix."+data.nickname;
    	if($(tempClass).length == 0){
	  header = $('<div class="header clearfix '+data.nickname+'">').append(who).append(msg).append(when),
          li = $('<li>').append(header);
          msgList.prepend(li);
    	}else{
	  $(tempClass).html('<div class="who">'+data.nickname+'</div><div class="msg">'+data.msg+'</div><div class="when">'+new Date().toString().substr(0, 24)+'</div>');
        }
  };

  // Handle the form to submit a new message
  $('form').submit(function(e) {
    var msgField = $('#msg'),        
        data = { msg: msgField.val(), nickname: nickname, when: new Date() };

    e.preventDefault();
    // Send message to Socket.io server
    socket.emit('msg', data);
    // Add message to the page
    newMessage(data);
    // Clear the message field
    msgField.val('');    
  });  

  // When a message is received from the server
  // add it to the page using newMessage()
  socket.on('msg', function(data) { newMessage(data); });

  // When a notice is received from the server
  // (user joins or disconnects), add it to the page
  socket.on('notice', function(msg) {
    $('.notice').html(msg);
  });
});
