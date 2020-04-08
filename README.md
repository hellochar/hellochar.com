Personal website dedicated to creative code, past work, etc.

Development
===========

Run `yarn start` to start webpack-dev-server.

Deploying
=========

Pushes to master are set up to auto-deploy to a heroku host.

Run `yarn prod` on an external server (e.g. Heroku). This will
compile the ts into /public/app.js and run a local node express
server which points public/ as a content base, hooking up
index.html to find /app.js and /assets/ properly.

Kiosk Mode
==========

Run `yarn kiosk` to start the server in kiosk mode, made for art
installations. It does a few things:

1. Runs CMU's OpenPose and reads realtime webcam data.
2. Starts a websockets server which emits the pose information.
3. (Windows only) Starts Google Chrome pointed at a specific URL, in Chrome Kiosk mode.
