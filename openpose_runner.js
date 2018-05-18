const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

exports.start = (callback) => {
  let intervalTimeoutId;

  const OUTPUT_FOLDER_NAME = "frames";

  const command = `./bin/OpenPoseDemo.exe --camera_resolution 640x480 --net_resolution -1x240 --model_pose MPI_4_layers --write_json ${OUTPUT_FOLDER_NAME} --display 0`;
  const cwd = path.resolve("/", "Users", "hello", "Downloads", "openpose-1.3.0-win64-gpu-binaries", "openpose-1.3.0-win64-gpu-binaries");

  const openPoseProcess = exec(command, {
    cwd: cwd
  }, (error, stdout, stderr) => {
    console.log("stdout:", stdout);
    if (error != null) {
      console.log('------------- error --------------');
      console.log(error);
      console.log(stderr);
    }
    clearInterval(intervalTimeoutId);
  });



  // ok we've now started it, now start watching for folder output
  const outputFolder = path.resolve(cwd, OUTPUT_FOLDER_NAME);

  const delay = 1000 / 25; // target 25fps

  intervalTimeoutId = setInterval(() => {
    // these come out relative to outputFolder
    let files;
    try {
      files = fs.readdirSync(outputFolder);
    } catch (e) {
      // folder doesn't exist yet (OpenPose hasn't started up yet); just exit for now
      console.log("couldn't find folder, skipping...");
      return;
    }

    if (files.length > 0) {
      // take advantage of the fact that it's giving it back to us in sorted order to
      // delete every file but the last one
      for (let i = 0; i < files.length - 1; i++) {
        const filePath = path.resolve(outputFolder, files[i]);
        fs.unlink(filePath, (err) => {
          throw err;
        });
      }
      // console.log(files);

      // now grab the json of the last file
      const mostRecentFilePath = path.resolve(outputFolder, files[files.length - 1]);
      var json = require(mostRecentFilePath);
      // console.log(json);
      callback(json);
    }
  }, delay);

  process.on('exit', () => {
    console.log("got exit, killing openpose");
    openPoseProcess.kill();
  });
}
