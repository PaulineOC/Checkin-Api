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
  visitedVenues: [String],
  sessionTokens: [String]
});

var Venues = new mongoose.Schema({
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
Venues.index({ location: "2dsphere" });

mongoose.model("VenueSchema", Venues);
mongoose.model("UserSchema", User);

mongoose.connect('mongodb://localhost/test2');
