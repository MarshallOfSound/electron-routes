const { app, BrowserWindow } = require('electron'); // eslint-disable-line

let mainWindow;

global.ElectronRouter = require('../');

global.router = new global.ElectronRouter.Router();
global.router.get('foo/:thing/:other', (req, res) => {
  res.json(Object.assign({ foo: 'bar', thing: req.params.thing }, req));
});
global.router.post('send/:wut/:yolo', (req, res) => {
  res.json(Object.assign({ foo: 'bar', thing: req.params.thing }, req));
});
// global.router.get('/', (req, res) => res.json({}));
const testUse = new global.ElectronRouter.MiniRouter();
global.router.use(':use', testUse);
testUse.use('thing', (req, res, next) => { console.log('thing_route_use'); setTimeout(next, 1000); });
testUse.get('thing', (req, res, next) => { console.log('thing_route'); setTimeout(next, 1000); });
testUse.get(':this', (req, res) => { console.log('this_route'); res.json({ use: req.params.use, this: req.params.this }); });

function createWindow() {
  mainWindow = new BrowserWindow({ width: 800, height: 600 });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
