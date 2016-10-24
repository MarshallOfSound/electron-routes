const pathToRegexp = require('path-to-regexp');

class MiniRouter {
  constructor() {
    this._methods = {
      get: [],
      post: [],
      put: [],
      delete: [],
      use: [],
    };

    Object.keys(this._methods).forEach((method) => {
      if (method === 'use') return;
      this[method] = (pathMatch, callback) => {
        pathMatch = pathMatch.replace(/^\//g, '');
        const keys = [];
        this._methods[method].push({
          pathComponent: pathMatch,
          pathRegexp: pathToRegexp(pathMatch, keys),
          pathKeys: keys,
          callback,
        });
      };
    });
  }

  all(pathMatch, callback) {
    this.get(pathMatch, callback);
    this.post(pathMatch, callback);
    this.put(pathMatch, callback);
    this.delete(pathMatch, callback);
  }

  use(pathMatch, mRouter) {
    if (mRouter.constructor !== MiniRouter) {
      throw new Error('Can\'t use non-router');
    }
    pathMatch = pathMatch.replace(/^\//g, '');
    const keys = [];
    this._methods.use.push({
      pathComponent: pathMatch,
      pathRegexp: pathToRegexp(pathMatch, keys, { end: false }),
      pathKeys: keys,
      router: mRouter,
    });
  }

  processRequest(path, method, handlers) {
    path = path.replace(/^\//g, '');
    this._methods[method.toLowerCase()].forEach((tHandler) => {
      const tPathMatches = tHandler.pathRegexp.exec(path);
      if (tPathMatches) {
        const params = {};
        tHandler.pathKeys.forEach((pathKey, index) => {
          params[pathKey.name] = tPathMatches[index + 1];
        });
        handlers.push({
          params,
          fn: tHandler.callback,
        });
      }
    });
    this._methods.use.forEach((tHandler) => {
      const tUseMatches = tHandler.pathRegexp.exec(path);
      if (tUseMatches) {
        const useHandlers = [];
        const params = {};
        tHandler.pathKeys.forEach((pathKey, index) => {
          params[pathKey.name] = tUseMatches[index + 1];
        });
        tHandler.router.processRequest(path.replace(tUseMatches[0], ''), method, useHandlers);
        useHandlers.forEach((tUseHandler) => {
          tUseHandler.params = Object.assign({}, params, tUseHandler.params);
          handlers.push(tUseHandler);
        });
      }
    });
  }
}

module.exports = MiniRouter;
