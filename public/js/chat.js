const socket = io();
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const localAudio = document.getElementById('local-audio');
const remoteAudio = document.getElementById('remote-audio');
const videoCallContainer = document.getElementById('video-call');
const audioTime = document.getElementById('audio-call-time');
const videoTime = document.getElementById('video-call-time');
const MN = document.getElementById('maximize-notification');
const CB = document.getElementById('cd-back');
const AU = document.getElementById('add-user');
const UB = document.getElementById('ul-back');
const OS = document.getElementById('open-sv');
const SB = document.getElementById('sv-back');
let localVideoStream, localAudioStream, remoteVideoStream, remoteAudioStream, makingACall = false, peerID, peerCall, callUser = undefined;
let audioMinutes = 0, audioSeconds = 0, videoMinutes = 0, videoSeconds = 0;
let receivedRequest = [], sentRequest = [], connectedUsers = [], disconnectedUsers = [], pDisconnectedUsers = [];
let countAudioTime = setInterval(addAudioTime, 1000);
let countVideoTime = setInterval(addVideoTime, 1000);
var peer = new Peer();
peer.on('open', (id)=>{
    peerID = id;
});
peer.on('call', (call)=> {
    peerCall = call;
    console.log('call received');
    if (localVideoStream) {
        call.answer(localVideoStream);
    } else if(localAudioStream){
        call.answer(localAudioStream);
    };
    call.on('stream', (remoteStream)=> {
        if (remoteStream.getTracks().length === 1) {
            callUser = document.getElementById('audio-call').className;
            audioSeconds = 0;
            audioMinutes = 0;
            audioTime.style.display = 'block';
            remoteAudio.srcObject = remoteStream;
            remoteAudioStream = remoteStream;
            remoteAudio.autoplay = true;
        } else{
            callUser = document.getElementById('video-call').className;
            videoSeconds = 0;
            videoMinutes = 0;
            videoTime.style.display = 'block';
            remoteVideo.srcObject = remoteStream;
            remoteVideoStream = remoteStream;
            remoteVideo.autoplay = true;
            localVideo.style.minHeight = '5%';
            localVideo.style.minWidth = '5%';
            localVideo.style.maxHeight = '20%';
            localVideo.style.maxWidth = '20%';
            localVideo.style.right = `0px`;
        };
    });
});
if (!(UB.classList.contains('ub-hidden'))) {
    UB.classList.toggle('ub-hidden');
};
if (!(Array.from(document.getElementById('users-list').children).length > 3)) {
    noUser(document.getElementById('users-list'), 'No User Online', 'users-list');
};
if (!(Array.from(document.getElementById('connected-users').children).length > 2)) {
    noUser(document.getElementById('connected-users'), 'Not Connected To A User', 'connected-users');
};
const documentList = document.querySelectorAll('.users-list');
const sendMessageButton = document.getElementById('send-message-button');
const messageText = document.getElementById('message-text');
let iceServers = {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    }]
};
documentList.forEach((item)=>{
    item.onclick = ()=> {
        sendConnectionRequest(item);
    };
});
sendMessageButton.addEventListener('click', (e)=>{
    e.preventDefault();
    if (messageText.value.trim().length === 0) {
        return;
    } else if(sendMessageButton.className == ""){
        return;
    }else {
        sendMessage(messageText.className, messageText.value);
        messageText.value = '';
    };
});
window.addEventListener('click', (e)=>{
    if (document.getElementById('side-view').contains(e.target)) {
        return;
    } else {
        if (document.getElementById('open-sv').contains(e.target)) {
            if (!(document.getElementById('side-view').classList.contains('side-view-opened'))) {
                document.getElementById('side-view').classList.toggle('side-view-opened');
            };
        } else if (document.getElementById('side-view').classList.contains('side-view-opened')) {
            document.getElementById('side-view').classList.toggle('side-view-opened');
        } else{
            return;
        };
    };
});
MN.onclick = ()=>{
    if (!(document.getElementById('chat-display').classList.contains('p-open-chat-display'))) {
        document.getElementById('chat-display').classList.toggle('open-chat-display');
        document.getElementById('cd-back').classList.toggle('hide-cb');
    };
    document.getElementById('notification').classList.toggle('open-notification');
};
CB.onclick = ()=>{
    if (document.getElementById('chat-display').classList.contains('p-open-chat-display')) {
        document.getElementById('chat-display').classList.toggle('p-open-chat-display');
        document.getElementById('message-form').classList.toggle('p-open-message-form');
    };
};
AU.onclick = ()=>{
    if (!(document.getElementById('users-list').classList.contains('open-users-list'))) {
        document.getElementById('users-list').classList.toggle('open-users-list');
    };
};
UB.onclick = ()=>{
    if (document.getElementById('users-list').classList.contains('open-users-list')) {
        document.getElementById('users-list').classList.toggle('open-users-list');
    };
};
/*OS.onclick = ()=>{
    if (!(document.getElementById('side-view').classList.contains('side-view-opened'))) {
        document.getElementById('side-view').classList.toggle('side-view-opened');
    };
}*/
SB.onclick = ()=>{
    if (document.getElementById('side-view').classList.contains('side-view-opened')) {
        document.getElementById('side-view').classList.toggle('side-view-opened');
    };
}
// socket connections
socket.emit('new-user', username);
console.log(username);
socket.on('new-user', (user)=>{
        newUser(user);
});
socket.on('user-disconnected', (user)=>{
    if(Array.from(document.body.children).includes(document.getElementById('video-call-ring-'+user)) || Array.from(document.getElementById('notification').children).includes(document.getElementById('video-call-ring-'+user))){
        document.getElementById('video-call-ring-'+user).remove();
    } else if(Array.from(document.body.children).includes(document.getElementById('audio-call-ring-'+user)) || Array.from(document.getElementById('notification').children).includes(document.getElementById('audio-call-ring-'+user))){
        document.getElementById('audio-call-ring-'+user).remove();
    };
    const x = document.getElementById('message-text').className;
    document.getElementById(user).remove();
    pDisconnectedUsers[pDisconnectedUsers.length] = user;
    if (makingACall == true && callUser == user) {
        if (document.getElementById('video-call').style.display !== 'none') {
            if (peerCall) {
                peerCall.close();   
            };
            videoSeconds = 0;
            videoMinutes = 0;
            videoTime.style.display = 'none';
            localVideoStream.getTracks().forEach(track => track.stop());
            localVideo.srcObject = undefined;
            localVideoStream = undefined;
            remoteVideo.srcObject = undefined;
            document.getElementById('video-call').style.display = 'none';
            makingACall = false;
            localVideo.style.minHeight = '100%';
            localVideo.style.minWidth = '100%';    
            localVideo.style.right = '0px';
        } else if(document.getElementById('audio-call').style.display !== 'none'){
            if (peerCall) {
                peerCall.close();   
            };
            audioSeconds = 0;
            audioMinutes = 0;
            audioTime.style.display = 'none';
            localAudioStream.getTracks().forEach(track => track.stop());
            localAudio.srcObject = undefined;
            localAudioStream = undefined;
            remoteAudio.srcObject = undefined;
            document.getElementById('audio-call').style.display = 'none';
            makingACall = false;
        };
    };
    if (receivedRequest.includes(user)) {
        document.getElementById(`connection-request-${user}`).remove();
    };
    if(connectedUsers.includes(user) && x === user){
        document.getElementById(user+'-connected').id = user + '-p-disconnected';
        connectedUsers = connectedUsers.filter((item)=>{ return item !== user});
        document.getElementById('message-text').disabled = true;
        document.getElementById('send-message-button').disabled = true;
        document.getElementById('Call-'+user).disabled = true;
        document.getElementById('VCall-'+user).disabled = true;
        document.getElementById('Disconnect-'+user).disabled = true;
    }else if(connectedUsers.includes(user)){
        document.getElementById(user+'-connected').id = user + '-p-disconnected';
        connectedUsers = connectedUsers.filter((item)=>{ return item !== user});
        document.getElementById('Call-'+user).disabled = true;
        document.getElementById('VCall-'+user).disabled = true;
        document.getElementById('Disconnect-'+user).disabled = true;
    };
    if (!(Array.from(document.getElementById('users-list').children).length > 3)) {
        noUser(document.getElementById('users-list'), 'No User Online', 'users-list');
    };
});
socket.on('disconnect-user', (user)=>{
    if (Array.from(document.getElementById(user).children).includes(document.getElementById(user + '-conn'))) {
        document.getElementById(user + '-conn').remove();  
    };
    const x = document.getElementById('message-text').className;
    document.getElementById(user+'-connected').id = user + '-disconnected';
    disconnectedUsers[disconnectedUsers.length] = user;
    if(connectedUsers.includes(user) && x === user){
        connectedUsers = connectedUsers.filter((item)=>{ return item !== user});
        document.getElementById('message-text').disabled = true;
        document.getElementById('send-message-button').disabled = true;
        document.getElementById('Call-'+user).disabled = true;
        document.getElementById('VCall-'+user).disabled = true;
        document.getElementById('Disconnect-'+user).disabled = true;
    }else if(connectedUsers.includes(user)){
        connectedUsers = connectedUsers.filter((item)=>{ return item !== user});
        document.getElementById('Call-'+user).disabled = true;
        document.getElementById('VCall-'+user).disabled = true;
        document.getElementById('Disconnect-'+user).disabled = true;
    };
});
socket.on('connection-request', (sender, recipient)=>{
    const m = Array.from(document.getElementById('notification').children),
    n = Array.from(document.body.children),
    o = m.some((item)=>{return item.id === `connection-request-${sender}`}),
    p = n.some((item)=>{return item.id === `connection-request-${sender}`}),
    q = connectedUsers.includes(sender);
    if (o || p || q) {
        return;
    }
    let x = Array.from(document.body.children).filter((item)=>{ return item.className == 'connection-request'});
    const y = disconnectedUsers.includes(sender);
    if (x.length != 0) {
        document.getElementById('notification').append(x[0]);
    };
    receivedRequest[receivedRequest.length] = sender;
    connectionRing(sender).then((value)=>{
        if (value === 'connection-accepted' && !y) {
            socket.emit(value, sender, recipient);
            const tabs = Array.from(document.querySelectorAll('.overall-container'));
            tabs.forEach((item)=>{
            item.style.display = 'none';
            });
            connectToUser(sender);
            connectedUsers[connectedUsers.length] = sender;
            if (!(document.getElementById('chat-display').classList.contains('p-open-chat-display'))) {
                document.getElementById('chat-display').classList.toggle('p-open-chat-display');
                document.getElementById('message-form').classList.toggle('p-open-message-form');
                if (!(document.getElementById('chat-display').classList.contains('open-chat-display'))) {
                    document.getElementById('chat-display').classList.remove('open-chat-display');
                    document.getElementById('cd-back').classList.remove('hide-cb');
                };
            };
            if (!(document.getElementById('connected-users').classList.contains('p-open-connected-users'))) {
                document.getElementById('side-view').classList.toggle('p-open-side-view');
                document.getElementById('connected-users').classList.toggle('p-open-connected-users');
            };
            if (UB.classList.contains('ub-hidden')) {
                UB.classList.toggle('ub-hidden');
            };
            if (document.getElementById('users-list').classList.contains('open-users-list')) {
                document.getElementById('users-list').classList.toggle('open-users-list');
            };
            if (Array.from(document.getElementById('connected-users').children).includes(document.getElementById('connected-users-no-user'))) {
                document.getElementById('connected-users-no-user').remove();  
            };
            let a = document.createElement('div');
            a.id = sender + '-conn';
            a.className = 'user-conn';
            document.getElementById(sender).append(a);
        } else if(value === 'connection-accepted' && y){
            socket.emit(value, sender, recipient);
            const tabs = Array.from(document.querySelectorAll('.overall-container'));
            tabs.forEach((item)=>{
            item.style.display = 'none';
            });
            disconnectedUsers = disconnectedUsers.filter((item)=>{return item!== sender});
            displayChatScreen(sender);
            connectedUsers[connectedUsers.length] = sender;
            document.getElementById(sender +'-disconnected').id = sender + '-connected';
            if (!(document.getElementById('chat-display').classList.contains('p-open-chat-display'))) {
                document.getElementById('chat-display').classList.toggle('p-open-chat-display');
                document.getElementById('message-form').classList.toggle('p-open-message-form');
                if (!(document.getElementById('chat-display').classList.contains('open-chat-display'))) {
                    document.getElementById('chat-display').classList.remove('open-chat-display');
                    document.getElementById('cd-back').classList.remove('hide-cb');
                };
            };
            if (!(document.getElementById('connected-users').classList.contains('p-open-connected-users'))) {
                document.getElementById('side-view').classList.toggle('p-open-side-view');
                document.getElementById('connected-users').classList.toggle('p-open-connected-users');
            };
            if (UB.classList.contains('ub-hidden')) {
                UB.classList.toggle('ub-hidden');
            };
            if (document.getElementById('users-list').classList.contains('open-users-list')) {
                document.getElementById('users-list').classList.toggle('open-users-list');
            };
            if (Array.from(document.getElementById('connected-users').children).includes(document.getElementById('connected-users-no-user'))) {
                document.getElementById('connected-users-no-user').remove();  
            };
            let a = document.createElement('div');
            a.id = sender + '-conn';
            a.className = 'user-conn';
            document.getElementById(sender).append(a);
        }else {
            socket.emit('connection-rejected', sender, recipient);
        };
    }).catch((err)=>{console.log(err);});
});
socket.on('connection-accepted', (recipient)=>{
    const y = disconnectedUsers.includes(recipient);
    if (!(document.getElementById('chat-display').classList.contains('p-open-chat-display'))) {
        document.getElementById('chat-display').classList.toggle('p-open-chat-display');
        document.getElementById('message-form').classList.toggle('p-open-message-form');
        if (!(document.getElementById('chat-display').classList.contains('open-chat-display'))) {
            document.getElementById('chat-display').classList.remove('open-chat-display');
            document.getElementById('cd-back').classList.remove('hide-cb');
        };
    };
    if (!(document.getElementById('connected-users').classList.contains('p-open-connected-users'))) {
        document.getElementById('side-view').classList.toggle('p-open-side-view');
        document.getElementById('connected-users').classList.toggle('p-open-connected-users');
    };
    if (UB.classList.contains('ub-hidden')) {
        UB.classList.toggle('ub-hidden');
    };
    if (document.getElementById('users-list').classList.contains('open-users-list')) {
        document.getElementById('users-list').classList.toggle('open-users-list');
    };
    if (Array.from(document.getElementById('connected-users').children).includes(document.getElementById('connected-users-no-user'))) {
        document.getElementById('connected-users-no-user').remove();  
    };
    let a = document.createElement('div');
    a.id = recipient + '-conn';
    a.className = 'user-conn';
    document.getElementById(recipient).append(a);
    if (!y) {
        const tabs = Array.from(document.querySelectorAll('.overall-container'));
        tabs.forEach((item)=>{
        item.style.display = 'none';
        });
        connectToUser(recipient);
        connectedUsers[connectedUsers.length] = recipient;
    } else if(y){
        const tabs = Array.from(document.querySelectorAll('.overall-container'));
        tabs.forEach((item)=>{
        item.style.display = 'none';
        });
        disconnectedUsers = disconnectedUsers.filter((item)=>{return item!== recipient});
        displayChatScreen(recipient);
        connectedUsers[connectedUsers.length] = recipient;
        document.getElementById(recipient+'-disconnected').id = recipient + '-connected';
    }
});
socket.on('connection-rejected', (recipient)=>{
});
socket.on('video-call-request', (user, recipient, pID)=>{
    if (makingACall === true) {
        socket.emit('recipient-making-call-video', user, recipient );
    } else {
        videoCallRing(user).then((value)=>{
            document.querySelector('.video-call-ring').remove();
            if (value == 'video-call-accepted') {
                navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: true
                }).then((stream)=>{
                    document.getElementById('video-call').style.display = 'block';
                    document.getElementById('video-call').className = user;
                    localVideo.srcObject = stream;
                    localVideoStream = stream;
                    localVideo.autoplay = true;
                    makingACall = true;
                    peerCall = peer.call(pID, stream);
                    peerCall.on('stream', (remoteStream)=>{
                        callUser = user;
                        videoSeconds = 0;
                        videoMinutes = 0;
                        videoTime.style.display = 'block';
                        remoteVideoStream = remoteStream;
                        remoteVideo.srcObject = remoteStream;
                        remoteVideo.autoplay = true;
                        localVideo.style.minHeight = '5%';
                        localVideo.style.minWidth = '5%';
                        localVideo.style.maxHeight = '20%';
                        localVideo.style.maxWidth = '20%';
                        localVideo.style.right = `0px`;
                    });
                    document.getElementById('disconnect-video-call').onclick = ()=>{
                        disconnectVideoCall(user);
                    };
                }).catch((error)=>{
                    callUser = undefined;
                    setTimeout(() => {
                        makingACall = false;
                    }, 3000);
                    socket.emit('video-call-unreachable', user, recipient);
                    console.log(error);
                });
            } else {
              socket.emit(value, user, recipient);
              setTimeout(() => {
                  makingACall = false;
              }, 2000);
              callUser = undefined;
            };
        }).catch((err)=>{
            socket.emit('video-call-unreachable', user, recipient);
            setTimeout(() => {
                makingACall = false;
            }, 2000);
            callUser = undefined;
        });
    };
});
socket.on('recipient-making-call-video', (recipient)=>{
    callUser = undefined;
    document.getElementById('disconnect-video-call').onclick = ()=>{
        return;
    };
    setTimeout(() => {
        localVideoStream.getTracks().forEach(track => track.stop());
        localVideo.srcObject = undefined;
        localVideoStream = undefined;
        document.getElementById('video-call').style.display = 'none';
        makingACall = false;  
    }, 3000);
});
socket.on('video-call-rejected', (recipient)=>{
    callUser = undefined;
    document.getElementById('disconnect-video-call').onclick = ()=>{
        return;
    };
    setTimeout(() => {
        localVideoStream.getTracks().forEach(track => track.stop());
        localVideo.srcObject = undefined;
        localVideoStream = undefined;
        document.getElementById('video-call').style.display = 'none';
        makingACall = false;  
    }, 3000);
});
socket.on('video-call-unanswered', (recipient)=>{
    callUser = undefined;
    document.getElementById('disconnect-video-call').onclick = ()=>{
        return;
    };
    setTimeout(() => {
        localVideoStream.getTracks().forEach(track => track.stop());
        localVideo.srcObject = undefined;
        localVideoStream = undefined;
        document.getElementById('video-call').style.display = 'none';
        makingACall = false;  
    }, 3000);
});
socket.on('video-call-unreachable', (recipient)=>{
    callUser = undefined;
    document.getElementById('disconnect-video-call').onclick = ()=>{
        return;
    };
    setTimeout(() => {
        localVideoStream.getTracks().forEach(track => track.stop());
        localVideo.srcObject = undefined;
        localVideoStream = undefined;
        document.getElementById('video-call').style.display = 'none';
        makingACall = false;  
    }, 3000);
});
socket.on('audio-call-request', (user, recipient, pID)=>{
    if (makingACall === true) {
        socket.emit('recipient-making-call-audio', user, recipient );
    } else {
        audioCallRing(user).then((value)=>{
            document.querySelector('.audio-call-ring').remove();
            if (value == 'audio-call-accepted') {
                navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false
                }).then((stream)=>{
                    document.getElementById('audio-call').style.display = 'block';
                    document.getElementById('audio-call').classList = user;
                    localAudio.srcObject = stream;
                    localAudioStream = stream;
                    localAudio.autoplay = true;
                    makingACall = true;
                    peerCall = peer.call(pID, stream);
                    peerCall.on('stream', (remoteStream)=>{
                        callUser = user;
                        audioSeconds = 0;
                        audioMinutes = 0;
                        audioTime.style.display = 'block';
                        remoteAudioStream = remoteStream;
                        remoteAudio.srcObject = remoteStream;
                        remoteAudio.autoplay = true;
                    });
                    document.getElementById('disconnect-audio-call').onclick = ()=>{
                        disconnectAudioCall(user);
                    };
                }).catch((error)=>{
                    callUser = undefined;
                    setTimeout(() => {
                        makingACall = false;
                    }, 3000);
                    socket.emit('audio-call-unreachable', user, recipient);
                    console.log(error);
                });   
            } else {
                setTimeout(() => {
                    makingACall = false;
                }, 2000);
                socket.emit(value, user, recipient);
            };
        }).catch((err)=>{
            callUser = undefined;
            setTimeout(() => {
                makingACall = false;
            }, 2000);
            socket.emit('audio-call-unreachable', user, recipient);
        });
    };
});
socket.on('recipient-making-call-audio', (recipient)=>{
    callUser = undefined;
    document.getElementById('disconnect-audio-call').onclick = ()=>{
        return;
    };
    setTimeout(() => {
        localAudioStream.getTracks().forEach(track => track.stop());
        localAudio.srcObject = undefined;
        localAudioStream = undefined;
        document.getElementById('audio-call').style.display = 'none';
        makingACall = false;
    }, 3000);
});
socket.on('audio-call-rejected', (recipient)=>{
    callUser = undefined;
    document.getElementById('disconnect-audio-call').onclick = ()=>{
        return;
    };
    setTimeout(() => {
        localAudioStream.getTracks().forEach(track => track.stop());
        localAudio.srcObject = undefined;
        localAudioStream = undefined;
        document.getElementById('audio-call').style.display = 'none';
        makingACall = false;
    }, 3000);
});
socket.on('audio-call-unanswered', (recipient)=>{
    callUser = undefined;
    document.getElementById('disconnect-audio-call').onclick = ()=>{
        return;
    };
    setTimeout(() => {
        localAudioStream.getTracks().forEach(track => track.stop());
        localAudio.srcObject = undefined;
        localAudioStream = undefined;
        document.getElementById('audio-call').style.display = 'none';
        makingACall = false;
    }, 3000);
});
socket.on('audio-call-unreachable', (recipient)=>{
    callUser = undefined;
    document.getElementById('disconnect-audio-call').onclick = ()=>{
        return;
    };
    setTimeout(() => {
        localAudioStream.getTracks().forEach(track => track.stop());
        localAudio.srcObject = undefined;
        localAudioStream = undefined;
        document.getElementById('audio-call').style.display = 'none';
        makingACall = false;
    }, 3000);
});
socket.on('receive-message', (message, user)=>{
    receiveMessage(user, message);
});
socket.on('user-not-connected', ()=>{
    window.location.href = "https://chat--app.glitch.me/";
    console.log('receiveddddd');
});
socket.on('disconnect-video-call', (user)=>{
    if (document.getElementById('video-call').className == user) {
        callUser = undefined;
        peerCall.close();
        videoSeconds = 0;
        videoMinutes = 0;
        videoTime.style.display = 'none';
        localVideoStream.getTracks().forEach(track => track.stop());
        localVideo.srcObject = undefined;
        localVideoStream = undefined;
        remoteVideoStream.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = undefined;
        document.getElementById('video-call').style.display = 'none';
        makingACall = false;
        localVideo.style.minHeight = '100%';
        localVideo.style.minWidth = '100%';    
        localVideo.style.right = '0px';    
    } else if(Array.from(document.body.children).includes(document.getElementById('video-call-ring-'+user)) || Array.from(document.getElementById('notification').children).includes(document.getElementById('video-call-ring-'+user))){
        document.getElementById('video-call-ring-'+user).remove();
    } else {
        return
    };
});
socket.on('disconnect-audio-call', (user)=>{
    if (document.getElementById('audio-call').className == user) {
        callUser = undefined;
        peerCall.close();
        audioSeconds = 0;
        audioMinutes = 0;
        audioTime.style.display = 'none';
        localAudioStream.getTracks().forEach(track => track.stop());
        localAudio.srcObject = undefined;
        localAudioStream = undefined;
        remoteAudioStream.getTracks().forEach(track => track.stop());
        remoteAudio.srcObject = undefined;
        document.getElementById('audio-call').style.display = 'none';
        makingACall = false;
    } else if(Array.from(document.body.children).includes(document.getElementById('audio-call-ring-'+user)) || Array.from(document.getElementById('notification').children).includes(document.getElementById('audio-call-ring-'+user))){
        document.getElementById('audio-call-ring-'+user).remove();
    } else {
        return
    };
});
// functions
function sendConnectionRequest(item) {
    const connected_Users = Array.from(document.getElementById('connected-users').children);
    const test1 = connected_Users.includes(document.getElementById(item.id + '-connected'));
   console.log(test1);
   if (!test1) {
    sentRequest[sentRequest.length] = item.id;
    socket.emit('connection-request', item.id);   
   } else {
       return;
   };

};
function sendConnectionRequest2(item) {
   const connected_Users = Array.from(document.getElementById('connected-users').children);
   const test1 = connected_Users.includes(document.getElementById(item + '-connected'));
    console.log(test1);
   if (!test1) {
    sentRequest[sentRequest.length] = item;
    socket.emit('connection-request', item);   
   } else {
       return;
   };
};
function newUser(user) {
    if (Array.from(document.getElementById('users-list').children).includes(document.getElementById('users-list-no-user'))) {
        document.getElementById('users-list-no-user').remove();   
    };
    var x = document.getElementById('users-list'),
        y = document.createElement('a');
        y.id = user;
        y.class = 'users-list'
        y.textContent = user;
        y.onclick = ()=>{
            sendConnectionRequest(y);
        };
        x.append(y);
};
function connectToUser(username) {
    const user = document.createElement('button'),
    callButton = document.createElement('button'),
    vCallButton = document.createElement('button'),
    disconnectButton = document.createElement('button'),
    controlsContainer = document.createElement('div'),
    messagesContainer = document.createElement('div'),
    overallContainer = document.createElement('main');
    overallContainer.classList.add('overall-container');
    overallContainer.classList.add(username);
    controlsContainer.classList.add('controls-container');
    controlsContainer.classList.add(username);
    user.classList.add(username);
    callButton.classList.add(username);
    callButton.classList.add('call-button');
    vCallButton.classList.add(username);
    vCallButton.classList.add('vcall-button');
    disconnectButton.classList.add(username);
    disconnectButton.classList.add('disconnect-button');
    messagesContainer.classList.add(username);
    messagesContainer.classList.add('messages-container');
    user.id = username + '-connected';
    callButton.id = 'Call-' + username;
    vCallButton.id = 'VCall-' + username;
    disconnectButton.id = 'Disconnect-' + username;
    messagesContainer.id = username + '-Messages';
    controlsContainer.id = username +  '-controls';
    overallContainer.id = username + '-overall-content'
    user.textContent = username;
    user.onclick = ()=>{
        displayChatScreen(username);
    };
    callButton.textContent = 'Call';
    vCallButton.textContent = 'Video-Call';
    disconnectButton.textContent = 'Disconnect';
    disconnectButton.onclick = ()=>{
        disconnect(username);
    }
    vCallButton.onclick = ()=>{
        videoCall(username);
    };
    callButton.onclick = ()=>{
        audioCall(username);
    };
    document.getElementById('connected-users').append(user);
    controlsContainer.append(callButton);
    controlsContainer.append(vCallButton);
    controlsContainer.append(disconnectButton);
    overallContainer.append(controlsContainer);
    overallContainer.append(messagesContainer);
    document.getElementById('chat-display').append(overallContainer);
    document.getElementById('message-text').className = username;
    document.getElementById('send-message-button').className = username;
    console.log('here');
}
function displayChatScreen(user) {
    if (!(document.getElementById('chat-display').classList.contains('p-open-chat-display'))) {
        document.getElementById('chat-display').classList.toggle('p-open-chat-display');
        document.getElementById('message-form').classList.toggle('p-open-message-form');
        if (!(document.getElementById('chat-display').classList.contains('open-chat-display'))) {
            document.getElementById('chat-display').classList.remove('open-chat-display');
            document.getElementById('cd-back').classList.remove('hide-cb');
        };
    };
    const tabs = Array.from(document.querySelectorAll('.overall-container'));
    console.log(tabs);
    tabs.forEach((item)=>{
        item.style.display = 'none';
    });
    document.getElementById(`${user}-overall-content`).style.display = 'grid';
    messageText.className = user;
    sendMessageButton.className = user;
    if (Array.from(document.getElementById(user + '-connected').children).includes(document.getElementById(user + '-unread'))) {
        document.getElementById(user + '-unread').remove();
    }
    if(disconnectedUsers.includes(user) || pDisconnectedUsers.includes(user)){
        document.getElementById('message-text').disabled = true;
        document.getElementById('send-message-button').disabled = true;
        document.getElementById('Call-'+user).disabled = true;
        document.getElementById('VCall-'+user).disabled = true;
        document.getElementById('Disconnect-'+user).disabled = true;
    } else {
        document.getElementById('message-text').disabled = false;
        document.getElementById('send-message-button').disabled = false;
        document.getElementById('Call-'+user).disabled = false;
        document.getElementById('VCall-'+user).disabled = false;
        document.getElementById('Disconnect-'+user).disabled = false;
    }

};
function sendMessage(user, message) {
    socket.emit('send-message', message, user);
    const myMessage  = document.createElement('div'),
    messageContainer  = document.createElement('div'),
    timeContainer = document.createElement('div');
    const thisDate = new Date(),
    currentMinutes = thisDate.getMinutes() < 10 ? `0${thisDate.getMinutes()}` : thisDate.getMinutes();
    const currentTime = thisDate.getHours() > 12 ? `${thisDate.getHours() - 12}:${currentMinutes}PM` : `${thisDate.getHours()}:${currentMinutes}AM`;
    messageContainer.textContent = message;
    timeContainer.textContent = currentTime;
    messageContainer.classList.add('message-body');
    timeContainer.classList.add('message-time');
    myMessage.append(messageContainer);
    myMessage.append(timeContainer);
    myMessage.classList.add('myMessages');
    document.getElementById(`${user}-Messages`).append(myMessage);
    document.getElementById(`${user}-Messages`).scrollTop = document.getElementById(`${user}-Messages`).scrollHeight;

};
function receiveMessage(user, message) {
    const x = Array.from(document.getElementById(`${user}-Messages`).children),
    y = x.some((item)=>{ return item.className === 'message-unread'});
    const myMessage  = document.createElement('div'),
    messageContainer  = document.createElement('div'),
    timeContainer = document.createElement('div'),
    messageUnread = document.createElement('div');
    const thisDate = new Date(),
    currentMinutes = thisDate.getMinutes() < 10 ? `0${thisDate.getMinutes()}` : thisDate.getMinutes();
    const currentTime = thisDate.getHours() > 12 ? `${thisDate.getHours() - 12}:${currentMinutes}PM` : `${thisDate.getHours()}:${currentMinutes}AM`;
    messageContainer.textContent = message;
    timeContainer.textContent = currentTime;
    messageContainer.classList.add('message-body');
    timeContainer.classList.add('message-time');
    messageUnread.classList.add('message-unread');
    messageUnread.id = 'message-unread-' + user;
    messageUnread.innerHTML = '-unread messages-';
    myMessage.append(messageContainer);
    myMessage.append(timeContainer);
    myMessage.classList.add('receivedMessages');
    if (document.getElementById('message-text').className != user && !y) {
        document.getElementById(`${user}-Messages`).append(messageUnread);
        document.getElementById(`${user}-Messages`).scrollTop = document.getElementById(`${user}-Messages`).scrollHeight;
        document.getElementById(`${user}-Messages`).append(myMessage);
        let a = document.createElement('div');
        a.id = user + '-unread';
        a.className = 'user-unread';
        document.getElementById(user + '-connected').append(a);
    }else if (y) {
        document.getElementById(`${user}-Messages`).append(myMessage);
    } else {
        document.getElementById(`${user}-Messages`).append(myMessage);
        document.getElementById(`${user}-Messages`).scrollTop = document.getElementById(`${user}-Messages`).scrollHeight;
    };
};
function videoCall(recipient) {
    if (makingACall === true) {
        return;
    } else {
        makingACall = true;
        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        }).then((stream)=>{
            document.getElementById('video-call').style.display = 'block';
            document.getElementById('video-call').className = recipient;
            localVideoStream = stream;
            localVideo.srcObject = stream;
            localVideo.autoplay = true;
            makingACall = true;
            callUser = recipient;
            socket.emit('video-call-request', recipient, peerID);
            document.getElementById('disconnect-video-call').onclick = ()=>{
                disconnectVideoCall(recipient);
            };
        }).catch((error)=>{
            makingACall = false;
            console.log(error);
        });
    };
};
function audioCall(recipient) {
    if (makingACall === true) {
        return;
    } else {
        makingACall = true;
        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        }).then((stream)=>{
            document.getElementById('audio-call').style.display = 'block';
            document.getElementById('audio-call').className = recipient;
            localAudioStream = stream;
            localAudio.srcObject = stream;
            localAudio.autoplay = true;
            callUser = recipient;
            socket.emit('audio-call-request', recipient, peerID);
            document.getElementById('disconnect-audio-call').onclick = ()=>{
                disconnectAudioCall(recipient);
            };
        }).catch((error)=>{
            console.log(error);
            makingACall = false;
        });
    };
};
function disconnect(user) {
    const x = document.getElementById('message-text').className;
    document.getElementById(user +'-connected').id = user + '-disconnected';
    disconnectedUsers[disconnectedUsers.length] = user;
    document.getElementById('Call-'+user).disabled = true;
    document.getElementById('VCall-'+user).disabled = true;
    document.getElementById('Disconnect-'+user).disabled = true;
    if(connectedUsers.includes(user) && x === user){
        connectedUsers = connectedUsers.filter((item)=>{ return item !== user});
        document.getElementById('message-text').disabled = true;
        document.getElementById('send-message-button').disabled = true;
    }else if(connectedUsers.includes(user)){
        connectedUsers = connectedUsers.filter((item)=>{ return item !== user});
    };
    socket.emit('disconnect-user', user);
};
function disconnectVideoCall(user) {
    if (peerCall) {
        peerCall.close();   
    };
    videoSeconds = 0;
    videoMinutes = 0;
    videoTime.style.display = 'none';
    localVideoStream.getTracks().forEach(track => track.stop());
    localVideo.srcObject = undefined;
    localVideoStream = undefined;
    remoteVideo.srcObject = undefined;
    remoteVideoStream = undefined;
    callUser = undefined;
    document.getElementById('video-call').style.display = 'none';
    socket.emit('disconnect-video-call', user);
    makingACall = false;
    localVideo.style.minHeight = '100%';
    localVideo.style.minWidth = '100%';
    localVideo.style.right = '0px';
};
function disconnectAudioCall(user) {
    if (peerCall) {
        peerCall.close();   
    };
    audioSeconds = 0;
    audioMinutes = 0;
    audioTime.style.display = 'none';
    localAudioStream.getTracks().forEach(track => track.stop());
    localAudio.srcObject = undefined;
    localAudioStream = undefined;
    remoteAudio.srcObject = undefined;
    remoteAudioStream = undefined;
    callUser = undefined;
    document.getElementById('audio-call').style.display = 'none';
    socket.emit('disconnect-audio-call', user);
    makingACall = false;
};
function addAudioTime() {
    if (audioSeconds < 59) {
        audioSeconds += 1;
    } else {
        audioSeconds = 0;
        audioMinutes += 1;
    }
    let minutes = audioMinutes < 10? `0${audioMinutes}`: audioMinutes;
    let seconds = audioSeconds < 10? `0${audioSeconds}`: audioSeconds;
    audioTime.innerHTML = `${minutes}:${seconds}`;
};
function addVideoTime() {
    if (videoSeconds < 59) {
        videoSeconds += 1;
    } else {
        videoSeconds = 0;
        videoMinutes += 1;
    }
    let minutes = videoMinutes < 10? `0${videoMinutes}`: videoMinutes;
    let seconds = videoSeconds < 10? `0${videoSeconds}`: videoSeconds;
    videoTime.innerHTML = `${minutes}:${seconds}`;  
};
let videoCallRing = (user)=>{
    return new Promise((resolve, rejection)=>{
        let v = document.createElement('button'),
        w = document.createElement('button'),
        x = document.createElement('button'),
        y = document.createElement('button'),
        z = document.createElement('div'),
        u = document.createElement('div');
        v.id = `minimize-call-${user}`;
        w.id = `maximize-call-${user}`;
        x.id = `reject-call-${user}`;
        y.id = `accept-call-${user}`;
        z.id = `video-call-ring-${user}`;
        u.id = `video-text-container${user}`
        v.className = 'minimize-call';
        w.className = 'maximize-call-hidden';
        x.className = 'reject-call';
        y.className = 'accept-call';
        z.className = 'video-call-ring';
        u.className = 'video-text-container';
        v.textContent = '—';
        w.textContent = 'MAXIMIZE';
        x.textContent = 'REJECT';
        y.textContent = 'ACCEPT';
        u.textContent = `Video Call From '@${user}'`;
        x.onclick = ()=>{resolve('video-call-rejected')};
        y.onclick = ()=>{resolve('video-call-accepted')};
        z.append(u);
        z.append(v);
        z.append(w);
        z.append(x);
        z.append(y);
        document.body.append(z);
        v.onclick = ()=>{
            document.getElementById('notification').append(z);
            v.className = 'minimize-call-hidden';
            w.className = 'maximize-call';
        };
        w.onclick = ()=>{
            document.body.append(z);
            v.className = 'minimize-call';
            w.className = 'maximize-call-hidden';
        };
        callUser = user;
        makingACall = true;
        setTimeout(() => {
           resolve('video-call-unanswered'); 
        }, 60000);
    });
};
let audioCallRing = (user)=>{
    return new Promise((resolve, rejection)=>{
        let v = document.createElement('button'),
        w = document.createElement('button'),
        x = document.createElement('button'),
        y = document.createElement('button'),
        z = document.createElement('div'),
        u = document.createElement('div');
        v.id = `minimize-call-${user}`;
        w.id = `maximize-call-${user}`;
        x.id = `reject-call-${user}`;
        y.id = `accept-call-${user}`;
        z.id = `audio-call-ring-${user}`;
        u.id = `audio-text-container${user}`
        v.className = 'minimize-call';
        w.className = 'maximize-call-hidden';
        x.className = 'reject-call';
        y.className = 'accept-call';
        z.className = 'audio-call-ring';
        u.className = 'audio-text-container';
        v.textContent = '—';
        w.textContent = 'MAXIMIZE';
        x.textContent = 'REJECT';
        y.textContent = 'ACCEPT';
        u.textContent = `Voice Call From '@${user}'`;
        x.onclick = ()=>{resolve('audio-call-rejected')};
        y.onclick = ()=>{resolve('audio-call-accepted')};
        z.append(u);
        z.append(v);
        z.append(w);
        z.append(x);
        z.append(y);
        document.body.append(z);
        v.onclick = ()=>{
            document.getElementById('notification').append(z);
            v.className = 'minimize-call-hidden';
            w.className = 'maximize-call';
        };
        w.onclick = ()=>{
            document.body.append(z);
            v.className = 'minimize-call';
            w.className = 'maximize-call-hidden';
        };
        callUser = user;
        makingACall = true;
        setTimeout(() => {
           resolve('audio-call-unanswered'); 
        }, 60000);
    });
};
let connectionRing = (user)=>{
    return new Promise((resolve, rejection)=>{
        let v = document.createElement('button'),
        w = document.createElement('button'),
        x = document.createElement('button'),
        y = document.createElement('button'),
        z = document.createElement('div'),
        u = document.createElement('div'),
        t = document.createElement('div'); 
        v.id = `maximize-request-${user}`;
        w.id = `minimize-request-${user}`;
        x.id = `reject-connection-${user}`;
        y.id = `accept-connection-${user}`;
        z.id = `connection-request-${user}`;
        u.id = `connection-container-${user}`;
        t.id = `text-container-${user}`;
        v.className = 'maximize-request-hidden';
        w.className = 'minimize-request';
        x.className = 'reject-connection';
        y.className = 'accept-connection';
        z.className = 'connection-request';
        u.className = 'connection-container';
        t.className = 'text-container';
        v.textContent = 'MAXIMIZE'
        w.textContent = '—'
        x.textContent = 'REJECT';
        y.textContent = 'ACCEPT';
        t.textContent = `CONNECTION REQUEST FROM '@${user}'`;
        x.onclick = ()=>{
            resolve('connection-rejected');
            z.remove();
        };
        y.onclick = ()=>{
            resolve('connection-accepted');
            z.remove();
        };
        u.append(t);
        u.append(v);
        u.append(w);
        u.append(x);
        u.append(y);
        z.append(u);
        document.body.append(z);
        v.onclick = ()=>{
            let b = Array.from(document.body.children).filter((item)=>{ return item.className == 'connection-request'});
            if (b.length != 0) {
                document.getElementById('notification').append(b[0]);
            };
            document.body.append(z);
            w.className = 'minimize-request';
            v.className = 'maximize-request-hidden';
        };
        w.onclick = ()=>{
            document.getElementById('notification').append(z);
            w.className = 'minimize-request-hidden';
            v.className = 'maximize-request';
        };
    });
};
function clearUnread() {
    const ident = document.getElementById('message-text').className,
    x = Array.from(document.getElementById(ident + '-Messages').children),
    y = x.some((item)=>{return item.className === 'message-unread'}),
    z = x.filter((item)=>{return item.className === 'message-unread'});
    if (y) {
       z[0].remove(); 
    } else {
        return;
    };
};
function noUser(container, message, name) {
   let x = document.createElement('div');
    x.id = name + '-no-user';
    x.textContent = message;
    container.append(x);
}