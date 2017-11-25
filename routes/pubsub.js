import Router from 'koa-router';
import pubSub from '../controllers/pubSub/pubSubSrvr';

const base = '/pubsub';

const pub = new Router({
  prefix: `${base}/pub`
});

const sub = new Router({
  prefix: `${base}/sub`
});
 
pub.post('/', pubSubSrvr.publish);

//sub.post('/', pubSubSrvr.subscribe);
sub.get('/:topic', pubSubSrvr.subscribe);
