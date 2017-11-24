'use strict';
var views = require('co-views');
var parse = require('co-body');
var monk = require('monk');
var wrap = require('co-monk');
var db = monk('localhost/library');
// var co = require('co');
// import epg from './epg';

// var books = wrap(db.get('books'));

// From lifeofjs

/*
co(async function () {
//  var books = yield books.find({});
  await epg.load();
});
*/

var render = views(__dirname + '/../views', {
  map: {
    html: 'swig'
  }
});

module.exports.all = async (ctx) => {
  var data = await global.epgData;
  ctx.body = data.tv.channel;
};

module.exports.fetch = async (ctx) => {

  try {

    var data = await global.epgData;

    const id = ctx.params.id;

    var result = data.tv.channel.filter((chan) => {
      return chan.$.id === id;
    });

    ctx.body = result;
  } catch (err) {
    ctx.body = err;    
  }
};

const fetchFilterEx = async (ctx, name, count = false) => {

  try {

    var data = await global.epgData;

//    console.log('option', option.toLowerCase());
  
    var result = data.tv.channel.filter((chan) => {
      return chan['display-name'][0].toLowerCase().indexOf(name.toLowerCase()) > -1;
    });

    if (count) {
      ctx.body = { count: result.length };
    } else {
//    console.log('result', result);
      ctx.body = result;
    }

  } catch (err) {
    ctx.body = err;    
  }
};

module.exports.fetchFilter = async (ctx) => {

  const name = ctx.params.name;

  return await fetchFilterEx(ctx, name);
};

module.exports.fetchFilterCount = async (ctx) => {
  const name = ctx.params.name;
  return await fetchFilterEx(ctx, name, true);
};

module.exports.count = async (ctx) => {
  var data = await global.epgData;
  var chans = data.tv.channel;
  ctx.body = { count: chans.length };
};
