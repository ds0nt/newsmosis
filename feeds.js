var FeedParser = require('feedparser')
  , request = require('request');

//Holder for the data
module.exports = {

  bbc: {
    meta: null,
    items: [],
    lastRefresh: null,

    refresh: function(onfinish) {
      module.exports.bbc.lastRefresh = new Date().getTime();
      request('http://feeds.bbci.co.uk/news/rss.xml?edition=uk')
        .pipe(new FeedParser({}))
        .on('error', function(error) {
          console.error(error);
        })
        .on('meta', function (meta) {
          module.exports.bbc.meta = meta;
        })
        .on('readable', function () {
          var stream = this, item;
          while (item = stream.read()) {
            module.exports.bbc.items.push({
              title: item.title,
              description: item.description,
              date: item.date,
              link: item.link,
              image: item.image,
              summary: item.summary         
            });
            onfinish('bbc');
          }
        });
    }
  },
  sky: {
    meta: null,
    items: [],
    lastRefresh: null,

    refresh: function(onfinish) {
      module.exports.sky.lastRefresh = new Date().getTime();
      request('http://news.sky.com/feeds/rss/world.xml')
        .pipe(new FeedParser({}))
        .on('error', function(error) {
          console.error(error);
        })
        .on('meta', function (meta) {
          module.exports.sky.meta = meta;
        })
        .on('readable', function () {
          var stream = this, item;
          while (item = stream.read()) {
            module.exports.sky.items.push({
              title: item.title,
              description: item.description,
              date: item.date,
              link: item.link,
              image: item.image,
              summary: item.summary         
            });
            onfinish('sky');
          }
        });
    }

  }
}