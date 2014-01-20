function handler(req,res) {
	// ensure proper 'Server' header for all responses
	res.setHeader("Server",secret.SERVER_NAME);

	// perform hostname/protocol redirects?
	if (req.headers["x-forwarded-proto"] !== "https") {
		res.writeHead(301, { Location: RAWNPM_SITE });
		res.end();
	}
	// not a recognized route?
	else if (req.headers["host"] !== "rawnpm.getify.io" ||
		router(req,res) === false
	) {
		setSecurityHeaders(res);
		res.writeHead(403);
		res.end();
	}
}

function router(req,res) {
	if (req.method === "GET") {
		setSecurityHeaders(res);

		// static file request?
		if (req.url === "/") {
			res.writeHead(200,{ "Content-type": "text/plain; charset=UTF-8" });
			res.end("Nothing to see here.");
		}
		else if (/^\/(?:robots\.txt\b|humans\.txt\b|favicon\.ico\b)/.test(req.url)) {
			req.addListener("end",function(){
				req.url = "/web" + req.url;
				static_files.serve(req,res);
			});
			req.resume();
		}
		else {
			doGetFile(req,res);
		}
	}
	// not a recognized route
	else {
		return false;
	}
}

function setSecurityHeaders(res) {
	// From: https://developer.mozilla.org/en-US/docs/Security/CSP/Introducing_Content_Security_Policy
	res.setHeader("Content-Security-Policy","default-src 'self'; script-src 'self' 'unsafe-eval' rawnpm.getify.io; style-src 'self' 'unsafe-inline' rawnpm.getify.io");

	// From: https://developer.mozilla.org/en-US/docs/Security/HTTP_Strict_Transport_Security
	res.setHeader("Strict-Transport-Security","max-age=" + 1E9 + "; includeSubdomains");
}

function doGetFile(req,res) {
	var url_parts = url_parser.parse(req.url),
		path_parts =
			url_parts.pathname
			.split(/\//)
			.filter(function(part){
				return !!part;
			}),
		package_name = path_parts[0],
		package_version = path_parts[1],
		package_path = path_parts.slice(2).join("/")
	;

	checkPackageOwnerAndVersion(package_name)
	.val(function(version){
		if (package_version === "latest") {
			package_version = version;
		}
		return ASQ.messages(package_name,package_version);
	})
	.seq(cachePackage)
	.then(function(done){
		if (package_path) {
			checkPackagePathExists(
				packageRealPath(package_name,package_version),
				package_path
			)
			.seq(checkIsPackageFile)
			.val(function(){
				return path.join(package_name,package_version,"package",package_path);
			})
			.pipe(done);
		}
		else {
			done(path.join(package_name,package_version,"package.tgz"));
		}
	})
	.val(function(relativePath){
		req.url = relativePath;
		npm_cache_files.serve(req,res);
	})
	.or(function(err){
		res.writeHead(404);
		res.end(""+err);
	});
}


// *******************
// npm

function packageRealPath(name,version) {
	return path.join(__dirname,"npm_cache",name,version);
}

function cachePackage(name,version) {
	return ASQ(function(done){
		npm.commands.cache(
			[ "add", name + "@" + version ],
			done.errfcb
		);
	});
}

function checkPackagePathExists(basePath,packagePath) {
	var file_path;

	if (packagePath) {
		file_path = path.join(basePath,"package",packagePath);
	}
	else {
		file_path = path.join(basePath,"package.tgz");
	}

	return ASQ(function(done){
		fs.exists(file_path,done);
	})
	.val(function(exists){
		if (!exists) throw "Not found";
		return file_path;
	});
}

function checkIsPackageFile(filePath) {
	return ASQ(function(done){
		fs.stat(filePath,done.errfcb);
	})
	.val(function(stat){
		if (!stat.isFile()) throw "Not found";
	});
}

function checkPackageOwnerAndVersion(name) {
	return ASQ(function(done){
		// read the JSON in from the URL
		request(
			"https://registry.npmjs.org/" + encodeURIComponent(name) + "/latest",
			done.errfcb
		);
	})
	.val(function(resp,json){
		try {
			json = JSON.parse(json);
			if (!/github.com\/getify\//i.test(json.repository.url)) {
				throw "Not allowed";
			}
			return json.version;
		}
		catch (err) {
			if (typeof err === "string") throw err;
			else throw "Not found";
		}
	});
}


// *******************
// Logging

function logMessage(msg,returnVal) {
	var d = new Date();
	msg = "[" + d.toLocaleString() + "] " + msg;
	if (!!returnVal) {
		return msg;
	}
	else {
		console.log(msg);
	}
}

function NOTICE(location,msg,returnVal) {
	return logMessage("NOTICE(" + location + "): " + msg,!!returnVal);
}

function ERROR(location,msg,returnVal) {
	return logMessage("ERROR(" + location + "): " + msg,!!returnVal);
}


var PROD = (process.env.NODE_ENV === "production"),

	http = require("http"),
	httpserv = http.createServer(handler),
	node_static = require("node-static"),
	ASQ = require("asynquence"),
	path = require("path"),
	fs = require("fs"),
	request = require("request"),
	url_parser = require("url"),
	npm = require("npm"),
	npmconf = require("npmconf"),

	configDefs = npmconf.defs,
	shorthands = configDefs.shorthands,
	types = configDefs.types,
	nopt = require("nopt"),
	conf = nopt(types, shorthands),

	// pull in "secret" config settings
	secret = require(path.join(__dirname,"secret.js")),

	static_file_opts = {
		serverInfo: secret.SERVER_NAME,
		cache: PROD ?
			secret.PROD_STATIC_FILE_CACHE_LENGTH :
			secret.DEV_STATIC_FILE_CACHE_LENGTH,
		gzip: PROD
	},
	static_files = new node_static.Server(__dirname, static_file_opts),
	npm_cache_files = new node_static.Server(path.join(__dirname,"npm_cache"), static_file_opts),

	// config constants
	INTERNAL_SERVER_ADDR = secret.INTERNAL_SERVER_ADDR,
	INTERNAL_SERVER_PORT = secret.INTERNAL_SERVER_PORT,
	PUBLIC_SERVER_ADDR = secret.PUBLIC_SERVER_ADDR,
	PUBLIC_SERVER_PORT = secret.PUBLIC_SERVER_PORT,

	CORS_GET_HEADERS = secret.CORS_GET_HEADERS,
	CORS_POST_HEADERS = secret.CORS_POST_HEADERS,

	RAWNPM_SITE = "https://rawnpm.getify.io",

	ø = Object.create(null)
;

// extend asynquence with contrib plugins
require("asynquence-contrib");


// load up the npm conf/module
npm.load(conf,function(err,config){
	if (err) return ERROR("core",err);
	NOTICE("core","npm ready");

	// set some npm configs
	config.set("loglevel","silent");
	config.set("cache",path.join(__dirname,"npm_cache"));

	// spin up the HTTP server
	httpserv.listen(INTERNAL_SERVER_PORT, INTERNAL_SERVER_ADDR);
});
