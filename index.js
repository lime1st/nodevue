//const express = require('express'),
//      app = express(),

// socket.io 변경된 방식3.0~ 적용
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

// @socket.io/admin-ui 연결, https://admin.socket.io/에 접속해서 다양한 상태정보를 확인 할 수 있다.
// const { instrument } = require("@socket.io/admin-ui");

// 웹서버를 소켓io에 넣어서 연결
const io = new Server(server, {
  //   cors: {
  //     origin: ["https://admin.socket.io"],
  //     credentials: true,
  //   },
  log: false,
  origins: "*.*",
  pingInterval: 3000,
  pingTimeout: 5000,
});

// admin-ui 연결 설정
// instrument(io, {
//   auth: false,
//   //   {
//   //     type: "basic",
//   //     username: "lime",
//   //     password: "$2b$10$JLzEl168SKFJWMmt63t8WOBl88mBDOlRcfLHTkVzpO9lrwv3E0cqK", // "changeit" encrypted with bcrypt
//   //   },
// });

///////////////////////////////////////////////

const util = require("util");

const Pool = require("./pool");
const Mydb = require("./mydb");

const testJson = require("./test/test.json");
const { uid } = require("hashmap");

const pool = new Pool();

app.use(express.static("public"));

//	익스프레스에 views, engine을 알려준다
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
//	html확장자가 아니라 html형식으로 ejs를 사용하겠다고 통보
app.engine("html", require("ejs").renderFile);

app.get("/", (req, res) => {
  //res.send('Hello NodeJS!');	응답 요청의 방법 send, sendFile, json... 등
  //res.sendFile('index.html');
  //res.json(testJson);
  res.render("index", { name: "홍길동" });
});

app.get("/test/:email", (req, res) => {
  testJson.email = req.params.email; // test/이메시형식 으로 전달
  testJson.aa = req.query.aa; // query 문으로 전달되는 변수 ?aa=123
  res.json(testJson);
});

app.get("/dbtest/:user", (req, res) => {
  let user = req.params.user;
  let mydb = new Mydb(pool);
  mydb.execute((conn) => {
    conn.query("select * from users where uid=?", [user], (err, ret) => {
      res.json(ret);
    });
  });
});

server.listen(7101, () => {
  console.log("Express's started on port 7101");
});

// 설정 방법이 바뀌었다 위에 다시 적음
//const io = require('socket.io').listen(server, {
//	log: false,
//	origins: '*:*',		// url이 달라도 들어올 수 있다.
//	pingInterval: 3000,	// 클라이언트와 서버가 서로 상태체크
//	pingTimeout: 5000	// 연결 후 응답 대기 시간
//});

io.on("connection", (socket, opt) => {
  // 접속 시 보낼 메시지, socket.id는 유일키
  socket.emit("message", { msg: "Welcome " + socket.id });

  // query: 클라이언트에서 접속시 url뒤에 붙여준 것, 이름 받는 용도로도 사용할 수 있다
  // ex)클라이언트의 스크립트: var socket = io("http://local.mydeal.com:7101?uid=uid");
  util.log("connection>>", socket.id, socket.handshake.query);

  // 'join'(이벤트이름) 은 클라-서버간 미리 약속된 용어로 정하면 됨
  // data는 클라이언트가 보낸 것, fn 콜백함수, 줄 수도 있고주안 줄 수도 있다.
  // es5형태
  // roomId에 join(연결), id를 표시하려면 콜백함수에 함께 넘겨준다 function(roomId, userid, fn)
  socket.on("join", function (roomId, fn) {
    // socket.join이 콜백함수가 없어지고 프로미스를 리턴하는 것으로 변경되었다
    // socket.join(roomId, function () {
    //   util.log("Join >>", roomId, JSON.stringify([...socket.rooms]));
    //   //   if (fn) fn();
    // });

    // socket.userid = userid	userid를 받을 경우 그냥 소켓에 집어 넣어주면 된다.
    socket.join(roomId);
    util.log("Join >>", roomId, JSON.stringify([...socket.rooms]));
    if (fn) fn();
  });

  socket.on("leave", function (roomId, fn) {
    // leave의 콜백함수도 없어짐
    // socket.leave(roomId, function () {
    //   // fn이 있을 때만 호출
    //   if (fn) fn();
    // });
    socket.leave(roomId);
    if (fn) fn();
  });

  socket.on("rooms", function (fn) {
    //socket.rooms가 Set으로 변경되어 Object.keys가 먹지 않아 아래와 같이 Set을 Json으로 변경했다.
    // 배열로 바꿀 경우 Array.from(socket.rooms)
    // fn을 불렀는데 없으면 에러가 나므로 처리해 준다.
    if (fn) fn(JSON.stringify([...socket.rooms]));
  });

  // keys는 {roomId: [socket1, socket2]} 이런 식의 json형태==>바로 위의 주석 참조
  // es6형태(화살표 함수)
  // data 형식: {room: 'roomid', msg: 'msg ㄴ내용..'}
  socket.on("message", (data, fn) => {
    util.log("message 서버>>", data.msg, data.room, socket.rooms);
    if (fn) fn(data.msg);

    // 보낸 사람을 제외하고 같은 방에 있는 사람에게 메시지 전송
    socket.broadcast
      .to(data.room)
      .emit("message", { room: data.room, msg: data.msg });
  });

  // 귓속말 이벤트 message-for-one
  socket.on("message-for-one", (socketid, msg, fn) => {
    socket.to(socketid).emit("message", { msg: msg });
  });

  socket.on("disconnecting", function (data) {
    // 방 목록이 다 나온다, 현재 방상태를 알 수 있다
    util.log("disconnecting>>", socket.id, socket.rooms);
  });

  socket.on("disconnect", function (data) {
    //	이미 나온 방, socket만 확인
    util.log("disconnect>>", socket.id, socket.rooms);
  });
});
