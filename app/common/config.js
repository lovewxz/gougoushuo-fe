'use strict'

module.exports = {
	header:{
		method:'POST',
		headers:{
			'Accept':'application/json',
			'Content-Type':'application/json'
		}
	},
	qiniu:{
		upload:'http://up-z2.qiniu.com/',
		thumb: 'http://oeti49vqo.bkt.clouddn.com/',
		video: 'http://oeti49vqo.bkt.clouddn.com/',
		avatar: 'http://oenx8uyc8.bkt.clouddn.com/'
	},
	backup:{
		avatar:'http://www.pcyy.cn/uploads/allimg/160427/1-16042G126440-L.jpg'
	},
	api:{
		//base:'http://rap.taobao.org/mockjs/7813/',
		base:'http://localhost:4321/',
		creative:'api/creative',
		comment:'api/comments',
		up:'api/up',
		signup:'api/u/signup',
		verify:'api/u/verify',
		update:'api/u/update',
		signature:'api/signature',
		video:'api/creative/video',
		audio:'api/creative/audio'
	},
	cloudinary:{
      cloud_name: 'junapp',  
      api_key: '347546455859551',  
      base:'http://res.cloudinary.com/junapp',
      image:'https://api.cloudinary.com/v1_1/junapp/image/upload',
      video:'https://api.cloudinary.com/v1_1/junapp/video/upload',
      audio:'https://api.cloudinary.com/v1_1/junapp/raw/upload'
    }
}