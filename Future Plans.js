//Old Code
app.get('/api/getSuggestedVenue',(req,res)=>{
	if(req.user.visitedVenues.length<-1){
		//let mostRecentlyVisited = 
		console.log('most recently visited');
		res.json(req.user.visitedVenues.pop());
	}
	else{
		var longitudes = req.user.visitedVenues.map((ele)=>{
			return {
				'timestamp': ele.time,
				'value': ele.coordinates[0],
			}
		});
		var latitudes = req.user.visitedVenues.map((ele)=>{
			return {
				'timestamp': ele.time,
				'value': ele.coordinates[1],
			}
		});

		var longitudePromise = new Promise((resolve, reject)=>{
			console.log('long promise');
			request.post(
				{
					headers: {
						'x-access-token': config.unplugg_api_key,
  						'Content-Type': 'application/json'
					},
					url: 'https://api.unplu.gg/forecast',
					body: JSON.stringify({
						'data': longitudes,
						'forecast_to': Date.now(),
					})
				},
				(err, response, body)=>{
					if(err){
						console.log('lon error');
						console.log(err);
						reject(err);
					}
					else{
						console.log(body);
						resolve(body);
					}
				}
			);
		});
		var latitudePromise = new Promise((resolve, reject)=>{
			console.log('lat promise');
			request.post(
				{
					headers: unpluggHeader,
					url: 'https://api.unplu.gg/forecast',
					body: {
						'data': latitudes,
						'forecast_to': Date.now(),
					}
				},
				(err, response, body)=>{
					if(err){
						console.log('lat error');
						console.log(err);
						reject(err);
					}
					else{
						resolve(body.forecast.pop().value);
						//
					}
				}
			);
		});

		

		longitudePromise.then((longitude)=>{
			console.log('finished long promise');
			latitudePromise.then((latitude)=>{
				console.log('about to find one');
				allVenuesDB.findOne(
					{
					   'location': {
					     $near: {
					       $geometry: {
					          type: "Point" ,
					          coordinates: [ longitude , latitude ]
					       },
					     }
					   }
					},
					(err,closestVenue)=>{
						if(err){
							console.log(err);
						}
						else{
							res.json({
								'name': closestVenue.name,
								'longitude': closestVenue.location.coordinates[0],
								'latitude': closestVenue.location.coordinates[1]
							});
						}
					}

				);
			});
		});
	}
});//() => Venue (name, lon, lat)




//PLAN : 

//Check-in End Point
//Have field in User Schema called: suggested venue
// if checkins > 10: call unplugg api with all the info
// else: make suggestedVenue =  last venue they visited/mos current checkin

// NewEndPoint for Posting:
// -make sure only unplugg can make requests to it
// -Then find nearest venue to unpluggs response and store it in suggestedVenue

// SuggestedVenue endpoint (get)
// simply return suggestedVenue