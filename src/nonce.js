const CryptoJs = require('crypto-js')
let a = "0000helloworld!"

//javascript string->startsWith


console.log(a.startsWith("0000"))
console.log(CryptoJs.SHA256(a).toString().toUpperCase())
//1314042ECF8C8A7702AABA1C82D560B5A262FF3E922BB117FA81F2B002FC37B9
/*
1.a를 암호화 시킨다. 
2. 첫글자가 0이 4개가 되었을 때 블럭을 생성할 수 있도록 작업한다.
첫글자가 0000이 되는것도 엄청 극악의 확률임.
-현재 해시값의 결과물은 16진수
-내 결과물(a)->SHA256(16진수)->2진수

0   0000
1   0001    
2   0010
3   0011
4   0100
5   0101
6   0110
7   0111
8   1000
9   1001
a   1010
B   1011
C   1100
D   1101
E   1110
F   1111




*/