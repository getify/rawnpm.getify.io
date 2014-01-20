exports.SERVER_NAME = "[your server name here]";

exports.PUBLIC_SERVER_ADDR = "[your domain here]";
exports.PUBLIC_SERVER_PORT = 80;

exports.INTERNAL_SERVER_ADDR = "127.0.0.1";
exports.INTERNAL_SERVER_PORT = 0000;

exports.PROD_STATIC_FILE_CACHE_LENGTH = 14400;
exports.DEV_STATIC_FILE_CACHE_LENGTH = 1;

exports.CORS_GET_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Credentials": false,
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, User-Agent, X-Requested-With"
};
exports.CORS_POST_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Credentials": false,
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, User-Agent, X-Requested-With"
};
