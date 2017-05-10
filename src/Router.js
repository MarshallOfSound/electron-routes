const { app, protocol, session } = require('electron'); // eslint-disable-line
const MiniRouter = require('./MiniRouter');
const { WritableStreamBuffer } = require('stream-buffers');

const schemes = [];
global.__router_schemes__ = schemes;

class Router extends MiniRouter {
  constructor(schemeName = 'app', partitionKey) {
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
      let mProtocol = protocol;
      if (partitionKey) {
        mProtocol = session.fromPartition(partitionKey).protocol;
      }
      mProtocol.registerBufferProtocol(schemeName, this._handle.bind(this));
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

  _handle(request, cb) {
    const callback = (data, mimeType) => {
      mimeType = mimeType || 'text/html';
      if (typeof data === 'string') {
        data = Buffer.from(data);
      }
      cb({
        mimeType,
        data,
      });
    };

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
        url: request.url,
        headers: {},
      };
      const attemptHandler = (index) => {
        const tHandler = handlers[index];
        req.params = tHandler.params;
        const called = fn => (...args) => {
          if (calledBack) throw new Error('Already callled back');
          calledBack = true;
          fn(...args);
        };

        const res = new WritableStreamBuffer({ initialSize: 1024 * 1024, incrementAmount: 10 * 1024 });
        const originalEnd = res.end.bind(res);
        Object.assign(res, {
          json: called(o => callback(JSON.stringify(o))),
          send: called((s, m) => callback(s, m)),
          notFound: called(() => callback({ error: -6 })),
          end: called((data, ...args) => {
            originalEnd(data, ...args);
            if (typeof data === 'string') {
              callback(data);
            } else if (data instanceof Buffer) {
              callback(data);
            } else if (res.getContentsAsString('utf8').length > 0) {
              callback(res.getContentsAsString('utf8'));
            } else {
              callback('');
            }
          }),
          setHeader: () => undefined,
          getHeader: () => undefined,
        });

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
  }
}

module.exports = Router;
