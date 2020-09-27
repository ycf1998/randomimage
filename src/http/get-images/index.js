const fetch = require('node-fetch')
const template = require('art-template')
const fs = require('fs')

/**
 * 来源百度
 * @param {*}} word 
 * @param {*} pageNum 
 * @param {*} pageSize 
 */
let paramsForBaidu = {
	"tn": "resultjson_com", // 必填参数
	"ipn": "rt", // 必填参数
	"word": "", // 关键字
	"pn": 0, // 起始下标
	"rn": 0 // 每次请求n张
}
function loadImgsForBaidu(word = '新垣结衣', pageNum = 0, pageSize = 30) {
	if (pageSize > 100) pageSize = 100;
	paramsForBaidu.pn = pageNum;
	paramsForBaidu.rn = pageSize;
	paramsForBaidu.word = word;
	let paramStr = formatUrlParams(paramsForBaidu)
	return fetch(`https://image.baidu.com/search/acjson?${paramStr}`)
	.then(res => res.json())
	.then(json => {
		let imgs = [];
		json.data.forEach(element => {
			if (element.thumbURL == undefined) {
				return true;
			}
			imgs.push({
				"href": element.thumbURL || element.middleURL,
				"alt": element.fromPageTitleEnc
			});
		});
		return imgs;
	})
}  

/**
 * 来源搜狐
 * @param {*}} word 
 * @param {*} pageNum 
 * @param {*} pageSize 
 */
let paramsForSouhu = {
	"query": "", // 关键字
	"start": 0, // 起始下标
	"xml_len": 0, // 每次请求n张
	"cwidth": "", // 宽
	"cheight": "" //高
}
function loadImgsForSouhu(word = '新垣结衣', pageNum = 0, pageSize = 30) {
	if (pageSize > 100) pageSize = 100;
	paramsForSouhu.start = pageNum;
	paramsForSouhu.xml_len = pageSize;
	paramsForSouhu.query = word;
	let paramStr = formatUrlParams(paramsForSouhu)
	return fetch(`https://pic.sogou.com/api/pic/searchList?${paramStr}`)
		.then(res => res.json())
		.then(json => {
			let imgs = [];
			json.items.forEach(element => {
				imgs.push({
					"href": element.oriPicUrl || element.picUrl,
					"alt": element.title
				});
			});
			return imgs;
		})
}

exports.handler = async function http(req) {
  let word;
  let pageSize = 25;
  if (req.queryStringParameters != null) {
	  word = req.queryStringParameters.word;
	  pageSize = req.queryStringParameters.size / 2 || 25;
  }
  let pageNum = Math.floor(Math.random() * 20 * pageSize);
  let imgsForBaidu = await loadImgsForBaidu(word, pageNum, pageSize);
  let imgsForSouhu = await loadImgsForSouhu(word, pageNum, pageSize);
  let data = fs.readFileSync('./index.html')
  let body = template.render(data.toString(), { result: [...imgsForBaidu, ...imgsForSouhu]  });
  return {
        statusCode: 200,
        headers: {'Content-Type': 'text/html; charset=utf8'},
        body
      }
}

function formatUrlParams(params) {
	let paramStr = Object.entries(params).map(item => item[0] + '=' + item[1]).join('&')
	return encodeURI(paramStr);
}
