const { remote, webFrame } = require('electron');

const MiniRouter = require('./MiniRouter');
const Router = require('./Router');

module.exports = {
  Router,
  MiniRouter,
  rendererPreload: () => {
    if (!remote || !webFrame) {
      throw new Error('The renderer preload for electron-router can only be called from a renderer process');
    }
    remote.getGlobal('__router_schemes__').forEach(schemeName => webFrame.registerURLSchemeAsPrivileged(schemeName));
  },
};
