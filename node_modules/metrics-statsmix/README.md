# Metrics StatsMix Reporter

A [Metrics.js](https://github.com/mikejihbe/metrics) reporter for the [StatsMix](http://www.statsmix.com) service that's eg. available as a [Heroku addon](https://addons.heroku.com/statsmix).

## Example

Basic usage with the free addon on Heroku is:

```javascript
var statsmixClient = new statsmix.Client();
statsmixClient.addMetric('Foo metric', fooCounterMetric, { track : true });
```

## Known issues

* Default period of reporting stats to StatsMix is based on a single working doing 25 000 requests in a month - multiple workers will have to be adjusted so that the total amount doesn't go above that - something that could be done in multiple ways.
