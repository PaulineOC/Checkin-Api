var express = require('express');
var app = express();
var mongoose = require('mongoose');
var db = require('./db.js');
var helper = require('./helper.js');
var bodyParser = require('body-parser');
var uuidv4 = require('uuid/v4');
var cookieParser = require('cookie-parser');
var request = require('request');


//Mongoose Models:
var User = mongoose.model('UserSchema');
var allVenuesDB = mongoose.model('VenueSchema');

//Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());




//Data
var allRestaurantsObj = require('./smallRestaurants.js');
var allRestaurants = allRestaurantsObj.listSmallRest;



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
							suggestedVenue: '',
							sessionTokens: [],
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
						User.findByIdAndUpdate(existingUser._id, 
							{$push: { 'sessionTokens': sessionToken }},
							{new: true}, (err, newToken)=>{
								if(err){
									res.send("err");
								}
								res.cookie('session-id',sessionToken, { maxAge: 900000});
								res.json({
									'status': 'set cookie!!!',
									'user': newToken,
								});
							});
					}//end of passwords match
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

//Middleware: test authenticated user
/*
* Input:  Req, Res object, next function
* Output: Error OR calls next() function 
* General :  Checks if the session ID stored in a cookie
	exists in any user's sessionToken array.
	If exists: set attach the user to the request obj
	If not: throw error
*/
app.use((req, res, next)=>{
	//console.log(req.cookies['session-id']);
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
		next();
	}
});

/*
* Input:  user's longitude and user's latitude passed through request object
* Output: Status & (if successful: list of venue objects) (if unsuccessful: err)
* General: 
	1. Queries DB to find all venues within 5km of the user's lon and lat coords
	2. Returns error if there is any
	3. OR Returns list of venues objects mapped to include fields: ID, name, coordinates
*/
app.get('/api/nearByVenues', (req,res)=>{
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

/*
* Input:  user's longitude, user's latitude passed, 
	venue's name, venue's longitude, venue's latitude via request object
* Output: Status & (if successful: updated User) (if unsuccessful: err)
* General: 
	1. Queries venue DB to see if venue exists & if venue is within 1km of the user's coords
	2. Returns error if any
	3. OR Updates user's visited venue array with the venue (lon, lat, name)
	4. Returns error if any OR returns updated User 
*/
app.post('/api/checkIn',(req,res)=>{
	allVenuesDB.findOneAndUpdate(
		{
			$and: [
				{'name': req.body.venueName},
				{
					'location': {
			   			$nearSphere: {
			    			$maxDistance: 1000,
			    			$geometry: {
			     				type: "Point",
			     				'coordinates': [req.body.userLongitude, req.body.userLatitude]
			    			}
			   			}
		  			}	
				}
			]
		},
		{$push: {'checkedInUsers': req.user.email}},
		(err, venue)=> {
			if(err || !venue){
				console.log(err);
			}
			else{
				User.findOneAndUpdate(
					{ '_id' : req.user._id},
					{$push: 
						{'visitedVenues': 
							{
								'coordinates': [req.body.venueLongitude, req.body.venueLatitude],
								'name': req.body.venueName,
							}
						}
					},
					(err, updatedUser)=>{
						if(err || !updatedUser){
							console.log(err);
						}
						else{
							console.log('Added to visited venues');
							//console.log(req.user.visitedVenues);
							if(req.user.visitedVenues.length>10){
								helper.makeUnpluggRequest(user).then((resolve)=>{

									console.log('in then');
								});
							}
							else{
								User.findOneAndUpdate(req.user_id,{'suggestedVenue': venue._id},{new: true},(err, updatedSuggested)=>{
									if(err){
										console.log(err);
									}
									else{
										console.log('updated suggested venue');
										console.log(updatedUser.suggestedVenue);
										res.json({updatedUser});
									}
								});
							}
						}

					}
				);
			 }
		}
	);
});
/*
* Input:  none
* Output: Status & (if successful: list of popular venues) (if unsuccessful: err)
* General: 
	1. Queries venue DB to see top 3 venues based on # of people checked in
	2. Returns error if any
	3. OR Returns a list of 3 most popular venues 
*/
app.get('/api/popularVenues',(req,res)=>{
	allVenuesDB.aggregate(
				[
					{
						"$project": {
							"name": 1,
							"location": 1,
							"checkedInUsers": 1,
							"length" : { "$size": "$checkedInUsers"}
						}
					},
					{"$sort": {"length": -1}},
					{"$limit": 3}
				],(err, sortedVenues)=>{
					let mapped = sortedVenues.map((ele)=>{
						let len = ele.checkedInUsers.length;
						return {
							id: ele._id,
							'name': ele.name,
							'longitude': ele.location.coordinates[0],
							'latitude': ele.location.coordinates[1],
							'numCheckedIn': len,
							'checkedInUsers': ele.checkedInUsers
						};
					});
					console.log('success');
					res.json(mapped);
			});
});

/*
* Input:  user's longitude and latitude coordinates via request object
* Output: Status & (if successful: list of venues with field that has checked in users) 
	(if unsuccessful: err)
* General: 
	1. Queries venue DB get all venues within 5km
	2. Returns list of venues with its list of checked-in users  OR error
* Note: I returned the venue object rather than just an array with users
	 so that the front-end can keep track of which users are at which venue
*/
app.get('/api/nearByUsers',(req,res)=>{
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
 		else{
 			let allUsers = venues.map((ele)=>{
 				return {
 					'name': ele.name,
 					'longitude':ele.location.coordinates[0],
 					'latitude': ele.location.coordinates[1],
 					'checkedInUsers': ele.checkedInUsers,
 				}
 			});
 			res.json(allUsers);
 		}
 	});
});


app.get('/api/suggestedVenue',(req,res)=>{
	res.json({'suggestedVenue': req.user.suggestedVenue})
});


app.post('/api/unpluggWebhook', (req,res)=>{
	console.log(res);
	//something with the data? 
});



/*For Uploading Venues: 
* Adds all venues from an array
* Sends array of all objects added to DB when finished
* To Note: need a bulk insert for bigger quantity of items, 
	since small sample size - going with simple for loop.
*/
app.get('/addAllTestVenues', (req,res)=>{
	var allObjs = [];
	for(let i=0;i<allRestaurants.length;i++){
		var newVenue = new allVenuesDB({
			 location: {
			    coordinates: allRestaurants[i].location.coordinates,
			    type: "Point"
			},
			name: allRestaurants[i].name
		}).save((err, venue) => {
			if (err) {
				console.log(err);
			}
			else{
				allObjs.push(venue);
				if(allObjs.length===allRestaurants.length){
					res.send(allObjs);
				}
			}
 		});
	}
});

app.listen(8080);



// when they checkin -> 
// if checkins > 10: call unplugg api with all the info
// else: make suggestedVenue the last venue they visited aka the current


// define new endpoint thats a post
// make sure only unplugg can make requests to it
// Then find nearest venue to unpluggs response and store it in suggestedVenue

// In suggestedVenue
// simply return suggestedVenue
