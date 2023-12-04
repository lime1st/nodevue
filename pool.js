const mysql = require("mysql"),
  util = require("util"),
  Promise = require("bluebird");

Promise.promisifyAll(mysql);
Promise.promisifyAll(require("mysql/lib/Connection").prototype);
Promise.promisifyAll(require("mysql/lib/Pool").prototype);

const DB_INFO = {
  host: "",
  user: "mydeal",
  password: "",
  database: "mydealdb",
  multipleStatements: true,
  connectionLimit: 5,
  waitForConnections: false,
};

module.exports = class {
  constructor(dbinfo) {
    dbinfo = dbinfo || DB_INFO;
    this.pool = mysql.createPool(dbinfo);
  }

  connect() {
    // util.log("connect 호출");
    // connection을 다 사용하고 나면 disposer가 호출된다.
    return this.pool.getConnectionAsync().disposer((conn) => {
      // 바로 닫지 않고 재사용 하기 위해 릴리즈
      return conn.release();
    });
  }

  end() {
    this.pool.end(function (err) {
      util.log(">>>>>>>>>>>>>> End of Pool!");
      if (err) util.log("ERR pool ending!!");
    });
  }
};
