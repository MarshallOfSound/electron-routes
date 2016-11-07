const { app, protocol } = require('electron'); // eslint-disable-line
const MiniRouter = require('./MiniRouter');

const schemes = [];
global.__router_schemes__ = schemes;

class Router extends MiniRouter {
  constructor(schemeName = 'app') {
    if (app.isReady()) {
      throw new Error('Router must be initialized before the app is ready');
    }
    if (schemes.includes(schemeName)) {
      throw new Error(`Reusing router schemes is not allowed, there is already a scheme registed called ${schemeName}`);
    }
    super();
    this.schemeName = schemeName;
    schemes.push(schemeName);
    protocol.registerStandardSchemes([schemeName]);
    app.on('ready', () => {
      protocol.registerStringProtocol(schemeName, this._handle.bind(this));
    });
  }

  _nicePost(uploadData) { // eslint-disable-line
    return uploadData.map((data) => {
      if (data.bytes && data.bytes.toString) {
        data.stringContent = () => data.bytes.toString();
        data.json = () => JSON.parse(data.stringContent());
      }
      return data;
    });
  }

  _handle(request, callback) {
    const { url, referrer, method, uploadData } = request;
    const path = url.substr(this.schemeName.length + 3);
    const handlers = [];
    this.processRequest(path, method, handlers);
    if (handlers.length === 0) {
      callback({
        error: -6,
      });
    } else {
      let calledBack = false;
      // Move out of scope so it can be mutated
      const req = {
        params: {},
        method,
        referrer,
        uploadData: this._nicePost(uploadData || []),
      };
      const attemptHandler = (index) => {
        const tHandler = handlers[index];
        req.params = tHandler.params;
        const called = fn => (...args) => {
          if (calledBack) throw new Error('Already callled back');
          calledBack = true;
          fn(...args);
        };
        const res = {
          json: called(o => callback(JSON.stringify(o))),
          send: called(s => callback(s)),
          notFound: called(() => callback({ error: -6 })),
        };
        const next = () => {
          if (calledBack) throw new Error('Can\'t call next once data has already been sent as a response');
          if (index + 1 < handlers.length) {
            attemptHandler(index + 1);
          } else {
            res.notFound();
          }
        };
        tHandler.fn(req, res, next);
      };
      attemptHandler(0);
    }
    // console.log(this._methods);
    // console.log(request);
    // callback('');
  }
}

module.exports = Router;
