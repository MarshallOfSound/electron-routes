# electron-router

[![Build Status](https://travis-ci.org/MarshallOfSound/electron-router.svg?branch=master)](https://travis-ci.org/MarshallOfSound/electron-router)
[![npm version](https://badge.fury.io/js/%40marshallofsound%2Felectron-router.svg)](https://badge.fury.io/js/%40marshallofsound%2Felectron-router)
[![npm](https://img.shields.io/npm/dm/electron-routes.svg)](https://www.npmjs.com/package/electron-routes)
[![license](https://img.shields.io/github/license/MarshallOfSound/electron-router.svg?maxAge=2592000)](https://github.com/MarshallOfSound/electron-router/blob/master/LICENSE)
![status](https://img.shields.io/badge/Status-%20Ready%20for%20Awesome-red.svg)

Use an Express style API that you know and love without the security concerns and hassle of making it
work inside Electron.

## Install

```
$ npm install --save electron-routes
```

## Usage

```js
// Main Process
import { Router } from 'electron-routes';

const api = new Router('myscheme');
api.get('foo', (req, res) => {
  res.json({
    hello: 'world',
  });
});

// Renderer Process
import { rendererPreload } from 'electron-routes';

rendererPreload();

fetch('myscheme://foo')
  .then(resp => resp.json())
  .then(o => console.log(o)); // { hello: 'world' }
```

## API

### Router([schemeName = 'app', partitionName])

#### router.\[method\](pathPattern, handler)

**NOTE:** method can be any standard HTTP method (`get`, `post`, `put`, `delete`)

This will set the handler function to be called whenever a path is requested that
mathces the provided `pathPattern` and the request method is the same as `method`;

The `handler` function will be called with:
* `request` - A [`Request`](#request) object
* `response` - A [`Response`](#response) object
* `next` - A function to tell `electron-router` to attempt the next handler

Note, if you call `next` in all the handlers `electron-router` will automatically
send a 404 File Not Found error message.

#### router.use(pathPattern, handler)

If `handler` is a function this will act in exactly the same way as the generic
`method` function above.  However, if the `handler` is a `MiniRouter` it will pass
all requests that match the `pathPattern` through to the `MiniRouter`, but **only**
after all standard method handlers have been called on the current router.

All handlers on the current router will take precedence over handlers on a sub-router.

### MiniRouter()

MiniRouter has an identical API to the main [`Router`](#router) class.  Just make
sure you only use the main `Router` class for the top level router though, or bad
things will happen.

### rendererPreload()

This method will enable the registered schemes to work with the `fetch` API and
bypasses certain `CORS` errors that can occur.  99.99% of the time you will need
to call this method.

**NOTE:** It's probably a good idea to call it in a preload script

### Request

#### request.params

An object of all the URL params that resulted in this path being valid. E.g. The
path `foo/:thing/hello` would match if you requsted `myscheme://foo/magical/hello`.

In this case `request.params` would be equal to:

```js
request.params = {
  thing: 'magical'
}
```

#### request.method

The HTTP method that caused this request.  Normally one of `get`, `post`, `put`
or `delete`.

#### referrer

#### request.uploadData[]

An array of Electron's `uploadData` objects.  They follow the same structure as
found in the [Electron docs](http://electron.atom.io/docs/api/structures/upload-data/)
but with two extra methods.

##### request.uploadData.textContent()

Automatically attempts to convert the `bytes` Buffer of the uploadData into a string
and return it.

##### request.uploadData.json()

Automatically attempts to convert the `bytes` Buffer of the uploadData into a
javascript object and return it.

### Response

#### response.json(object)

Will immediately terminate the request sending a stringified version of the object
back to the client.

#### response.send(string)

Will immediately terminate the request sending the string as the response text
back to the client.

#### response.notFound()

Will immediately terminate the request with a 404 File Not Found response


## Team

| [![Sindre Sorhus](https://s.gravatar.com/avatar/1576c987b53868acf73d6ccb08110a78?s=144)](https://sindresorhus.com) |
|---|
| [Samuel Attard](https://samuelattard.com) |

## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
