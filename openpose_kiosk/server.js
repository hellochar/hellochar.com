const { exec } = require('child_process');

var app = require('../app');

var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + server.address().port);
  console.log("Starting chrome in kiosk mode");
  exec("startChromeKiosk", { cwd: __dirname }, (err, stdout, stderr) => {
    console.log(stdout);
    if (err != null) {
      console.error(err);
      console.error(stderr);
    }
  });
});

var io = require('socket.io')(server);

var openPoseBridge = require('./openposedemo_bridge');
openPoseBridge.start((json) => {
  io.sockets.emit('update', json);
});
