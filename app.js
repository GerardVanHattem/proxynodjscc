//load needed modules
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const randomstring = require("randomstring");
const app = express();
const axios = require('axios');
const session = require('express-session'); 
const MemoryStore = require('memorystore')(session); ;
const http = require('http');
const fs = require('fs');
const helmet = require('helmet');
const querystring = require('querystring');
const crypto = require("crypto");
const client_id = 'client_id'; 
const client_secret = 'client_secret';
const config = require('./config');
const encryption = require('./encryption'); 
const os = require('os');
const filesystem = require('path');
const mime = require('mime');
app.use(express.json())

const request = require('request')


//do things on every request
app.all("*", (req,res, next) => {

		next(); 
		
})

//event on proxy response
function onProxyRes(proxyRes, req, res) {
	
	
  
}


//event on proxy request
function onProxyReq(proxyReq, req, res) {	
		
	const encryptedAuthorizationHeader = req.headers.authorization; 	
		 
	const isBearer = encryptedAuthorizationHeader.startsWith("Bearer");
	const encryptedToken = encryptedAuthorizationHeader.split(' ')[1];
	
	if(!encryptedToken && isBearer){         
		res.status(401)
		res.json({'error':'No valid token'}) 
	}  
	
	//decrypt token
	decryptedToken = encryption.decrypt(encryptedToken); 
	decryptedAuthorizationHeader = 'Bearer ' + decryptedToken;  

	proxyReq.setHeader('Authorization', decryptedAuthorizationHeader);
	
}


const middlewareOptions = {
	
	target: config.api.ssl +'://'+config.api.host + config.api.base_path + '/', 
	changeOrigin: true, 
	onProxyReq:onProxyReq,
	onProxyRes:onProxyRes,
    //logLevel: 'debug',
	pathRewrite: {	  
       [`^/api/v1`]: '',
   }
}

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'https://master.d23zxthy4ykh0n.amplifyapp.com')
  res.header('Access-Control-Allow-Credentials', true)
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

let cors = require('cors')
/*
var whitelist = ['http://localhost:3001','https://master.d23zxthy4ykh0n.amplifyapp.com']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
} 
app.use(cors(corsOptions))
app.use(cors('*'))*/ 

const corsOptions = {
  origin: config.api.cors_domain
}

app.use(cors(corsOptions))

app.use('/api/v1', createProxyMiddleware(middlewareOptions));


app.post('/oauth/token', (req,res) => {
		
	const username = req.body.email	
	const password = req.body.password;
	
	
	console.log(req.body); 
	
	const baseUrl = config.api.ssl + '://' + config.api.host + config.api.base_path; 
	
		
	axios.post(baseUrl+'/oauth/token', {
		password:password,
		username:username,
		client_id: process.env.client_id,
		client_secret:process.env.client_secret, 
		grant_type:'password', 
	 }).then(function(response) {
		

		encryptedToken = encryption.encrypt(response.data.access_token); 
		encryptedRefeshToken = encryption.encrypt(response.data.refresh_token); 
		
				
		var data = {
			'accessToken':encryptedToken,
			'refreshToken': encryptedRefeshToken
		}
		console.log(data); 
		//res.header("Access-Control-Allow-Origin","*");
		
		res.json(data); 
		
		
       //res.send(response.data)
    })
    .catch(error => {
		//console.log(error); 
		//res.send(error); 
	   //res.status(error.response.status)
	   
	   //send already a json
       //res.send(error.response.data)  
    })

})

app.get('/me', (req,res) => {
	
		
		const encryptedAuthorizationHeader = req.headers.authorization; 	
		 console.log(encryptedAuthorizationHeader); 
		const isBearer = encryptedAuthorizationHeader.startsWith("Bearer");
		const encryptedToken = encryptedAuthorizationHeader.split(' ')[1];
		
		if(!encryptedToken && isBearer){         
			res.status(401)
			res.json({'error':'No valid token'}) 
		} 
		
		//decrypt token		
		const decryptedToken = encryption.decrypt(encryptedToken); 		
		decryptedAuthorizationHeader = 'Bearer ' + decryptedToken;
		
		const baseUrl = config.api.ssl + '://' + config.api.host + config.api.base_path; 
		
		axios.request({ 
		  url:baseUrl + '/me',
		  method:'GET',
		  headers:{
			  'Authorization':decryptedAuthorizationHeader,
			  'Content-Type':'application/json',
			  'Accept':'application/json'  
		  }
		}).then(function (response) {
			res.status(200); 
			res.json(response.data);
		})
		.catch(function (error) {
			
			res.status(error.response.status)
			res.send(error.response.data)   
			
		})

})

app.get('/', (req,res) =>{
	//res.download('check.pdf', 'check.pdf')
	
	res.send('keys' + config.api.client_id + ' ' + process.env.CLIENT_SECRET + 'host' +config.api.host); 

	//https://stackoverflow.com/questions/29562954/downloaded-pdf-files-are-corrupted-when-using-expressjs
	var filename = filesystem.basename('check.pdf');
	var mimetype = mime.lookup('check.pdf');

	res.setHeader('Content-disposition', 'inline; filename=' + filename);
	res.setHeader('Content-type',  mimetype);

	var filestream = fs.createReadStream(filename);
	filestream.pipe(res);
	
	//res.download('check.pdf', 'check.pdf'); 
	
	//res.send('working..'); 
	
})

app.get('/cases/:case_id/file/:filename', (req,res) =>{
	
	const id = req.params.case_id;
	const filename = req.params.filename;
	
	const encryptedAuthorizationHeader = req.headers.authorization; 	
		 
	const isBearer = encryptedAuthorizationHeader.startsWith("Bearer");
	const encryptedToken = encryptedAuthorizationHeader.split(' ')[1];
	
	if(!encryptedToken && isBearer){         
		res.status(401)
		res.json({'error':'No valid token'}) 
	} 
	
	//decrypt token		
	const decryptedToken = encryption.decrypt(encryptedToken); 		
	//const decryptedToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0MyIsImp0aSI6ImI0Zjg5MmZlZDUwMmQ1ZWM3NzhmNGE5NDE5YWU2OTI4NGIzNjNhNGE1OTVkNzc3YzY5MmIxN2YzN2Y5MjQwODViMjg3OTViOWNlZmJhNGQ1IiwiaWF0IjoxNjI2OTgyOTQ3LjkwMDcxNSwibmJmIjoxNjI2OTgyOTQ3LjkwMDcyNSwiZXhwIjoxNjU4NTE4OTQ3LjYxMjQ4Miwic3ViIjoiMSIsInNjb3BlcyI6W119.zVCLgGYRTizl8K5I5lQeJs2VpyKZpU4an7umwqut801DVClZdMTAll6CgDzZqAhaLKyKzNFhIsS3rAHtgCP-URa5X07Etfmxg9X1PuWqizMm6i5gY2DTERsXoX7YLDEwO3FhOmD5hirquqjEnCs6mr4kKlvDCdP5xH7kJEdVX03yKDJZ89fTfKtUAMUzCooxC1sXu18jOG8oiXgdmuDuDKFu4g6iEKEdVu53nkjTEezMT7kMVSaM9_NHuBH-CT3SpYZdyLs3zeHwzERkInGLnSSlsRarC3CoKTwrhQuJHqRoPkhWfWrexhIJM-TZ58zSKNN86bfjy9hX8-h4Uq-TP8lWqgKoRRJjH6A92Tgnu9_BynvwkVIS1fthBldayxaWTJl8d1PYk8CbZkt9Ib-cIUzTh90IG357XMO4Hch9jMSmQ5vX4MvGn4Ul0zqK0vOgYfyxuoeCzyN6MKF8fb_rmyid7MfxB3uhqSKHTcCMHeTMbgitpNX9bpWpmglD2jq-AwrUNlmUZozUTvqHxwqgxaqVBwWzVoyb6Z5eYaOxYY9k9k-sfqwXd3hQTBmVileDuvarhBtjBrJuO0tsjhNqz1diIwkW65yIWNeRLf9BPwf161X6RXhbjfdwJr0NEeSUz4Sg-us0HXe-GZwMSe3NT4ouLKd_tkNcoFpwFpK5By8'; 
	
	decryptedAuthorizationHeader = 'Bearer ' + decryptedToken;
	
	var http = require('http');


	var urldata = {
		host: config.api.host,
		path: config.api.base_path+ '/cases/' + id + '/file/' + filename,
		method: 'GET', 
		headers:{
		  Authorization:decryptedAuthorizationHeader
		}
	}
	
	var resultHandler = function(err) { 
		if(err) {
			console.log("unlink failed", err);
		} else {
			console.log("file deleted");
		}
	}


	function OnResponse(response) { 
	
		//get filename
		//var filename = response.headers['content-disposition'].split("filename=")[1];
		var filename = 'check.pdf'
		
		//get extension
		
		///os.tmpdir()
		var path = require('path')
		var extension = path.extname(filename); 
		
		//create temp filename
		var crypto = require("crypto");
		var id = crypto.randomBytes(20).toString('hex');		
		var tempFileName = os.tmpdir() + '/'  +id+extension; 
		//var tempFileName = os.tmpdir() + '/'  +id+extension; 
		
		//console.log(tempFileName);
		
		//write received file on server
		const fileStream = fs.createWriteStream('check.pdf');  
		response.pipe(fileStream);
		
		tempFileName2 = 'check.pdf'; 
		//tempFileName2 = tempFileName; 
		
		//get extra headers
		var contentType = response.headers['content-type'];
		var contentLength = response.headers['content-length']; 
		
	 
		fileStream.on("finish",function(){
			fileStream.close();
			
			
			if (fs.existsSync(tempFileName)) {
				console.log(tempFileName + 'exists'); 
			}
			
			//res.download(tempFileName2);
		
			res.download(tempFileName2, filename, function(err){
				
				//fs.unlink(tempFileName,resultHandler);
				
			}); 
			
			
		})
	}

	var req = http.request(urldata, OnResponse).end();
	
	
});

function callback(){
	
	console.log(path); 
	
}

const download = (url, path,res) => {
	
	var resultHandler = function(err) { 
		if(err) {
			console.log("unlink failed", err);
		} else {
			console.log("file deleted");
		}
	}
	
	const options = 
	{
		uri:'http://demoincasso.casecontrol.test/api/v1/administrations/19/cases/28/file/204_d90f6bb071c69375227df0d8404c9b864ba15b5d',
		method: 'GET',
		 headers: {
			'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0MyIsImp0aSI6ImVmYzUzYzgzODc0ZGMwZDllYWVmYTM4ZDI5ZjFlZWMxZjc2NDY5NTY1OTE5ZjhmOWUyMDkxNTc5NTYxZDQyY2FkOTdkMWI2MzdkNmM3ZjhlIiwiaWF0IjoxNjI3MDI0NzE4LjgwNTc1OCwibmJmIjoxNjI3MDI0NzE4LjgwNTc2NiwiZXhwIjoxNjU4NTYwNzE4LjQ5NTgwOCwic3ViIjoiMSIsInNjb3BlcyI6W119.NT_J4_HYt0SGHkeSEd11Kpj0qITUYBWI9Z28PbOuDsc57pMUeb2PQEh1HfJK2RtFxxV_teGKXHlk-x3MtJxmppESo2VnlhUYkfO0fuPXGjHBie-dBKdypz6hWL0U3PC4bQ5Jdh58EeoLP5IioRCh4pqhX2pY0PqxgS57pHO2rUNfloaqrpBVRRwltdQKhcYPFnVEv18GJXpFd1xvsigqFbW-fOG3zNGxPdTDfGRyywePGWqd-FW5w-SBks9_xyYhUGP24unso9RWb6JRygqQr6Csc0eA8OBJAkqvJvre1oYHN5ci2OETQGVzrNBGFN7uVkaNmf-T3Fo6siDzQYRN8dvfmtCO5dhrKLL1_PmkUIUoqNGi0xLolIu5vsDQMCKoXMbW-LvbJZJoMsUSx1t5lfQk67zY6nnu0lzlMID4oZQ3tUpc-FFzMZ-jDjpmfqlx-1CbqV2MofO69_YbT-3KUNPHPnNm1w6H4O19Luu-qQExNy3dheYmgDxR7bQCy1p4AtKrV4itbM8j0GzKbQjtVzkFTWxwXnutxnIW13zxizKjfpao1P-4Euqs0AZKwHs4NGKrk2Adakcvw-3SfuJCzQbjsTqfzarg4PYWBaXYVP-5BWbezZfjGB7Vwrf37dYsCgz2TVd5MPNT5qGkp1VHczO6JGgJasKQM-pDF19aaMg'
		},
		
	} 
	
	/*const options = 
	{
		uri:'http://cc.mijnsiteontwerpen.nl/img/logo.png',
		
	}*/ 
	
  request.head(options, (err, response, body) => {
    request(options)
      .pipe(fs.createWriteStream(path))
      .on('close', function(){
			if (fs.existsSync(path)) {
				
				
			}
			
		  console.log(path); 
	  })
	  .on('finish',function(){
		  
		  if (fs.existsSync(path)) {
			res.send('bestaat'); 	
				
			}
		  else{
			  res.send('bestaat niet'); 	
		  }
		//res.download(path,'logo.pdf',function(err){
			
			//CHECK FOR ERROR
			//fs.unlink(path,resultHandler);
		//})
		
			/*var filename = filesystem.basename(path);
			var mimetype = mime.lookup(path);

			res.setHeader('Content-disposition', 'attachement; filename=' + filename);
			res.setHeader('Content-type', 'application');

			var filestream = fs.createReadStream(filename);
			filestream.pipe(res);*/ 
		  
		 
		  
	  })
	  /*.on('error',function(){
			res.send('error') 
			return; 
	  })*/ 
  })
}

const url = 'df'
const path = 'image.png'



app.get('/img', (req,res) =>{ 
	
	//create temp filename
		const crypto = require("crypto");
		const id = crypto.randomBytes(20).toString('hex');		
		const tempFileName = id+'.pdf'; 
		

	download(url, tempFileName, res, () => {
	  console.log('Done!')
	})
	
	
	
	/*res.download('f7fd40a2af4ce596bea61ed01e7f2dba8a5a932c.png', 'logo.png',function(){
		console.log('downloaded'); 
	})*/ 

})


 

const port = process.env.port || 3000;

app.listen(port, () => { 
    
})