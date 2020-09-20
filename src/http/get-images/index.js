const express = require('express')
const fetch = require('node-fetch')
const fetch = require('art-template')
const fs = require('fs')
const app = express();

let params = {
	"tn": "resultjson_com",
	"ipn": "rt",
	"pn": 0, // 从第几个开始
	"rn": 30, // 一次返回几个
	"word": "新垣结衣" // 关键词
}

function loadImage(keyword = '新垣结衣', pageNum = 0, pageSize = 30) {
	if (pageSize > 100) pageSize = 100;
	params.pn = pageNum;
	params.rn = pageSize;
	params.word = keyword;
	let paramStr = Object.entries(params).map(item => item[0] + '=' + item[1]).join('&')
	paramStr = encodeURI(paramStr);
	return fetch(`https://image.baidu.com/search/acjson?${paramStr}`)
	.then(res => res.json())
	.then(json => {
		let result = []
		json.data.forEach(element => {
			if (element.thumbURL == undefined) {
				return true;
			}
			result.push({
				"href": element.thumbURL || element.middleURL,
				"alt": element.fromPageTitleEnc
			});
		});
		return result;
	})
}  
let first = true
exports.handler = async function http(req) {
  let keyword = req.queryStringParameters.word;
  let pageNum = first ? 0 : params.pn + params.rn;
  let pageSize = req.queryStringParameters.size;
  fisrt = false;
  let imgs = await loadImage(keyword, pageNum, pageSize);
  fs.readFile('./index.html', (err, data) => {
      if (err) {
        return {
          statusCode: 500,
          headers: {'Content-Type': 'text/plain; charset=utf8'},
          body: '出错了，散会！'
        }
      }
      let body = template.render(data.toString(), {
          result: imgs
      });
      return {
        statusCode: 200,
        headers: {'Content-Type': 'text/html; charset=utf8'},
        body
      }
  })
}
