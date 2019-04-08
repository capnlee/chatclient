const express = require('express');
const basicAuth = require('express-basic-auth');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io').listen(server);
const path = require('path');
const sqlConfig = require('./dbConfig.js');
const knex = require('knex')(sqlConfig);
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

server.listen(3000, () => {
	console.log('server is listening on port', server.address().port);
});

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
		res.sendStatus(200);
	});
});