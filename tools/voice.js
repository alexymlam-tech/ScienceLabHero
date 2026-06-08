const say = require('say');
const text = process.argv.slice(2).join(' '); // 接收命令行傳進來的文字

if (text) {
    say.speak(text);
    console.log(`小敏正在朗讀: ${text}`);
} else {
    console.log("請提供要朗讀的文字。");
}