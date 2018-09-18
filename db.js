var mongoose = require('mongoose');

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
  suggestedVenue: String,
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

mongoose.connect('mongodb://localhost/example0');
