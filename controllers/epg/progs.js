'use strict';
import moment from 'moment';

const TIME_FORMAT = 'YYYYMMDDhhmmss +0000';

const fetchEx = async (ctx, chan, count = false) => {

  var data = await global.epgData;

  const time = moment.utc();

  var result = data.tv.programme.filter((prog) => {
    return prog.$.channel === chan;
  })
  .filter((prog) => {
    return time.isBefore(moment.utc(prog.$.stop, TIME_FORMAT));
  });

  if (count) {
    ctx.body = { count: result.length };
    return;
  }

  ctx.body = result;
};

module.exports.fetch = async (ctx) => {
  const chan = ctx.params.chan;
  return fetchEx(ctx, chan);
};

module.exports.fetchCount = async (ctx) => {
  const chan = ctx.params.chan;
  return fetchEx(ctx, chan, true);
};

module.exports.count = async (ctx) => {

  var data = await global.epgData;

  var progs = data.tv.programme;

  ctx.body = { count: progs.length };
};

