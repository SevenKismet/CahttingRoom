var express = require('express'), //引入express模块

    app = express(),

    server = require('http').createServer(app);

    io=require('socket.io').listen(server);
    users=[];

app.use('/', express.static(__dirname + '/www')); //指定静态HTML文件的位置

server.listen(8081);


io.on('connection',function(socket){
    socket.on('login',function(nickname){
        console.log(nickname);
        if(users.indexOf(nickname)>-1){
            socket.emit('nickExisted');
        }else{
            socket.userIndex=users.length;
            socket.nickname=nickname;
            users.push(nickname);
              socket.emit('loginSuccess');
              io.sockets.emit('system',nickname,users.length,'login');

        }
    });
      //接收新消息
      socket.on('postMsg', function(msg) {
        //将消息发送到除自己外的所有用户
        socket.broadcast.emit('newMsg', socket.nickname, msg);

    });
    // 发送图片
    socket.on('img', function(imgData) {
        //通过一个newImg事件分发到除自己外的每个用户
         socket.broadcast.emit('newImg', socket.nickname, imgData);
    });
    socket.on('disconncet',function(){
        //将断开的人从用户中删除
             console.log('用户断开连接')
        users.splice(socket.userIndex,1);
        // 通知所有用户
        socket.broadcast.emit('system',socket.nickname,users.length,'logout');
    })

})