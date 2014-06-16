$(document).ready(function() {
  var nickname;
  if('localStorage' in window && localStorage.getItem('nickname')) {
    nickname = localStorage.getItem('nickname');
  } else {
    nickname = prompt('Please enter your nickname');
    if('localStorage' in window) {
      localStorage.setItem('nickname', nickname);
    }
  }
  var socket = io();

  var msgList = $('#messages');

  socket.emit('join', nickname);

  var newMessage = function(data, me) {
    var now = new Date(),
        hours = now.getHours(),
        mins = now.getMinutes(),
        secs = now.getSeconds();

    hours = ((hours < 10) ? "0" : "") + hours + ":";
    mins = ((mins < 10) ? "0" : "") + mins + ":";
    secs = ((secs < 10) ? "0" : "") + secs;

    var currentTime = hours + mins + secs;

    var who = $('<div class="who">').text(data.nickname + (me ? " (That's you!)" : ""));
    var when = $('<div class="when">').text(currentTime);
    var msg = $('<div class="msg">').text(data.msg);

    var header = $('<div class="header clearfix">').append(who).append(when);

    var li;
    if(me) { 
      li = $('<li class="me">'); 
    } else {
      li = $('<li>');
    }    
    li.append(header);
    li.append(msg);

    msgList.prepend(li);
  };

  $('form').submit(function(e) {
    var msgField = $('#msg'),
        msg = msgField.val(),
        data = {
          msg: msg,
          nickname: nickname
        };

    socket.emit('msg', data);

    newMessage(data, true);
    msgField.val('');

    e.preventDefault();
  });  

  socket.on('msg', function(data) {
    newMessage(data, false);        
  });

  socket.on('notice', function(msg) {
    msgList.prepend($('<div class="notice">').text(msg));
  });
});