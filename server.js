var users = [];
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended : false });
app.use(urlencodedParser);
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.get('/', (req, res)=>{
    res.render('index', {error: ''});
});
app.post('/chat', (req, res)=>{
    if  (req.body.username.includes(' ')) {
        res.render('index', {error: 'Username cannot contain a space'});
    } else if (users.some((item)=>{return item.username === req.body.username})){
        res.render('index', {error: 'User already exist'});
    } else {
        res.render('chat', {username: req.body.username, users: users});   
    }
    console.log(req.body.username);
});
io.on('connection', (socket)=>{
    socket.on('new-user', (userNM)=>{
        socket.join('connectedUsers');
        var userCondition = users.some((item)=>{return item.username === userNM});
        if (!userCondition) {
            users[users.length] = {username: userNM, userID: socket.id};   
        };
        socket.broadcast.to('connectedUsers').emit('new-user', userNM);
        console.log(userCondition);
    });
    setTimeout(() => {
        console.log(users);
    }, 5000);
    console.log(`User-${socket.id} is connected`);
    socket.on('this-message', (data)=>{
        console.log(data);
    })
    socket.on('video-message', (stream)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        }
        socket.broadcast.emit('video-message-reply', stream);
    });
    socket.on('connection-request', (recipient)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        }
        var u = users.filter((item)=>{return item.username === recipient});
        var v = users.filter((item)=>{return item.userID === socket.id});
        socket.to(u[0].userID).emit('connection-request', v[0].username, recipient);
    });
    socket.on('connection-accepted', (sender, recipient)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        }
        var v = users.filter((item)=>{return item.username === sender});
        socket.to(v[0].userID).emit('connection-accepted', recipient);
    });
    socket.on('connection-rejected', (sender, recipient)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        }
        var v = users.filter((item)=>{return item.username === sender});
        socket.to(v[0].userID).emit('connection-rejected', recipient);
    });
    socket.on('send-message', (message, user)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        }
        var u = users.filter((item)=>{return item.username === user});
        var v = users.filter((item)=>{return item.userID === socket.id});
        socket.to(u[0].userID).emit('receive-message', message, v[0].username);
    });
    socket.on('video-call-request', (recipient, peerID)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        }
        var u = users.filter((item)=>{return item.username === recipient});
        var v = users.filter((item)=>{return item.userID === socket.id});
        socket.to(u[0].userID).emit('video-call-request', v[0].username, recipient, peerID);
    });
    socket.on('recipient-making-call-video', (user, recipient)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        }
        var v = users.filter((item)=>{return item.username === user});
        if (v.length !== 0) {
            socket.to(v[0].userID).emit('recipient-making-call-video', recipient);  
        };
        
    });
    socket.on('video-call-rejected', (user, recipient)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        }
        var v = users.filter((item)=>{return item.username === user});
        if (v.length !== 0) {
            socket.to(v[0].userID).emit('video-call-rejected', recipient);  
        };
        
    });
    socket.on('video-call-unanswered', (user, recipient)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        }
        var v = users.filter((item)=>{return item.username === user});
        if (v.length !== 0) {
            socket.to(v[0].userID).emit('video-call-unansered', recipient);  
        };
        
    });
    socket.on('video-call-unreachable', (user, recipient)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        }
        var v = users.filter((item)=>{return item.username === user});
        if (v.length !== 0) {
            socket.to(v[0].userID).emit('video-call-unreachable', recipient);  
        };
        
    });
    socket.on('disconnect-video-call', (recipient)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        };
        var v = users.filter((item)=>{return item.username === recipient});
        socket.to(v[0].userID).emit('disconnect-video-call', y[0].username);
    });
    socket.on('audio-call-request', (recipient, peerID)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        }
        var u = users.filter((item)=>{return item.username === recipient});
        var v = users.filter((item)=>{return item.userID === socket.id});
        socket.to(u[0].userID).emit('audio-call-request', v[0].username, recipient, peerID);
    });
    socket.on('recipient-making-call-audio', (user, recipient)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        }
        var v = users.filter((item)=>{return item.username === user});
        if (v.length !== 0) {
            socket.to(v[0].userID).emit('recipient-making-call-audio', recipient);  
        };
        
    });
    socket.on('audio-call-rejected', (user, recipient)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        }
        var v = users.filter((item)=>{return item.username === user});
        if (v.length !== 0) {
            socket.to(v[0].userID).emit('audio-call-rejected', recipient);  
        };
        
    });
    socket.on('audio-call-unanswered', (user, recipient)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        }
        var v = users.filter((item)=>{return item.username === user});
        if (v.length !== 0) {
            socket.to(v[0].userID).emit('audio-call-unanswered', recipient);  
        };
        
    });
    socket.on('audio-call-unreachable', (user, recipient)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        }
        var v = users.filter((item)=>{return item.username === user});
        if (v.length !== 0) {
            socket.to(v[0].userID).emit('audio-call-unreachable', recipient);  
        };
        
    });
    socket.on('disconnect-audio-call', (recipient)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        };
        var v = users.filter((item)=>{return item.username === recipient});
        socket.to(v[0].userID).emit('disconnect-audio-call', y[0].username);
    });
    socket.on('disconnect-user', (user)=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        if (y.length === 0) {
            socket.emit('user-not-connected');
            return;
        };
        var v = users.filter((item)=>{return item.username === user});
        socket.to(v[0].userID).emit('disconnect-user', y[0].username);
    });
    socket.on('disconnect', ()=>{
        var y = users.filter((item)=>{return item.userID === socket.id});
        var x = users.filter((item)=>{return item.userID !== socket.id});
        if (y.length === 0) {
            return
        } else {
            users = x;
            console.log(`User ${y[0].username} has disconnected`);
            console.log(users);
            console.log(socket.id);
            socket.broadcast.emit('user-disconnected', y[0].username);   
        };
    });
});
const PORT = process.env.PORT || 3003;
server.listen(PORT, ()=>{
    console.log(`Server created on ${PORT}`)
});