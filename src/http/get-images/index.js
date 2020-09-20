const fetch = require('node-fetch')
const template = require('art-template')
const fs = require('fs')

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
		return new Promise((resolve, reject) => resolve(result));
	})
}  
let first = true
exports.handler = async function http(req) {
  let pageNum = first ? 0 : params.pn + params.rn;
  fisrt = false;
  let keyword = null;
  let pageSize = null;
  if (req.queryStringParameters != null) {
	  keyword = req.queryStringParameters.word;
	  pageSize = req.queryStringParameters.size;
  }
  let imgs = await loadImage(keyword, pageNum, pageSize);
  let data = fs.readFileSync('./index.html')
  let body = template.render(data.toString(), { result: imgs  });
  return {
        statusCode: 200,
        headers: {'Content-Type': 'text/html; charset=utf8'},
        body
      }
}
