var bcrypt = require('bcrypt-nodejs');
var request = require('request');

//Helper Functions


/*
* Input:  string of input password, and how many salt rounds (rounds of hashing)
* Output: Promise where the resolve passes along the successful hashing of the inputted password
* General :  An inputted password is hashed a certain number of times.
	Returns Promise to handle both outcomes
*/
function hashPassword(inputPswd, saltRounds){
	return new Promise((resolve, reject)=>{

		bcrypt.genSalt(saltRounds, (salt)=>{
			bcrypt.hash(inputPswd, salt,null, (err, hash)=>{
				if(err){
				reject(err);
				}
				resolve(hash);
			});
		});
	});
}

/*
* Input:  string of input password, hashed passowrd
* Output: Promise where the resolve passes along boolean 
	if the hashed password matches the hash of the inputted password
* General: An inputted password is hashed and compared to hash. Returns Promise to handle both outcomes
*/
function comparePasswords(pswdAttmpt, currHash){
	return new Promise((resolve, reject)=>{
		bcrypt.compare(pswdAttmpt, currHash, (err, res)=> {
			if(err){
				reject(err);
			}
			resolve(res);
		});
	});
}


exports.hashPassword = hashPassword;
exports.comparePasswords = comparePasswords;