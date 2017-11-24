
import Router from 'koa-router';
import epg from '../controllers/epg/epg';
import epgChans from '../controllers/epg/chans';
import epgProgs from '../controllers/epg/progs';

const base = '/epg';

const epgRoutes = new Router({
  prefix: `${base}`
});

epgRoutes.get('/', epg.fileInfo);

const chansRoutes = new Router({
  prefix: `${base}/chans`
});

chansRoutes.get('/', epgChans.all);
chansRoutes.get('/count', epgChans.count);
chansRoutes.get('/:id', epgChans.fetch);
chansRoutes.get('/filter/:name', epgChans.fetchFilter);
chansRoutes.get('/filter/:name/count', epgChans.fetchFilterCount);

const progsRoutes = new Router({
  prefix: `${base}/progs`
});

progsRoutes.get('/count', epgProgs.count);
progsRoutes.get('/:chan', epgProgs.fetch);
progsRoutes.get('/:chan/count', epgProgs.fetchCount);

module.exports.epgRoutes = epgRoutes;
module.exports.chansRoutes = chansRoutes;
module.exports.progsRoutes = progsRoutes;
