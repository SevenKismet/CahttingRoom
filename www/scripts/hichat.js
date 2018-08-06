window.onload = function () {
     window.onbeforeunload = onbeforeunload_handler;
      window.onunload = onunload_handler;
    //实例并初始化我们的hichat程序

    var hichat = new HiChat();

    hichat.init();

    function onbeforeunload_handler() {
        var warning = "确认退出?";
        return  warning;
    }

    function onunload_handler() {
        hichat.socket.emit('disconncet')
    }

};

//定义我们的hichat类

var HiChat = function () {

    this.socket = null;

};



//向原型添加业务方法

HiChat.prototype = {

    init: function () { //此方法初始化程序

        var that = this;

        //建立到服务器的socket连接

        this.socket = io.connect();

        //监听socket的connect事件，此事件表示连接已经建立
        //昵称设置的确定按钮

        document.getElementById('loginBtn').addEventListener('click', function () {

            var nickName = document.getElementById('nicknameInput').value;

            //检查昵称输入框是否为空

            if (nickName.trim().length != 0) {

                //不为空，则发起一个login事件并将输入的昵称发送到服务器

                that.socket.emit('login', nickName);

            } else {

                //否则输入框获得焦点

                document.getElementById('nicknameInput').focus();

            }
            ;

        }, false);

        this.socket.on('connect', function () {

            //连接到服务器后，显示昵称输入框

            document.getElementById('info').textContent = '请输入您的昵称:)';

            document.getElementById('nickWrapper').style.display = 'block';

            document.getElementById('nicknameInput').focus();

        });
        this.socket.on('nickExisted', function () {
            document.getElementById('info').textContent = '用户名已存在，请重新输入'
        });
        this.socket.on('loginSuccess', function () {
            document.title = 'hichat | ' + document.getElementById('nicknameInput').value;
            document.getElementById('loginWrapper').style.display = 'none'; //隐藏遮罩层显聊天界面
            document.getElementById('messageInput').focus(); //让消息输入框获得焦点
        })
        this.socket.on('system', function (nickname, userCount, type) {
            var msg = nickname + (type == 'login' ? '加入' : '离开');
            var p = document.createElement('p');
            p.textContent = msg;
            // document.getElementById('historyMsg').appendChild(p);
            that._displayNewMsg('系统消息 ', msg, 'red');
            // 把所有人数显示到顶部
            document.getElementById('status').textContent = userCount + '人在线';


        })
        // 发送消息
        document.getElementById('sendBtn').addEventListener('click', function () {
            var messageInput = document.getElementById('messageInput'),
                color = document.getElementById('colorStyle').value;
            msg = messageInput.value;
            messageInput.value = '';
            messageInput.focus();
            if (msg.trim().length != 0) {

                that.socket.emit('postMsg', msg, color); //把消息发送到服务器

                that._displayNewMsg('me', msg, color); //把自己的消息显示到自己的窗口中


            }
            ;

        }, false);
        // 断开连接



        // 显示消息
        this.socket.on('newMsg', function (user, msg, color) {

            that._displayNewMsg(user, msg, color);

        });

        // 发送图片功能
        document.getElementById('sendImage').addEventListener('change', function () {
            //检查是否有文件被选中
            if (this.files.length != 0) {
                //获取文件并用FileReader进行读取
                var file = this.files[0],
                    reader = new FileReader();
                if (!reader) {
                    that._displayNewMsg('系统消息', '!your browser doesnt support fileReader', 'red');
                    this.value = '';
                    return;
                }
                ;
                reader.onload = function (e) {
                    //读取成功，显示到页面并发送到服务器
                    this.value = '';
                    that.socket.emit('img', e.target.result);
                    that._displayImage('me', e.target.result);
                };
                reader.readAsDataURL(file);
            }
            ;

        }, false);
        // 显示图片
        this.socket.on('newImg', function (user, img) {
            that._displayImage(user, img);
        });
        //    表情包
        this._initialEmoji();
        // 点击选择
        document.getElementById('emoji').addEventListener('click', function (e) {

            var emojiwrapper = document.getElementById('emojiWrapper');

            emojiwrapper.style.display = 'block';

            e.stopPropagation();

        }, false);
// 点击别的地方关闭
        document.body.addEventListener('click', function (e) {

            var emojiwrapper = document.getElementById('emojiWrapper');

            if (e.target != emojiwrapper) {

                emojiwrapper.style.display = 'none';

            }
            ;

        });
// 显示被点击表情包
        document.getElementById('emojiWrapper').addEventListener('click', function (e) {

            //获取被点击的表情

            var target = e.target;

            if (target.nodeName.toLowerCase() == 'img') {

                var messageInput = document.getElementById('messageInput');

                messageInput.focus();

                messageInput.value = messageInput.value + '[emoji:' + target.title + ']';

            }
            ;

        }, false);

// 接受回车事件
        document.getElementById('nicknameInput').addEventListener('keyup', function (e) {

            if (e.keyCode == 13) {

                var nickName = document.getElementById('nicknameInput').value;

                if (nickName.trim().length != 0) {

                    that.socket.emit('login', nickName);

                }
                ;

            }
            ;

        }, false);

        document.getElementById('messageInput').addEventListener('keyup', function (e) {

            var messageInput = document.getElementById('messageInput'),

                msg = messageInput.value,

                color = document.getElementById('colorStyle').value;

            if (e.keyCode == 13 && msg.trim().length != 0) {

                messageInput.value = '';

                that.socket.emit('postMsg', msg, color);

                that._displayNewMsg('me', msg, color);

            }
            ;

        }, false);

    },
    _displayNewMsg: function (user, msg, color) {

        var container = document.getElementById('historyMsg'),

            msgToDisplay = document.createElement('p'),

            date = new Date().toTimeString().substr(0, 8),

            //将消息中的表情转换为图片

            msg = this._showEmoji(msg);

        msgToDisplay.style.color = color || '#000';

        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + msg;

        container.appendChild(msgToDisplay);

        container.scrollTop = container.scrollHeight;


    },
    _displayImage: function (user, imgData, color) {

        var container = document.getElementById('historyMsg'),

            msgToDisplay = document.createElement('p'),

            date = new Date().toTimeString().substr(0, 8);

        msgToDisplay.style.color = color || '#000';

        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';

        container.appendChild(msgToDisplay);

        container.scrollTop = container.scrollHeight;

    },
    _initialEmoji: function () {

        var emojiContainer = document.getElementById('emojiWrapper'),

            docFragment = document.createDocumentFragment();

        for (var i = 69; i > 0; i--) {

            var emojiItem = document.createElement('img');

            if (i < 10) {
                i = '0' + i;
            }
            emojiItem.src = '../content/' + i + '.gif';

            emojiItem.title = i;

            docFragment.appendChild(emojiItem);

        }
        ;

        emojiContainer.appendChild(docFragment);

    },
    _showEmoji: function (msg) {

        var match, result = msg,

            reg = /\[emoji:\d+\]/g,

            emojiIndex,

            totalEmojiNum = document.getElementById('emojiWrapper').children.length;

        while (match = reg.exec(msg)) {

            emojiIndex = match[0].slice(7, -1);

            if (emojiIndex > totalEmojiNum) {

                result = result.replace(match[0], '[X]');

            } else {

                result = result.replace(match[0], '<img class="emoji" src="../content/' + emojiIndex + '.gif" />');

            }
            ;

        }
        ;

        return result;

    },
    _disconnect: function () {
        console.log()
        alert('调用断开连接')
        this.socket.emit('disconncet');
    }


};