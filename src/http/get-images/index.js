const fetch = require('node-fetch')
const template = require('art-template')
const fs = require('fs')

const defaultWord = '新垣结衣'; // 默认关键字

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
	"rn": 0, // 每次请求n张
	"width": "",
	"height": "",
}
function loadImgsForBaidu(word = '', pageNum = 0, pageSize = 100, width = '', height = '') {
	paramsForBaidu.pn = pageNum;
	paramsForBaidu.rn = 100;
	if (word == '') {
		word = defaultWord;
	}
	paramsForBaidu.word = word;
	paramsForBaidu.width = width;
	paramsForBaidu.height = height;
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
	}).catch(err => [])
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
function loadImgsForSouhu(word = '新垣结衣', pageNum = 0, pageSize = 100, width = '', height = '') {
	paramsForSouhu.start = pageNum;
	paramsForSouhu.xml_len = 100;
	if (word == '') {
		word = defaultWord;
	}
	paramsForSouhu.query = word;
	paramsForSouhu.cwidth = width;
	paramsForSouhu.cheight = height;
	let paramStr = formatUrlParams(paramsForSouhu)
	return fetch(`https://pic.sogou.com/api/pic/searchList?${paramStr}`)
		.then(res => res.json())
		.then(json => {
			let imgs = [];
			json.items.forEach(element => {
				imgs.push({
					"href": element.picUrl,
					"alt": element.title
				});
			});
			return imgs;
		}).catch(err => [])
}

exports.handler = async function http(req) {
  /**
  参数：
   关键字：word
   显示n张：size(不超过100)
   图片宽: width
   图片高: height
  **/
  let word;
  let width;
  let height;
  let pageSize = 25;
  if (req.queryStringParameters != null) {
	  word = req.queryStringParameters.word;
	  width = req.queryStringParameters.width;
	  height = req.queryStringParameters.height;
	  pageSize = req.queryStringParameters.size || 25;
  }
  let pageNum = Math.floor(Math.random() * 20 * pageSize);
  // 获取图片
  let imgsForBaidu = await loadImgsForBaidu(word, pageNum, pageSize, width, height);
  let imgsForSouhu = await loadImgsForSouhu(word, pageNum, pageSize, width, height);
  // 处理聚合图片
  let allImgs = [...imgsForBaidu, ...imgsForSouhu];
  allImgs = allImgs.filter(img => img.alt.match(word));
  shuffle(allImgs);
  allImgs = allImgs.length > pageSize ? allImgs.slice(0, pageSize) : allImgs;

  let data = fs.readFileSync('./index.html')
  let body = template.render(data.toString(), { result: allImgs});
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

function shuffle(arr) {
	var i = arr.length,
		t, j
	while (i) {
		j = Math.floor(Math.random() * i--)
		t = arr[i]
		arr[i] = arr[j]
		arr[j] = t
	}
}
