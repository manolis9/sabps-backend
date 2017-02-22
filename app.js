var express = require('express');
var app = express();
var firebase = require('firebase');
var nodemailer = require('nodemailer');
var PORT = process.env.PORT || 3000;
var bodyParser = require('body-parser');
var stripe = require('stripe')(
	'sk_test_2ERBbuikr3Ul5YmPVNBvGg9V');

// firebase.initializeApp({
// 	serviceAccount: "./app/SABPS-595760d743f6.json",
// 	databaseURL: "https://sabps-cd1b7.firebaseio.com"

// });

// var config = {
// 	apiKey: "AIzaSyAq4VZqZ2yC5JLioLbdLRIJ2JPh0oW1r7w",
// 	authDomain: "sabps-cd1b7.firebaseapp.com",
// 	databaseURL: "https://sabps-cd1b7.firebaseio.com",
// 	storageBucket: "sabps-cd1b7.appspot.com",
// 	messagingSenderId: "881638063284"
// };

var config = {
	apiKey: "AIzaSyDI5gkDdas1zz45zhbP34xJ8_V8ZbawGag",
	authDomain: "mazdis-sabps.firebaseapp.com",
	databaseURL: "https://mazdis-sabps.firebaseio.com",
	storageBucket: "mazdis-sabps.appspot.com",
	messagingSenderId: "1068216834283"
};

firebase.initializeApp(config);

var smtpConfig = {
	host: 'smtp.office365.com',
	port: 587,
	secure: false, // use SSL
	auth: {
		user: 'manolis.ioannides@mazdis.com',
		pass: 'Joannakrupa_9'
	}
};

var transporter = nodemailer.createTransport(smtpConfig);

app.use(bodyParser.json());

app.get('/', function(req, res) {

	/*Create a new customer*/
	firebase.database().ref().child('billing').child('new customer').on('child_changed', function(customer) {
		var cust = customer.val();

		userId = cust.uid;
		stripe.customers.create({
			source: cust.tokenId,
			description: cust.email
		}).then(function(customer) {
			var customerId = customer.id

			firebase.database().ref().child('users').child(userId).child('customerId').set(customerId);
		});

		console.log("Customer created!");

	});

	/*Charge a customer*/
	var chargeCustomerRef = firebase.database().ref().child('billing').child('charge customer');
	chargeCustomerRef.on('child_added', function(customer) {
		var cust = customer.val();

		var customerId = cust.customerId;
		var amount = parseFloat(cust.amount);
		amount = amount * 1000;

		stripe.charges.create({
				amount: amount, // Amount in cents
				currency: "cad",
				customer: customerId // Previously stored, then retrieved
			})
			.then(function() {
				chargeCustomerRef.child(cust.customerId).remove();
			});

		console.log("Customer charged!");
	});

	/* Booking confirmation, completion, cancellation and registration confirmation emails*/
	firebase.database().ref().child('emails').child('email to send').on('child_changed', function(emailSnap) {
		var email = emailSnap.val();
		//sendEmailHelper(email.from, email.to, email.subject, email.body);
		console.log(email.from);
		console.log(email.to);
		console.log(email.subject);
		console.log(email.body);

		var mailOptions = {
			from: email.from.toString(), // sender address
			to: email.to.toString(), // list of receivers
			subject: email.subject.toString(), // Subject line
			text: email.body.toString(), // plaintext body
			html: '<b>' + email.body.toString() + '</b>' // html body
		}

		transporter.sendMail(mailOptions, function(error, info) {
			if (error) {
				return console.log(error);
			}
			console.log('Message sent: ' + info.response);
		});

	});

	res.send('MAZDIS - SABPS');

});

app.listen(PORT, function() {
	console.log('Express listening on port: ' + PORT + '!');
});