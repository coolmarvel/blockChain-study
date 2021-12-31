const fs = require('fs')
const merkle = require('merkle')
const CryptoJs = require('crypto-js')
const random = require('random')
const { hexToBinary } = require('./utils')

const BLOCK_GENERATION_INTERVAL = 10;//초단위 10초임
const BLOCK_ADJUSTMENT_INTERVAL = 10//10번째마다 난이도가 늘어나는 걸 만들고 싶은 것임.

class BlockHeader {
  constructor(version, index, previousHash, time, merkleRoot, difficulty, nonce) {
    this.version = version
    this.index = index
    this.previousHash = previousHash
    this.time = time
    this.merkleRoot = merkleRoot
    //문제의 난이도,문제를 몇번정도 풀었는지, (09.08)
    this.difficulty = difficulty
    this.nonce = nonce
  }
}

class Block {
  constructor(header, body) {
    this.header = header
    this.body = body
  }
}

let Blocks = [createGenesisBlock()]

function getBlocks() {
  return Blocks
}

function getLastBlock() {
  return Blocks[Blocks.length - 1]
}

function createGenesisBlock() {
  const version = "1.0.0"//
  const index = 0
  const time = 1630907567
  const previousHash = '0'.repeat(64)
  const body = ['hello block']

  const tree = merkle('sha256').sync(body)
  const root = tree.root() || '0'.repeat(64)

  //09.08추가
  const difficulty = 0
  const nonce = 0

  const header = new BlockHeader(version, index, previousHash, time, root, difficulty, nonce)
  return new Block(header, body)
}


function nextBlock(data) {
  const prevBlock = getLastBlock()
  const version = getVersion()
  const index = prevBlock.header.index + 1
  const previousHash = createHash(prevBlock)
  const time = getCurrentTime()
  const difficulty = getDifficulty(getBlocks())
  //함수를 만들어서 조절을 할 것이다.//총 코인의 갯수를 정해놓고 난이도를 정해놓는 방법도 있다.
  //
  const merkleTree = merkle("sha256").sync(data)
  const merkleRoot = merkleTree.root() || '0'.repeat(64)

  const header = new findBlock(version, index, previousHash, time, merkleRoot, difficulty);
  return new Block(header, data)
}

function getDifficulty(blocks) {

  const lastBlock = blocks[blocks.length - 1];
  if (lastBlock.header.index % BLOCK_ADJUSTMENT_INTERVAL === 0 && lastBlock.header.index != 0) {
    //난이도 조정 코드
    return getAdjustedDifficulty(lastBlock, blocks)
  }
  return lastBlock.header.difficulty
}

function getAdjustedDifficulty(lastBlock, blocks) {
  //block들을 10개 단위로 끊는다. 게시판의 페이징처럼 10개씩 관리를 할 것임.
  //'나의 10번째 전의 블록과 비교해서 난이도를 1번 증가시키겠다.'라는 것이 더 정확함
  //갯수 관련
  const preAdjustmentBlock = blocks[blocks.length - BLOCK_ADJUSTMENT_INTERVAL];
  //시간 관련
  const timeToken = lastBlock.header.time - preAdjustmentBlock.header.time;
  const timeExpected = BLOCK_ADJUSTMENT_INTERVAL * BLOCK_GENERATION_INTERVAL;
  if (timeExpected > timeToken / 2) {
    return preAdjustmentBlock.header.difficulty + 1;
  } else if (timeExpected < timeToken * 2) {
    return preAdjustmentBlock.header.difficulty - 1;
  } else {
    return preAdjustmentBlock.header.difficulty
  }
}

function findBlock(version, index, previousHash, time, merkleRoot, difficulty) {
  let nonce = 0
  while (true) {
    let hash = createHeaderHash(version, index, previousHash, time, merkleRoot, difficulty, nonce)
    console.log(hash);
    if (hashMatchDifficulty(hash, difficulty)) {//우리가 만들 header의 hash값의 앞자리 0이 몇개인가....
      //이곳에서 createHeaderHash 함수 호출할 것임
      return new BlockHeader(version, index, previousHash, time, merkleRoot, difficulty, nonce);
    }
    nonce++;
  }
}

function hashMatchDifficulty(hash, difficulty) {
  const hashBinary = hexToBinary(hash);
  const prefix = "0".repeat(difficulty);

  //높으면 높을수록 조건을 맞추기가 까다로워짐(nonce값과 time값이 바뀌면서 암호화값이 달라진다.)
  return hashBinary.startsWith(prefix)

}

function createHeaderHash(version, index, previousHash, time, merkleRoot, difficulty, nonce) {
  let txt = version + index + previousHash + time + merkleRoot + difficulty + nonce
  return CryptoJs.SHA256(txt).toString().toUpperCase()

}

function createHash(block) {
  const {
    version,
    index,
    previousHash,
    time,
    merkleRoot
  } = block.header
  const blockString = version + index + previousHash + time + merkleRoot;
  const Hash = CryptoJs.SHA256(blockString).toString()
  return Hash
}


function addBlock(newBlock) {

  if (isVaildNewBlock(newBlock, getLastBlock())) {
    Blocks.push(newBlock);
    return true;
  }
  return false;
}

function mineBlock(blockData) {
  const newBlock = nextBlock(blockData)
  if (addBlock(newBlock)) {
    const nw = require('./network')
    nw.broadcast(nw.responseLastMsg())
    return newBlock
  } else {
    return null
  }
}


function isVaildNewBlock(currentBlock, previousBlock) {
  if (!isVaildType(currentBlock)) {
    console.log(`invaild block structrue ${JSON.stringify(currentBlock)}`)
    return false
  }
  if (previousBlock.header.index + 1 !== currentBlock.header.index) {
    console.log(`invaild index`)
    return false
  }

  if (createHash(previousBlock) !== currentBlock.header.previousHash) {
    console.log(`invaild previousBlock`)
    return false
  }

  if (currentBlock.body.length === 0) {
    console.log(`invaild body`)
    return false
  }

  if (merkle("sha256").sync(currentBlock.body).root() !== currentBlock.header.merkleRoot) {
    console.log(`invalid merkleRoot`)
    return false
  }

  return true
}

function isVaildType(block) {
  return (
    typeof (block.header.version) === "string" &&
    typeof (block.header.index) === "number" &&
    typeof (block.header.previousHash) === "string" &&
    typeof (block.header.time) === "number" &&
    typeof (block.header.merkleRoot) === "string" &&
    typeof (block.body) === "object"
  )

}

function replaceBlock(newBlocks) {

  if (isVaildBlock(newBlocks) && newBlocks.length > Blocks.length && random.boolean()) {
    console.log(`Blocks 배열을 newBlocks 으로 교체합니다.`)
    const nw = require('./network')
    Blocks = newBlocks
    nw.broadcast(nw.responseLastMsg())

  } else {
    console.log(`메시지로 부터 받은 블록배열이 맞지 않습니다.`)
  }
}


function getVersion() {
  const { version } = JSON.parse(fs.readFileSync("../package.json"))
  return version
}

function getCurrentTime() {
  return Math.ceil(new Date().getTime() / 1000)
}


function isVaildBlock(Blocks) {
  if (JSON.stringify(Blocks[0]) !== JSON.stringify(createGenesisBlock())) {
    console.log(`genesis error`)
    return false
  }

  let tempBlocks = [Blocks[0]]
  for (let i = 1; i < Blocks.length; i++) {
    if (isVaildNewBlock(Blocks[i], tempBlocks[i - 1])) {
      tempBlocks.push(Blocks[i])
    } else {
      return false
    }
  }

  return true
}



module.exports = {
  getBlocks,
  getLastBlock,
  addBlock,
  getVersion,
  mineBlock,
  createHash,
  replaceBlock
}
