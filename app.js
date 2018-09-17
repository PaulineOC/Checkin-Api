var express = require('express');
var app = express();
var mongoose = require('mongoose');
var db = require('./db.js');






//Mongoose Models:
var User = mongoose.model('UserSchema');
var allVenuesDB = mongoose.model('VenueSchema');





// unauthenticated endpoints
app.post('/api/register', (req, res) => {
	
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


app.listen(3000);


