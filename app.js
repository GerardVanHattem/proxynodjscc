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
	
	//check if a bearer token is set.
	if(!encryptedAuthorizationHeader){
		res.status(401)
		res.json({'error':'No bearer token'}) 
		res.end(); 
		return; 
	}
	
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

function onError(err, req, res) {
        res.writeHead(500, {
            'Content-Type': 'text/plain'
        });
        res.end('Something went wrong. And we are reporting a custom error message.' + err);
}
	


const middlewareOptions = {
	
	target: config.api.ssl +'://'+config.api.host + config.api.base_path + '/', 
	changeOrigin: true, 
	onProxyReq:onProxyReq,
	onProxyRes:onProxyRes,
	onError:onError, 
    logLevel: 'debug', 
	pathRewrite: {	  
       [`^/api/v1`]: '',
   }
}

//cors
let cors = require('cors')
const corsOptions = {
  origin: config.api.cors_domain
}
app.use(cors(corsOptions))

app.use('/api/v1', createProxyMiddleware(middlewareOptions));


app.post('/oauth/token', (req,res) => {
		
	const username = req.body.email	
	const password = req.body.password;
		
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
		
		res.json(data); 

    })
    .catch(error => {
		
		//set status
		res.status(error.response.status)
		//send already a json
		res.send(error.response.data)  
    })

})

app.get('/me', (req,res) => {
	
		
		const encryptedAuthorizationHeader = req.headers.authorization; 	
		
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
	
	res.send('working..'); 
	
})

//download file from api
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
	
		//check file is returned
		if(!response.headers['content-disposition']){
				res.status(404)
				res.json({'error':'No valid file found'}) 	
		}
		
		var filename = response.headers['content-disposition'].split("filename=")[1];
		
		///os.tmpdir()
		var path = require('path')
		var extension = path.extname(filename); 
		
		//create temp filename
		var crypto = require("crypto");
		var id = crypto.randomBytes(20).toString('hex');		
		var tempFileName = os.tmpdir() + '/'  +id+extension; 
		
		
		//write received file on server
		const fileStream = fs.createWriteStream(tempFileName);  
		response.pipe(fileStream);
		
	
		//get extra headers
		var contentType = response.headers['content-type'];
		var contentLength = response.headers['content-length']; 
		
	 
		fileStream.on("finish",function(){
			fileStream.close();
			
			
			if (fs.existsSync(tempFileName)) {
				console.log(tempFileName + 'exists'); 
			}
				
			res.download(tempFileName, filename, function(err){
				
				fs.unlink(tempFileName,resultHandler);
				
			}); 
			
			
		})
	}

	var req = http.request(urldata, OnResponse).end();
	
	
});


const port = process.env.port || 3000;

app.listen(port, () => { 
    
})