Personal website dedicated to creative code, past work, etc.

Development
===========

Run `yarn start` to start webpack-dev-server.

Deploying
=========

Run `yarn prod` on an external server (e.g. Heroku). This will
compile the ts into /public/app.js and run a local node express
server which points public/ as a content base, hooking up
index.html to find /app.js and /assets/ properly.