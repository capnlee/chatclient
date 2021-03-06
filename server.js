const express = require('express');
const basicAuth = require('express-basic-auth');
const http = require('http');
const webpush = require('web-push');
const app = express();
const server = http.createServer(app);
const io = require('socket.io').listen(server);
const path = require('path');
const sqlConfig = require('./dbConfig.js');
const knex = require('knex')(sqlConfig);
const bodyParser = require('body-parser');
const multer = require("multer");
const fs = require("fs");


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

server.listen(3000, () => {
	console.log('server is listening on port', server.address().port);
});

const vapidConfig = require('./vapidConfig.js');
webpush.setVapidDetails('mailto:capn.lee@gmail.com', vapidConfig.public, vapidConfig.private);


var subscriptions = [];
app.post('/subscribe', (req, res) => {
	const subscription = req.body;

	res.status(201).json({});
	const payload = JSON.stringify({ title: 'test' });

	console.log(subscription);

	subscriptions.push(subscription);
	// webpush.sendNotification(subscription, payload).catch((error) => {
	// 	console.error(error.stack);
	// });
});

function sendNewMessageNotification (user, body) {
	let checkForDuplicates = {};
	for (let i = 0; i < subscriptions.length; i++) {
		if (typeof checkForDuplicates[subscriptions[i].p256dh] === 'undefined') {
			webpush.sendNotification(subscriptions[i], JSON.stringify({ title: user, body: body, icon: `https://capnlee.co.uk/chat/img/profile/${user}.png`})).catch((error) => {
				console.error(error.stack);
			});
		}
		checkForDuplicates[subscriptions[i].p256dh] = true;
	}
}

var users = {};

io.on('connection', (socket) => {
	console.log(`user ${socket.id} connected`);

	socket.on('post', (message) => {
		knex('messages').insert({name: req.auth.user, message: req.body.message}).then((result) => {
			io.emit('message', {messages: [{name: req.auth.user, message: req.body.message}]});
			res.sendStatus(200);
		});
	});
})

const userConfig = require('./userConfig.js');
app.use(basicAuth({authorizer: (name, pass, callback) => {
	return (userConfig.indexOf(name) > -1);
}}));

app.use(express.static(__dirname+'/client'));

app.use('/dev', (req, res) => {
  const fileDirectory = __dirname + '/dev/';

  res.sendFile('index.html', {root: fileDirectory}, (err) => { res.end(); });
});

app.get('/messages', (req, res) => {
	knex.select('messages.id', 'messages.name', 'messages.message', 'messages.timestamp').from('messages').limit(100).orderBy('id', 'desc').then(messages => {
		res.send({name: req.auth.user, messages: messages.reverse()});
	});
});

app.post('/messages', (req, res) => {
	knex('messages').insert({name: req.auth.user, message: req.body.message}).then((result) => {
		io.emit('message', {messages: [{name: req.auth.user, message: req.body.message}]});
		sendNewMessageNotification(req.auth.user, req.body.message);
		res.sendStatus(200);
	});
});

const upload = multer({dest: "/var/www/html/chat/temp"}); //outside of served folders
 
app.post('/img', upload.single('file'), (req, res) => {
	knex('messages').insert({name: req.auth.user, message: '${img}'}).returning('id').then((id) => {
	    const tempPath = req.file.path;
	    const targetPath = path.join(__dirname, `/client/img/uploads/${id}.png`);
 
		fs.rename(tempPath, targetPath, (err) => {
			console.log(err);
			res.redirect('.');
		});
	});
});