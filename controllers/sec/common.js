import fetch from 'node-fetch';

module.exports.checkPerm = (ctx, permName, permKey, id) => {

  if (id && ctx.state && ctx.state.jwtdata && 
    id === ctx.state.jwtdata.id && permName === 'Users' && permKey === 'config') {
    return; // allow change of pw for self regardless of permissions
  } else if (!ctx.state.jwtdata) {
    throw new Error('invalid security token');  
  } else if (ctx.state.jwtdata.selectedRole) {
    const perm = ctx.state.jwtdata.selectedRole.perms.find( p => {
      return p.name === permName;
    });
    if (!perm) {
      throw new Error(`${permName} permission not found in role`);
    } else if (perm[permKey] === 0) {
      throw new Error('no roles config permission');
    }
  } 
/*
  else {
   // if (!(id && id === ctx.state.jwtdata.id && permName === 'Users' && permKey === 'config')) {
    throw new Error('wrong token used');      
  }
*/

}

//  headers: { 'Content-Type': 'application/json; charset=utf-8', 
// 'Content-Length': Buffer.byteLength(JSON.stringify(body))

module.exports.headers = (token) => {
  return token ? {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  } :
  {
    'Content-Type': 'application/json'
  };
};

module.exports.fetchToken = async (url, body) => {

  var resp = body ? 
    await fetch(`${url}`, { method: 'POST', 
      body: JSON.stringify(body),
      headers: module.exports.headers()
      }) 
    :
    await fetch(`${url}`, { method: 'GET', 
      headers: module.exports.headers()
      });

  return await resp.json();
};