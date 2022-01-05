// npm install ws
const WebSocket = require('ws')
const wsPORT = process.env.WS_PORT || 6006
const bc = require('./block')

// 전역변수 peer 
let sockets = []
function getSockets() { return sockets }

const MessageAction = {
  QUERY_LAST: 0,
  QUERY_ALL: 1,
  RESPONSE_BLOCK: 2,
}

// reducer 만들겁니다. 
function initMessageHandler(ws) {
  ws.on("message", data => {  //데이터를 받았을 때의 코드
    const message = JSON.parse(data)
    switch (message.type) {
      case MessageAction.QUERY_LAST:
        write(ws, responseLastMsg())
        break;
      case MessageAction.QUERY_ALL:
        write(ws, responseBlockMsg())
        break;
      case MessageAction.RESPONSE_BLOCK:
        // 요기서 실행함..
        handleBlockResponse(message)
        break;
    }
  })
}

function queryAllMsg() {
  return {
    type: MessageAction.QUERY_ALL,
    data: null
  }
}


function queryBlockMsg() {
  return {
    type: MessageAction.QUERY_LAST,
    data: null
  }
}

function responseLastMsg() {
  return {
    type: MessageAction.RESPONSE_BLOCK,
    data: JSON.stringify([bc.getLastBlock()]) // 마지막블럭을..어떻게..가져올까요?....
  }
}

function responseBlockMsg() {
  return {
    type: MessageAction.RESPONSE_BLOCK,
    data: JSON.stringify(bc.getBlocks())
  }
}

function handleBlockResponse(message) {
  const receivedBlocks = JSON.parse(message.data) // 받은 블록
  const lastBlockReceived = receivedBlocks[receivedBlocks.length - 1] // 받은 블럭의 마지막
  const lastBlockHeld = bc.getLastBlock() // 가지고있는 블럭의 마지막

  // 블록 최신화 체크 
  if (lastBlockReceived.header.index > lastBlockHeld.header.index) {
    console.log(
      "블록의 갯수 \n" +
      `내가 받은 블록의 index 값 ${lastBlockReceived.header.index}\n` +
      `내가 가지고있는 블럭의 index 값 ${lastBlockHeld.header.index}\n`
    )

    // 연결점 어느정도인가. 
    if (bc.createHash(lastBlockHeld) === lastBlockReceived.header.previousHash) {
      console.log(`마지막 하나만 비어있는경우에는 하나만 추가합니다.`)
      if (bc.addBlock(lastBlockReceived)) {
        broadcast(isVaildBlock())
      }
    } else if (receivedBlocks.length === 1) {
      console.log(`피어로부터 블록을 연결해야합니다!`)
      broadcast(queryAllMsg())
    } else {
      console.log(`블럭을 최신화를 진행합니다.`)
      //블럭을 최신화하는 코드를 또 작성......
      bc.replaceBlock(receivedBlocks)
    }

  } else {
    console.log('블럭이 이미 최신화입니다.')
  }


}


// {
//     type:""
//     data:""
// }

function initErrorHandler(ws) {
  ws.on("close", () => { closeConnection(ws) })
  ws.on("error", () => { closeConnection(ws) })
}

function closeConnection(ws) {
  console.log(`Connection close ${ws.url}`)
  sockets.splice(sockets.indexOf(ws), 1)
}

// 최초의 접속 (내 자신을 웹소켓 서버로 만들겠다.)
function wsInit() {
  const server = new WebSocket.Server({ port: wsPORT })//내가 서버니까 내 주소는 알기에 포트번호만 작성하는 것
  server.on("connection", (ws) => {//서버가 클라이언트랑 완ㅇ전히 연결되었을 때 실행되는 코드임. 서버 하나만 틀어서는 실행 안됨
    //두개가 연결되어야 싫애이 된다.
    console.log('우주멋쟁이 성현')
    console.log(ws)
    init(ws) // 소켓키값

  })
}

function write(ws, message) { ws.send(JSON.stringify(message)) }
function broadcast(message) {
  sockets.forEach(socket => {
    write(socket, message)
  })
}

function connectionToPeers(newPeers) { // 배열로 들어갈꺼다. ["ws://localhost:7001","ws://localhost:7002"]
  newPeers.forEach(peer => { // 주소값 ws://localhost:7001
    // 
    const ws = new WebSocket(peer)//상대방의 주소
    ws.on("open", () => { init(ws) })//서로가 연결이 되어서 클라이언트쪽에서 실행되는 코드
    ws.on("error", () => { console.log("connection failed") })
  })
}

function init(ws) {
  sockets.push(ws)
  initMessageHandler(ws)
  initErrorHandler(ws)
  write(ws, queryBlockMsg())
}

module.exports = {
  wsInit,
  getSockets,
  broadcast,
  responseLastMsg,
  connectionToPeers,

}