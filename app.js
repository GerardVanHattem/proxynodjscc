//example
//https://www.twilio.com/blog/node-js-proxy-server
//security
//https://expressjs.com/en/advanced/best-practice-security.html

const express = require('express'); 
const { createProxyMiddleware } = require('http-proxy-middleware');
const session = require('express-session'); 
const MemoryStore = require('memorystore')(session); 
const axios = require('axios');
const helmet = require('helmet');
const client_id = 'client_id'; 
const client_secret = 'client_secret'; 

//middelware options
const options = {
  target: 'http://gitloc.mijnsiteontwerpen.nl/', 
  changeOrigin: true,
  onProxyRes:onProxyRes,
  onProxyReq:onProxyReq,
  secure:false,//ssl 
  /*pathRewrite: {	  
       [`^/api`]: '',
   }*/  
  //ssl: don't wat to put here
  //auth basic authentication
};

//setting the middleware
//https://www.npmjs.com/package/http-proxy-middleware
const middlewareProxy = createProxyMiddleware('/api',options);

//setting the headers
//https://github.com/chimurai/http-proxy-middleware/issues/78

const app = express()

app.use(session({
    cookie: {   maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: false,
    secret: 'sgdf',
	 logLevel: 'debug',
}))
app.disable('x-powered-by'); 
function vallidateToken(session){
	 
	if(session.token === undefined){
		
		return false;
	}

	return true; 
		
}
//every response strip sentitive header info
function onProxyRes(proxyRes, req, res) {
  proxyRes.headers['x-added'] = 'foobar'; // add new header to response
  req.session.token = 'token' // remove header from response 
  delete proxyRes.headers['token']; // remove header from response
}
//attach to every request client id and client request
//https://stackoverflow.com/questions/35420027/storing-token-from-api-w-express-http-proxy
function onProxyReq(proxyReq, req, res) {	
	req.session.path = req.path; 	
	req.session.url = req.get('host') + req.originalUrl; 	
	req.session.url = req.get('host') + proxyReq.originalUrl; 	
	req.session.hostname = 'ada'; 	

	let token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiMjRmYmNhZThhYWEyOTBiODVkYTMyNjZmZWM1MzQ1Yjg5YzYyMGMyNDU5NTRjMWY2NzdjYjQxNmE0OTk2NjlmNjI1Y2E0MTk0NjY3MWRlNDIiLCJpYXQiOjE2MTk0MTgzNTUsIm5iZiI6MTYxOTQxODM1NSwiZXhwIjoxNjUwOTU0MzU1LCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.TsHbfJvR4Z4YyZ9EUCGV8sy2YbP8fDGQWV7dgR6E_GNT-VENONd50T1xojjtGrJJou_4DSuKsiDbbJMrqo6rp4K0yOm_-__mJvo1fHPQojXWlwArzhEOPpvaGouGVq0BRz4ToOgZA246Pxg7jf8QFZY5Vw0lv8fN7kKluy6SfJBKGhmR74cI4dA7nSl6T9PFC4Mzo4u_LcyTPHmVqJF1uKbuE9Tp4t2Xgo3L9ovkAlQDziL_y2F7ca2vHNZuOXoF-67_TWqJvZcTUDx5qV1nxZfMGADXGRRYz3YsGY9x09XMIiKLmb4G_tN1azf9jFODOQyFqvdBvn2yPuL8B0I378F2shrn-r3hUXyIxn4l34zFXU7G9DFyNCnblpk_p22n4CmiVOw8CCffn1hF80gt0A9uC-XopSgswPjSA--q88r9siwL9cNn_RCptRpEAwyYifsyk_h08rSkzQMgTXVtdXLc8iFVDIPqqQLwph-ReEHRRp7kwWnOX_PXKPVnzQ8Jts61fn_jM4BJMRtIpFQP2aB8DlO1NRbMeCwXeby7TeR8ms-nq7jvcHi-GlRf7PMURMgaJ1s45CvXNYxKx4GGIO9vUIU1NKNb3UesbsxYltrXUC2RtqqijQIvSKf4deu3kkzL2RF7eB_gvJlQy90IGcBAyGY8NiYO_u7p6EcAvQA'; 
    /*if (token) {
		req.session.hostname = token; 	
      proxyReq.setHeader('Authorization', `bearer ${token}`)
    }*/ 
	
	if (token) {
            proxyReq.setHeader('Authorization', `Bearer ${token}`)
        } 

      
	
	//proxyReq.setHeader('Authorization', `Bearer ${req.session.token.acces_token}`);
	//req.headers['Proxy-Authorization'] = `Basic ${new Buffer('token').toString('base64')}`;
	//proxyReq.setHeader('Proxy-Authorization', 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiYTNmMmY0OTk4NjY3NzdmYzFiMTVhMzVjYTc0NDUxYjhjZjFiNTdhNmY3NTBiNjllNzEwM2ViNGI0YzkxMTRhMjE1Y2Q4ZTE4NTRkMjU0YzUiLCJpYXQiOjE2MTkzODQyODMsIm5iZiI6MTYxOTM4NDI4MywiZXhwIjoxNjUwOTIwMjgzLCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.QnAz-ulvGK3VaIZIOGCNItkFeyO79JbZqk0pFJbqW9MjCjn7lCL6D3iexaXT8k1b2YvEav_JCjW6XAg0TW6u3deAjy49hk3PFhxcBL-idiSBK4o-r0fM0W07y56OmvzNJ78-QHHJggxd8ZqP9lpMp7rcKyeJsJlWpx3ZqgoPXxZGRvn3NPYhSEmLxuYO7af8qBbhNJuqXqyLhy7LDXlhWsQwR_8MmjeRDgdzV5tSsHiU812nk_vLMkIOYFzFU5QZ5t2vGdoagxZb4i_bvpkbsVqX9_5HS76J2GUe04qckPKntiLUvdIG7kZJHUH3OR2lfhXLk4IjkiWeWLxZlY0f_Ct9fKx2QfYiz5l4u4zGVEDGrIEK8HB75QAdO12d5NUoSD_g_rLkONdl2JNpZoX3DlVG8vhpU8d3XYW6XU0TnHbZ4ALiM9lA32CGi3jUMaSRjxCIYXNVuBxOH2SGMcsdN92zm_N2bXdkMT1T28VaK5YJZzMiMp9_D3-ALwi6gs3uwhjh7SZDaVlnMQBzaqr_hY1havtqSqMNlbm7jxdsNyrNX07xsyYse2Rba2BHXqKVf7drHvLN8cyuMLYa3rwnknNlQTBte3EsV_IKOn8-69o0rOGh5UB5qdTxAHcU088cml');
	//proxyReq.setHeader('Content-Type', 'application/x-www-form-urlencoded');
	// proxyReq.setHeader('Authorization', `bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiYTNmMmY0OTk4NjY3NzdmYzFiMTVhMzVjYTc0NDUxYjhjZjFiNTdhNmY3NTBiNjllNzEwM2ViNGI0YzkxMTRhMjE1Y2Q4ZTE4NTRkMjU0YzUiLCJpYXQiOjE2MTkzODQyODMsIm5iZiI6MTYxOTM4NDI4MywiZXhwIjoxNjUwOTIwMjgzLCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.QnAz-ulvGK3VaIZIOGCNItkFeyO79JbZqk0pFJbqW9MjCjn7lCL6D3iexaXT8k1b2YvEav_JCjW6XAg0TW6u3deAjy49hk3PFhxcBL-idiSBK4o-r0fM0W07y56OmvzNJ78-QHHJggxd8ZqP9lpMp7rcKyeJsJlWpx3ZqgoPXxZGRvn3NPYhSEmLxuYO7af8qBbhNJuqXqyLhy7LDXlhWsQwR_8MmjeRDgdzV5tSsHiU812nk_vLMkIOYFzFU5QZ5t2vGdoagxZb4i_bvpkbsVqX9_5HS76J2GUe04qckPKntiLUvdIG7kZJHUH3OR2lfhXLk4IjkiWeWLxZlY0f_Ct9fKx2QfYiz5l4u4zGVEDGrIEK8HB75QAdO12d5NUoSD_g_rLkONdl2JNpZoX3DlVG8vhpU8d3XYW6XU0TnHbZ4ALiM9lA32CGi3jUMaSRjxCIYXNVuBxOH2SGMcsdN92zm_N2bXdkMT1T28VaK5YJZzMiMp9_D3-ALwi6gs3uwhjh7SZDaVlnMQBzaqr_hY1havtqSqMNlbm7jxdsNyrNX07xsyYse2Rba2BHXqKVf7drHvLN8cyuMLYa3rwnknNlQTBte3EsV_IKOn8-69o0rOGh5UB5qdTxAHcU088cml`)
	//proxyReq.setHeader('Authorization', 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiYTNmMmY0OTk4NjY3NzdmYzFiMTVhMzVjYTc0NDUxYjhjZjFiNTdhNmY3NTBiNjllNzEwM2ViNGI0YzkxMTRhMjE1Y2Q4ZTE4NTRkMjU0YzUiLCJpYXQiOjE2MTkzODQyODMsIm5iZiI6MTYxOTM4NDI4MywiZXhwIjoxNjUwOTIwMjgzLCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.QnAz-ulvGK3VaIZIOGCNItkFeyO79JbZqk0pFJbqW9MjCjn7lCL6D3iexaXT8k1b2YvEav_JCjW6XAg0TW6u3deAjy49hk3PFhxcBL-idiSBK4o-r0fM0W07y56OmvzNJ78-QHHJggxd8ZqP9lpMp7rcKyeJsJlWpx3ZqgoPXxZGRvn3NPYhSEmLxuYO7af8qBbhNJuqXqyLhy7LDXlhWsQwR_8MmjeRDgdzV5tSsHiU812nk_vLMkIOYFzFU5QZ5t2vGdoagxZb4i_bvpkbsVqX9_5HS76J2GUe04qckPKntiLUvdIG7kZJHUH3OR2lfhXLk4IjkiWeWLxZlY0f_Ct9fKx2QfYiz5l4u4zGVEDGrIEK8HB75QAdO12d5NUoSD_g_rLkONdl2JNpZoX3DlVG8vhpU8d3XYW6XU0TnHbZ4ALiM9lA32CGi3jUMaSRjxCIYXNVuBxOH2SGMcsdN92zm_N2bXdkMT1T28VaK5YJZzMiMp9_D3-ALwi6gs3uwhjh7SZDaVlnMQBzaqr_hY1havtqSqMNlbm7jxdsNyrNX07xsyYse2Rba2BHXqKVf7drHvLN8cyuMLYa3rwnknNlQTBte3EsV_IKOn8-69o0rOGh5UB5qdTxAHcU088cml');
	//proxyReq.setHeader('client_secret', client_secret);
	//proxReq.setHeader('token', 'token');
	
	
}

//logout
	//kill session

//all other request
	//check check session token
		//exist continue
		// not exist redirect inlog page
	//check valid token
		// valid continue
		// not valid redirect to inlog page
		

/**login**/ 

//request a token 
	//add client_id and client_secret 
	//
//store token and refresh token on succes
//not success give json object with reason


//https://github.com/chimurai/http-proxy-middleware/issues/318


//no token response 403
/*app.all("*", (req,res, next) => {
	
	if(!vallidateToken(req.session) && req.path !== "/login" ){
		
		res.status(403).send('Not authorized'); 
		//res.redirect('/login');
	}
	else{
		next(); 
	}	
})*/ 



app.use(helmet())
app.use(middlewareProxy); 
//app.use('/api', createProxyMiddleware({ target: 'http://gitloc.mijnsiteontwerpen.nl', changeOrigin: true }));

const port = process.env.port || 3000;
//https://auth0.com/blog/create-a-simple-and-stylish-node-express-app/




app.get('/api', function(req, res){
			
			req.session.client_secret = 'client_secret'; 
			
	}
)

app.get('/session', function(req, res, next) {
  if (req.session.views) {
    req.session.views++
    res.setHeader('Content-Type', 'text/html')
    res.write('<p>views: ' + req.session.views + '</p>')
    res.write('<p>expires in: ' + (req.session.cookie.maxAge / 1000) + 's</p>')
    res.end()
  } else {
    req.session.views = 1
    res.end('welcome to the session demo. refresh!')
  }
})




app.get('/', (req, res) => {
	res.setHeader('Content-Type', 'text/html')
    res.write('<p>This overview show</p>')
    res.write('<p>client secret: ' + req.session.client_secret + '</p>')
    res.write('<p>client token: ' +  req.session.token + '</p>')
    res.write('<p>expires in: ' + (req.session.cookie.maxAge / 1000) + 's</p>')
    res.end()
})



app.get('/hello',(req,res)=>{
	
	res.send(req.session.hostname); 	
	
})
//https://stackoverflow.com/questions/41719535/getting-access-token-with-axios
//https://stackoverflow.com/questions/29360349/getting-error-unsupported-grant-type-when-trying-to-get-a-jwt-by-calling-an
//https://github.com/FusionAuth/fusionauth-issues/issues/158

app.get('/login', (req,res)=>{
	 
	var reqData = "grant_type=password&client_id=2&client_secret=2TR5CiK5rBDtntYFsEn0TPzpBCoShoncRL5EkKDo&username=gerard@cms4biz.nl&password=zondag12";
	axios.request({
    method: 'post',
    url: 'http://gitloc.mijnsiteontwerpen.nl/oauth/token',
    data: (reqData),   
    headers: { 
      "Content-Type": "application/x-www-form-urlencoded",
    }
	}).then((response) =>{
		//res.send(response); 
		req.session.token = response.data; 
		res.send(req.session.token.access_token); 
		//res.send(response.data); 
        //res.send(response); 
    }).catch((error) =>{
           // res.send(error.response.status);
            res.send(error.response.headers);
            //res.send(error.response.status);
           // res.send(error.response.data); 
    })

	
}) 

app.get('/auth/login', (req,res)=>{ 
	 
	var reqData = "";
	axios.request({
    method: 'post',
    url: 'http://git.mijnsiteontwerpen.nl/api/proxy/token',
    data: (reqData),   
    headers: { 
      "Content-Type": "application/x-www-form-urlencoded",
    }
	}).then((response) =>{
		//res.send(response); 
		req.session.token = response.data; 
		res.send(req.session.token); 
		res.send(req.session.token.access_token); 
		//res.send(response.data); 
        //res.send(response); 
    }).catch((error) =>{
           // res.send(error.response.status);
            res.send(error.response.headers);
            //res.send(error.response.status);
           // res.send(error.response.data);
    })

	
}) 

app.get('/logout',(req,res)=>{
	
	//revoke api access_token
	
	req.session.destroy();
	res.end()
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})