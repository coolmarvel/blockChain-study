// wallet.js

// secp256k1
// npm i elliptic

const ecdsa = require('elliptic');
const ec = ecdsa.ec("secp256k1")
// console.log(ec)

// //키를 만드는 방법
// console.log(ec.genKeyPair())
// console.log(ec.genKeyPair().getPrivate().toString(16))

function generatorPrivateKey() {
  // 랜덤하게 글자를 만들어주는 행위임.
  const KeyPair = ec.genKeyPair()
  const privateKey = KeyPair.getPrivate()
  return privateKey.toString(16).toUpperCase()
}

console.log(generatorPrivateKey())

const fs = require('fs')                 // 내장객체
const privateKeyLocation = "wallet/" + (process.env.PRIVATE_KEY || "default")         // 환경변수 사용
// 파일명
// const privateFile = privateKeyLocation + "/private_key"
const privateFile = `${privateKeyLocation}/private_key`

function initWallet() {
  // console.log(fs.existsSync('wallet/'))
  // true false 반환함
  if (!fs.existsSync('wallet/')) {
    // 폴더를 생성하는 코드를 작성해주면 된다.
    fs.mkdirSync("wallet/")
  }
  if (!fs.existsSync(privateKeyLocation)) {
    // 폴더를 생성하는 코드를 작성해주면 된다.
    fs.mkdirSync(privateKeyLocation)
  }
  if (!fs.existsSync(privateFile)) {
    // 파일이 없다면 true이고 있으면 false임
    console.log(`주소값 키값을 생성중입니다.`)
    const newPrivateKey = generatorPrivateKey()
    fs.writeFileSync(privateFile, newPrivateKey)
    // 첫번째 인자값은 경로+파일명, 넣을 내용들
    console.log(`개인키 생성이 완료되었습니다.`)

    fs.mkdirSync(privateKeyLocation)
  }

}
initWallet()

// 파일을 읽어서 출력해주느 함수 만들기
function getPrivateFromWallet() {
  const buffer = fs.readFileSync(privateFile)
  // console.log(buffer.toString())          // toString()붙이면 우리가 알아들을 수 있는 결과물로 출력한다.
  return buffer.toString()
}

getPrivateFromWallet()

// 공개키(지갑주소) 
// 비밀키(transaction)인증서라고 생각하면 편함

// 비밀키를 조작해서 공개키를 만드는 과정을 만듦. 컴퓨터를 사용해서 복호화 가능하게 함 
// 근데 원래 복호화가 안되도록 하는게 맞음.


function getPublicFromWallet() {
  const privateKey = getPrivateFromWallet();
  const key = ec.keyFromPrivate(privateKey, "hex")
  return key.getPublic().encode("hex")
}

console.log(getPublicFromWallet())
console.log('----------------------------------------------------------------')
console.log(getPrivateFromWallet())

//AWS pem도 비슷한 인증방식임. RSA인증방식

module.exports = {
  initWallet,
  getPrivateFromWallet,

}