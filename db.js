var mongoose = require('mongoose');
mongoose.Promise = global.Promise;


var User = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  }, 
  password: {
    type: String,
    required: true,
  },
  visitedVenues: [
    {
      time : { type : Number, default: Date.now },
      coordinates: [Number],
      name: String
    }
  ],
  //suggestedVenue: String,
  sessionTokens: [String]
});

var Venue = new mongoose.Schema({
  location: {
    coordinates: {
      type: [Number],
    },
    type: { 
      type: String 
    },
  },
  name: String,
  checkedInUsers: [String]

});
Venue.index({ location: "2dsphere" });

mongoose.model("VenueSchema", Venue);
mongoose.model("UserSchema", User);


//Setting up environment: 

// process.env.DATABASE_URL

if(process.env.NODE_ENV == 'production'){
  var dbconf = process.env.MONGODB_URI;
}
else{
  var dbconf = 'mongodb://localhost/example';
}
mongoose.connect(dbconf);
