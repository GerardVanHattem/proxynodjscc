require('dotenv').config(); 

const config = {};

config.proxy = {
	white_list : process.env.white_list || '*',
};

config.api = {
	client_id : process.env.client_id || '',
	client_secret : process.env.client_secret || '', 
	host : process.env.api_host || '', 
	base_path : process.env.api_base_path || '', 
	ssl : process.env.api_ssl || 'http',
}; 
 
config.encryption={
	encryption_key : process.env.ENCRYPTION_KEY || 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3',
}


module.exports = config; 