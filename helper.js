//Helper Functions

var bcrypt = require('bcrypt');


/*
* Input:  string of input password, and how many salt rounds (rounds of hashing)
* Output: Promise where the resolve passes along the successful hashing of the inputted password
* General :  An inputted password is hashed a certain number of times and returns Promise to handle both outcomes
*/
function hashPassword(inputPswd, saltRounds){
	return new Promise((resolve, reject)=>{
		bcrypt.hash(inputPswd,saltRounds, (err, hash)=>{
			if(err){
				reject(err);
			}
			resolve(hash);
		});
	});
}

exports.hashPassword = hashPassword;