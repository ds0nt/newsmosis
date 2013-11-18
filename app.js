// Load the http module to create an http server.
var http = require('http'), 
	fs = require('fs')
	feeds = require('./feeds');

// Configure our HTTP server to respond with Hello World to all requests.
var server = http.createServer(function (request, response) {
  newsmosis.router.route(request, response);
});

//Application Class
var newsmosis = {};


newsmosis.waitingForRefresh = [];
newsmosis.refreshingSKY = false;
newsmosis.refreshingBBC = false;

//Cache shit in here
newsmosis.cache = {
	filesCached: {},
	file: function(name) {
		if (typeof newsmosis.cache.filesCached[name] === 'undefined') {
			console.log('Opening ' + name);
			var data;
			try {
				data = fs.readFileSync(name, {encoding: "utf8"});
				newsmosis.cache.filesCached[name] = data;
				console.log('Caching ' + name);
			} catch (e) {
				data = false;
			}
		} else {
			data = newsmosis.cache.filesCached[name];
		}
		return data;		
	},

	debug_to_log: function() {
		console.log('=== Cache Debug ===');
		Object.keys(newsmosis.cache.filesCached).forEach(function(k) {
			console.log('' + k + ':' + newsmosis.cache.filesCached[k].length + ' bytes');
		})
	}
};

//Controllers
//Actions with _action will be auto-routed and the route will be cached
newsmosis.controller = {
	news: {
		bbcnews: [],
		skynews: [],
		get: function(request, response) {
			response.end(JSON.stringify({
				sky: feeds.sky.items,
				bbc: feeds.bbc.items
			}));
		},
		post: function(request, response) {
			response.end('post');		
		},
		refresh_action: function(request, response) {
			if (!newsmosis.refreshingSKY && !newsmosis.refreshingBBC) {			
				newsmosis.refreshingBBC = true;
				newsmosis.refreshingSKY = true;
				feeds.bbc.refresh(newsmosis.controller.news._refresh_done);
				feeds.sky.refresh(newsmosis.controller.news._refresh_done);
			}
			//Since this is async, we will just wait for them to complete and then respond.
			//Semi long-polling
			newsmosis.waitingForRefresh.push(response);
		},

		//Once we refresh, close all waiting requests for news.
		_refresh_done: function(which) {
			if (which === 'sky')
				newsmosis.refreshingSKY = false;
			else if (which === 'bbc')
				newsmosis.refreshingBBC = false;
			if (!newsmosis.refreshingSKY && !newsmosis.refreshingBBC) {
				for (var i = newsmosis.waitingForRefresh.length - 1; i >= 0; i--) {
					newsmosis.waitingForRefresh[i].end(JSON.stringify({success: true}));
				};
				newsmosis.waitingForRefresh = [];
			}
		}
	},
	home: {
		get: function(request, response) {
			response.end(newsmosis.cache.file('public/index.html'));
		},
		getfile: function(request, response) {
			var path = request.url.substring(6);
			if (path.indexOf('js') == 0) 
				response.writeHead(200, {"Content-Type": "text/javascript"});
			else if (path.indexOf('css') == 0) 
				response.writeHead(200, {"Content-Type": "text/css"});
			else if (path.indexOf('templates') == 0) 
				response.writeHead(200, {"Content-Type": "text/x-handlebars-template"});
			else {
				response.writeHead(404, {"Content-Type": "text/html"});			
				response.end('File not found')
				return false;
			}

			// path
			var data = newsmosis.cache.file('public/' + path);
			if (data === false) {
				response.writeHead(404, {"Content-Type": "text/html"});			
				response.end('File not found')
			} else {
				response.end(data);
			}
		}
	},
	debug: {
		cache_action: function(request, response) {
			newsmosis.cache.debug_to_log();
			response.end('Read the log :)');
		},
		clear_action: function(request, response) {
			newsmosis.cache.filesCached = {};
			response.end('Cleared :)');
		}
	}
};


//Router. Maps URLs to Controllers
newsmosis.router = {
	//Configuration
	routes: {
		'/news/get': newsmosis.controller.news.get,
		'/news/post': newsmosis.controller.news.post,
		'/': newsmosis.controller.home.get
	},
	//Routing Function
	route: function(request, response) {
		console.log(request.url);

		//Routes to our files
		if (request.url.indexOf('/file/') == 0) {
			newsmosis.controller.home.getfile(request, response);
			return;
		}
		//Custom Routes
		if (typeof newsmosis.router.routes[request.url] !== 'undefined') {
			newsmosis.router.routes[request.url](request, response);
			return;
		}

		//If we find Default Route for it let's cache it into custom routes for uber speedz
		//Careful to keep my controllers clean or they can get random stuff cached
		var peices = request.url.split('/');

		if (peices.length == 3
			&& typeof newsmosis.controller[peices[1]] !== 'undefined'
			&& typeof newsmosis.controller[peices[1]][peices[2] + '_action'] !== 'undefined') {

			console.log('Caching Route' + request.url + ' to ' + 'newsmosis.controller.' + peices[1] + '.' + peices[2] + '_action');
			newsmosis.router.routes[request.url] = newsmosis.controller[peices[1]][peices[2] + '_action'];			
			newsmosis.controller[peices[1]][peices[2] + '_action'](request, response);
			return
		}

		//Otherwise 404 time
		response.writeHead(404, {"Content-Type": "text/html"});
		response.end('<h1>Page not Found</h1><p>Sorry, the page you requested does not exist on our site</p>');
	}
};




// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(8000);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8000/");