var express = require('express');
var app = express();
var mongoose = require('mongoose');
var db = require('./db.js');
var helper = require('./helper.js');
var bodyParser = require('body-parser');
var uuidv4 = require('uuid/v4');
var cookieParser = require('cookie-parser');


//Mongoose Models:
var User = mongoose.model('UserSchema');
var allVenuesDB = mongoose.model('VenueSchema');

//Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
/*
* Input:  Req, Res object, next function
* Output: Error OR calls next() function 
* General :  Checks if the session ID stored in a cookie
	exists in any user's sessionToken array.
	If exists: set attach the user to the request obj
	If not: throw error
*/
app.use((req, res, next)=>{
	if(req.cookies['session-id']){
		User.findOne({'sessionTokens': req.cookies['session-id']},(err, user)=>{
			if(err || !user){
				console.log("error - no user OR err");
			}
			else{
				req.user = user;
				next();
			}
		});
	}
	else{
		//let err = new Error();
		console.log("need to be logged in");
	}
});


// unauthenticated endpoints

/*
* Input:  username and password passed through request object
* Output: Status
* General: Checks if the user exists in the DB
	If not hash password and saves credentials in DB
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

/*
* Input:  username and password passed through request object
* Output: Status
* General: 
	1. Checks if user exists in DB --> if not, throw error. 
	2. If user exists, compares password to existing password in the DB 
		If mismatch, throw error
	3. If match, create a new session token
	4. Set cookie w/ session token
	5. Send status
*/
app.post('/api/login', (req, res)=>{
	if(req.body.email && req.body.password){
		var login = req.body;
		User.findOne({'email': login.email}, (err, existingUser)=>{
			if(existingUser !== null){
				helper.comparePasswords(login.password,existingUser.password).then((doMatch)=>{
					if(doMatch){
						var sessionToken = uuidv4();
						User.updateOne(existingUser, {$push: { sessionTokens: sessionToken }},
							{new: true}, (err, newToken)=>{
								if(err){
									console.log('err');
									res.send(err);
								}
								res.cookie('session-id',sessionToken, { maxAge: 900000});
								res.json({'status': 'set cookie!!!'});
							});
					}
				})
				.catch((err)=>{
					console.log("'error in comparing hashes");
				});
			}
			else{
				console.log("User doesn't exist");
			}
		});
	}
	else{
		res.send({'error' : 'Must include both email and password to register'});
	}
});

// authenticated endpoints


/*
* Input:  user's longitude and user's latitude passed through request object
* Output: Status & (if successful: list of venue objects) (if unsuccessful: err)
* General: 
	1. Queries DB to find all venues within 5km of the user's lon and lat coords
	2. Returns error if there is any
	3. OR Returns list of venues objects mapped to include fields: ID, name, coordinates
*/
app.get('/api/NearByVenues', (req,res)=>{
	allVenuesDB.find({
  		'location': {
   			$nearSphere: {
    			$maxDistance: 5000,
    			$geometry: {
     				type: "Point",
     				'coordinates': [req.query.longitude, req.query.latitude]
    			}
   			}
  		}
 	}, (err, venues) => {
 		if(err){
 			console.log(err);
 		}
 		res.json({
 			'venues': venues.map((ele)=>{
 				return {
 					'id': ele._id,
 					'name': ele.name,
 					'longitude': ele.location.coordinates[0],
 					'latitude': ele.location.coordinates[1], 
 				}
 			}),
 		});
 	});
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




