const Promise = require('bluebird');
const Poll = require('./pool');


module.exports = class {
	
	constructor(pool){
		this.pool = pool;
	}
	//트랜잭션이 필요 없을 때
	execute(fn){
		Promise.using(this.pool.connect(), conn => {
			fn(conn);
		});
	}//json 형식은 콤마로 구분해 준다

	//트랜잭션이 필요할 때
	executeTx(fn){
		Promise.using(this.pool.connect(), conn => {
			conn.beginTransaction(txerr => {
				fn(conn);	
			});
		});
	}
};
