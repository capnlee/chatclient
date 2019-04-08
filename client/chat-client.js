
let userAgent = navigator.userAgent || navigator.vendor || window.opera;
window.mobileDevice = (/android/i.test(userAgent) || (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream));


window.addEventListener('load', () => {

	window.socket = io();
	window.socket.on('message', (data) => {
		addMessage(data.messages[0]);
	});

	window.messageBox = document.getElementById('messages');
	window.messageField = document.getElementById('message');
	window.imageField = document.getElementById('file');
	window.sendButton = document.getElementById('send');
	window.notification = document.getElementById('notification');

	window.imageField.onchange = () => {
		window.messageField.value = window.imageField.value;
	};

	getMessages();
});

window.addEventListener('resize', () => {
	if (window.mobileDevice) {
		window.messageBox.scroll(0, window.messageBox.scrollHeight);
	}
});

window.addEventListener('visibilitychange', () => {
	if (document.hidden) {

	}else{
		getMessages();
		setFavicon('chat');
	}
});

window.addEventListener('keydown', (event) => {
	if (event.code == 'Enter' && !event.shiftKey && window.sendButton.disabled === false) {
		sendMessage();
	}
});

// https://stackoverflow.com/questions/260857/changing-website-favicon-dynamically
function setFavicon (icon) {
    var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = `https://capnlee.co.uk/chat/img/${icon}.png`;
    document.getElementsByTagName('head')[0].appendChild(link);
}

function addMessage (msg) {
	if (msg.name && msg.message) {
		let box = document.createElement('div');
		if (msg.name === window.username) {
			box.className = 'self'
		}else{
			box.className = 'other';
		}
		let picf = document.createElement('div');
		picf.className = 'profilepic';
		let pict = document.createElement('img');
		pict.src = 'https://capnlee.co.uk/chat/img/profile/'+msg.name.replace(/[^\d\w\s]/g, '')+'.png';
		picf.appendChild(pict);
		box.appendChild(picf);
		let inner = document.createElement('div');
		inner.className = 'row';
		let name = document.createElement('div');
		name.className = 'col-md-12 pt-1 pl-2 text-capitalize font-weight-bold';
		name.textContent = msg.name;
		let body = document.createElement('div');
		if (msg.message === '${img}') {
			body.className = 'pl-2';
			body.style.width = '300px';
			body.style.minHeight = '180px';
			let link = document.createElement('a');
			link.href = `https://capnlee.co.uk/chat/img/uploads/${msg.id}.png`; 
			let img = document.createElement('img');
			img.src = `https://capnlee.co.uk/chat/img/uploads/${msg.id}.png`;
			img.className = 'inline-img';
			link.appendChild(img);
			body.appendChild(link);
		} else {
			body.className = 'col-md-12 pl-2';
			body.textContent = msg.message;
		}

		let time = document.createElement('div');
		time.className = 'col-md-12 pl-2 pb-1 font-italic';
		time.style.fontSize = '0.6em';
		time.textContent = getTimeText(msg.timestamp);
		inner.appendChild(name);
		inner.appendChild(body);
		inner.appendChild(time);
		box.appendChild(inner);
		window.messageBox.appendChild(box);
		window.messageBox.scroll(0, window.messageBox.scrollHeight);

		if (document.hidden && window.username !== msg.name) {
			window.notification.play();
			setFavicon('unread');
		}
	}
}

function getTimeText (time) {
// if we don't have a timestamp then this must be a new message
// (the server doesn't involve the database for new messages)
// so lets just say its now
	if (!time) {
		return new Date().toTimeString().substr(0,5)+' today';
	}
// get the time out of the DB time string and convert to local time
	let returnString = new Date(time).toTimeString().substr(0,5)+' ';
// to figure out the relative day compare the milliseconds between the message if it was sent at midnight and
// midnight today. Then divide by the number of milliseconds in a day
	let daysAgo = Math.round((+new Date().setHours(0,0,0,0) - new Date(time).setHours(0,0,0,0)) / 86400000);
// add a few custom strings for readable relative dates
	if (daysAgo < 1) {
		returnString += 'today';
	}else if (daysAgo < 2) {
		returnString += 'yesterday';
	}else if (daysAgo < 7) {
		returnString += (daysAgo-1) + ' days ago'
	}else if (daysAgo < 14) {
		returnString += 'a week ago';
	}else{
		returnString += Math.round((daysAgo-1)/7) + ' weeks ago';
	}
	return returnString;
}

function deleteAllMessages () {
	while (window.messageBox.firstChild) {
		window.messageBox.removeChild(window.messageBox.firstChild);
	}
}

function sendMessage (){
	if (window.imageField.value.length > 0) {
		sendImage();
	} else if (window.messageField.value.length > 0) {
		sendText();
	}
}

function sendImage () {
	window.sendButton.disabled = true;
	document.forms["imgSubmit"].submit();
}

function sendText () {
	window.sendButton.disabled = true;
	let msg = window.messageField.value.substring(0, 10000);
	let async = new XMLHttpRequest();
	async.open('POST', document.location.href + '/messages');
	async.setRequestHeader('Content-Type', 'application/json');
	async.onreadystatechange = () => {
        if (async.readyState == 4) {
            if (async.status == 200){
            	window.sendButton.disabled = false;
                window.messageField.value = window.messageField.value.substring(10000);
            }
        }
	}
	async.ontimeout = () => {
		window.sendButton.disabled = false;
	};
	async.onerror = () => {
		window.sendButton.disabled = false;
	};
	async.send(JSON.stringify({message: msg}));
}

function getMessages() {
	let async = new XMLHttpRequest();
	async.open('GET', document.location.href + '/messages');
	async.onreadystatechange = () => {
        if (async.readyState == 4) {
            if (async.status == 200){
                let response = JSON.parse(async.responseText);
                window.username = response.name;
                deleteAllMessages();
                for (let i = 0; i < response.messages.length; i++) {
                	addMessage(response.messages[i]);
                }
            }
        }
	}
	async.send();
}