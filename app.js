var express = require('express');
var app = express();
var mongoose = require('mongoose');
var db = require('./db.js');
var helper = require('./helper.js');
var bodyParser = require('body-parser');


//Mongoose Models:
var User = mongoose.model('UserSchema');
var allVenuesDB = mongoose.model('VenueSchema');

//Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// unauthenticated endpoints

/*
* Input:  username and password passed through request object
* Output: Status
* General: Checks if the user exists in the DB
	If not hash password and saves credentials in DB
* 
*/
app.post('/api/register', (req, res) => {
	if(req.body.email && req.body.password){
		let credentials = req.body;
		User.findOne({'email': credentials.email}, (err, existingUser)=>{
			if(existingUser === null){
				helper.hashPassword(credentials.password, 10)
					.then((hashed)=>{
						var newUser = new User({
							email: credentials.email,
							password: hashed,
							visitedVenues: [],
							sessionTokens: []
						})
						.save((err, user)=>{
							if(err){
								console.log(err);
							}
							else{
								console.log('successfully saved user');
								res.json(user);
							}
						});
					})
					.catch((err)=>{
						console.log(err);
						res.json(err);
					});
			}
			else{
				res.send("User already exists");
			}
		});
	}
	else{
        console.log("invalid req credentials");
        //res.send(err);
	}
});

app.post('/api/login', (req, res)=>{	
});


app.use((req, res, next)=>{
	
});

// authenticated endpoints
app.get('/api/NearByVenues', (req,res)=>{
});

app.post('/api/checkIn',(req,res)=>{	
});

app.get('/api/popularVenues',(req,res)=>{
});

app.get('/api/nearByUsers',(req,res)=>{
});

app.get('/api/suggestedVenue',(req,res)=>{
	
});

app.listen(8080);




