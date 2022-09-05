const ogs = require('open-graph-scraper'),
      HashMap = require('hashmap'),
      Crypto = require('crypto-js');
      SHA256 = ('crypto-js/sha256');

const EKey = 'nodevue';


// json형태이므로 콤마로 구분
module.exports = {

	makeMap(key, value){
		const map = new HashMap();
		map.set(key, value);
		console.log("TTT>>", map.get(key));
		return map;
	},

	encryptSha2(data, key){
		if(!data) return null;
		key = key || EKey;

		try{
			return Crypto.SHA256(data + key).toString();
		}catch(err){
			console.error('Error on encryptSha2::', err);
		}
	},

	encrypt(data, key){
		//AES양방향 암호화, SHA 단방향 암호화
		return Crypto.AES.encrypt(data, key || EKey).toString();
	},

	decrypt(data, key){
		return Crypto.AES.decrypt(data, key || EKey).toString(Crypto.enc.Utf8);
	
	},

	osginfo(url, fn){
		return ogs({url: url}, (err, ret) => {
			fn(err, ret);
		});
	}

};



