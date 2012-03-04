var http = require('http'),
    sys = require('sys'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    events = require('events');

function loadStaticFile(uri, response) {
  var filename = path.join(process.cwd(), uri);
  path.exists(filename, function (exists) {
    if (!exists) {
      //response.writeHead(404, {'Content-Type': 'text/plain'});
      //response.write('404 Not Found\n');
      response.writeHead(200);
      response.write('<h1>can\'t find that page</h1>', 'binary');
      response.end();
      return;
    }

    fs.readFile(filename, 'binary', function (err, file) {
      if (err) {
        response.writeHead(500, {'Content-Type': 'text/plain'});
        response.write(err + '\n');
        response.end();
        return;
      }

      response.writeHead(200);
      response.write(file, 'binary');
      response.end();
    });
  });
};

var twitterClient = http.createClient(80, 'api.twitter.com');

var tweetEmitter = new events.EventEmitter();

function getTweets() {
  var request = twitterClient.request('GET', '/1/statuses/public_timeline.json', {'host': 'api.twitter.com'});

  request.addListener('response', function (response) {
    var body = '';
    response.addListener('data', function (data) {
      body += data;
    });
  });

  request.addListener('end', function () {
    var tweets = JSON.parse(body);
    if (tweets.length) {
      tweetEmitter.emit('tweeted', tweets);
    }
  });
  request.end();
};
setInterval(getTweets, 5000);

function writeTweets(res, arr) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write(JSON.stringify(arr));
  res.end();
}

http.createServer(function (request, res) {
  var uri = url.parse(request.url).pathname;
  if (uri === '/stream') {
    var listener = tweetEmitter.addListener('tweeted', function (tweets) {
      writeTweets(res, tweets);
      clearTimeout(timeout);
    });

    var timeout = setTimeout(function () {
      writeTweets(res, []);
      tweetEmitter.removeListener('tweeted');
    }, 1000);
  } else {
    loadStaticFile(uri, res);
  }
}).listen(4040, "127.0.0.1");

sys.log('Server running at http://127.0.0.1:4040/');
