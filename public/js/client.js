Handlebars.registerHelper('dateify', function(n) {
	var postDate = new Date(n);
	return (postDate.getMonth() + 1) + "/" + postDate.getDate() + "/" + postDate.getFullYear();
});

var newsitem = function(publisher, data) {
	this.template = newsmosis.getTemplate('/file/templates/news-item.html');
	this.data = data;
	this.publisher = publisher;
}
newsitem.prototype.render = function() {
	return this.template({
		publisher: this.publisher,
		article: this.data
	});
};



var newsmosis = {
	news: {},
	//Observers
	newsWatchers: [],
	//Register Observer
	watchNews: function(fn) {
		newsmosis.newsWatchers.push(fn);
	},
	setNews: function(news) {
		newsmosis.news = news;
		//Alert Observers
		for (var i = newsmosis.newsWatchers.length - 1; i >= 0; i--) {
			newsmosis.newsWatchers[i](newsmosis.news);
		};
	},
	alert: function(text) {
		alert(text);
	},
	init: function() {
		newsmosis.load('home');
	},
	load: function(page) {
		if (typeof newsmosis.page !== 'undefined')
			if (typeof newsmosis.page.unload !== 'undefined')
				newsmosis.page.unload();
		newsmosis.page = newsmosis.pages[page];
		newsmosis.page.load();
	},

	templates : {},
	getTemplate: function(path) {
		if (!newsmosis.templates[path])
			newsmosis.templates[path] = newsmosis.loadTemplate(path);
		return newsmosis.templates[path];
	},
	loadTemplate: function(path) {
		var template = '';
		
		$.ajax({
			async: false,
			type:'get',
			url: path,
			dataType:'text',
			data:null,
			success: function(data){
				data = data;
				template = Handlebars.compile(data);
			},
			error: function(a, b, c){
				console.log('Error at loadTemplate');
			}
		});	

		return template;
	}
};
newsmosis.ui = {
	header: {
		init: function() {
			document.getElementById('header').innerHTML = newsmosis.getTemplate('/file/templates/header.html')();
			var refreshelem = document.getElementById('refresh-news');
			refreshelem.addEventListener("click", function() {
				refreshelem.class = "btn-loading";
				$.get('/news/refresh', {}, function(data) {
					if (data.success) {
						$.get('/news/get', {}, function(data) {
							newsmosis.setNews(data);
						}, "json");
					} else {
						newsmosis.alert('AAAAHH!! Refreshing news didn\'t work!');
					}
				}, "json");				
			})			
		}
	}
}
newsmosis.pages = {
	home: {
		load: function() {
			newsmosis.watchNews(newsmosis.pages.home.onNewsChange);

			document.getElementById('content').innerHTML = newsmosis.getTemplate('/file/templates/home-page.html')();
			$.get('/news/get', {}, function(data) {
				newsmosis.setNews(data);
			}, "json");
		},
		onNewsChange: function(data) {
			var html = document.getElementById('bbc-news').innerHTML;
			for (var i = data.bbc.length - 1; i >= 0; i--) {
				html += (new newsitem('bbc', data.bbc[i])).render();
			};
			document.getElementById('bbc-news').innerHTML = html;

			html = document.getElementById('sky-news').innerHTML;
			for (var i = data.sky.length - 1; i >= 0; i--) {
				html += (new newsitem('sky', data.sky[i])).render();
			};
			document.getElementById('sky-news').innerHTML = html;		
		}
	}
}

$(function() {
	newsmosis.ui.header.init();
	newsmosis.init();
});