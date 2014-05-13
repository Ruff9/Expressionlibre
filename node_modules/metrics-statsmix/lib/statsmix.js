'use strict';

/*jslint node: true, indent: 2 */

var request = require('request'),
  metrics = require('metrics'),
  u = require('underscore'),
  statsmixEndpoint = 'http://api.statsmix.com/api/v2/',
  Client;

request = request.defaults({
  jar: false,
  timeout: 5000,
  headers: {
    'User-Agent' : 'Metrics-Statsmix (https://github.com/voxpelli/node-metrics-statsmix)'
  }
});

Client = function (options) {
  this.options = options || {};
  this.trackedMetrics = [];

  u.defaults(this.options, {
    key : process.env.STATSMIX_URL ? process.env.STATSMIX_URL.replace('https://www.statsmix.com/api_key/', '') : false,
    period : 60 / (24500 / 31 / 24 / 60) // Ping every X seconds - default works well with free Heroku Add-on
  });

  if (this.options.key) {
    this.timer = setTimeout(this.report, this.options.period * 1000, this);
  }
};

Client.prototype.addMetric = function (eventName, metric, options) {
  options = options || {};

  u.defaults(options, {
    track : false
  });

  this.trackedMetrics.push({name : eventName, object : metric, options : options});
};

Client.prototype.report = function (that) {
  if (!that.trackedMetrics) {
    if (!that.stopped) {
      that.timer = setTimeout(that.report, that.options.period * 1000, that);
    }
  } else {
    console.log('Sending', that.trackedMetrics.length, 'reports to StatsMix.');

    that.trackedMetrics.forEach(function (metric) {
      var data = {
        value : that.resolveMetric(metric.object, metric.options)
      };

      if (data.value === false) {
        return;
      }

      if (metric.options.track) {
        data.name = metric.name;
      } else {
        data.metric_id = metric.name;
      }

      request({
        method : 'POST',
        uri : statsmixEndpoint + (metric.options.track ? 'track' : 'stats'),
        headers : {
          'X-StatsMix-Token' : that.options.key
        },
        form : data
      }, function (error, response, body) {
        if (error) {
          console.log('Error on StatsMix report');
        } else if (response.statusCode !== 200) {
          console.log('Got status code', response.statusCode, 'in response from StatsMix, and body:', body);
        }
      });
    });
    if (!that.stopped) {
      that.timer = setTimeout(that.report, that.options.period * 1000 * that.trackedMetrics.length, that);
    }
  }
};

Client.prototype.resolveMetric = function (metric, options) {
  var result = false;

  if (metric instanceof metrics.Meter) {
    //TODO: Use options to specify which rate value to pick?
    result = metric.fiveMinuteRate();
  } else if (metric instanceof metrics.Counter) {
    result = metric.count;
    if (options.track) {
      metric.clear();
    }
  }

  return result;
};

Client.prototype.close = function () {
  this.stopped = true;
  clearTimeout(this.timer);
}

exports.Client = Client;
