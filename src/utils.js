//2진수를 16진수로 만들기 위해 필요한 함수
function hexToBinary(s) {
  const lookup = {
    "0": "0000",
    "1": "0001",
    "2": "0010",
    "3": "0011",
    "4": "0100",
    "5": "0101",
    "6": "0110",
    "7": "0111",
    "8": "1000",
    "9": "1001",
    "A": "1010",
    "B": "1011",
    "C": "1100",
    "D": "1101",
    "E": "1110",
    "F": "1111",
  }
  console.log(s[3])//배열처럼 내가 원하는 글자를 뽑아올 수 있다. C언어처럼
  console.log(s.length)
  let rst = "";
  for (let i = 0; i < s.length; i++) {
    // console.log(lookup[s[i]])
    if (lookup[s[i]] === undefined) return null
    //if(parseInt(s[i],16)===NaN) return null
    // console.log((parseInt(s[i],16).toString(2).padStart(4,'0')))
    rst += lookup[s[i]]

  }
  return rst;
  //쉽게 변환하는 방법:parseInt(팔진수, 16).toString(2)
}

const txt = "1314042ECF8C8A7702AABA1C82D560B5A262FF3E922BB117FA81F2B002FC37B9"

//첫글자 G이면 undefined뜸
let result = hexToBinary(txt)

// console.log(result)
// console.log('이건 어떤가',(parseInt('G',16)));

module.exports = {
  hexToBinary
}