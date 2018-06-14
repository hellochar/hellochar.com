const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const rimraf = require('rimraf');

/**
 * Runs OpenPoseDemo.exe, assuming the "openpose-1.3.0-win64-gpu-binaries" folder is here. Uses parameters tuned for installation:
 * * small camera resolution
 * * small net resolution
 * * model_pose MPI_4_layers
 * * use the camera
 * * no display
 *
 * OpenPoseDemo.exe will output .json files to a temp folder; .start() will constantly poll this temp folder for new files and read the
 * latest one as the newest "frame", which will be sent to the callback.
 */
exports.start = (callback) => {
  let intervalTimeoutId;

  const OUTPUT_FOLDER_NAME = "frames";

  // const command = `${path.join('bin', 'OpenPoseDemo.exe')} --camera_resolution 640x480 --net_resolution -1x240 --model_pose MPI_4_layers --write_json ${OUTPUT_FOLDER_NAME} --display 0`;
  const execName = path.join('bin', 'OpenPoseDemo.exe');
  const execParams = [
    // use smallest possible resolution
    "--camera_resolution 640x480",
    // accuracy vs speed tradeoff; manually tested 240 gives about 30ps with acceptable quality
    "--net_resolution -1x240",
    // different options for detecting specific limbs; we use the fastest and simplest one since we don't need limbs
    "--model_pose MPI_4_layers",
    // output the json
    `--write_json ${OUTPUT_FOLDER_NAME}`,
    // in trial and error, camera 1 was the genius wide angle
    "--camera 0",
    // flip the wide angle camera since we're displaying ourselves back on the screen
    "--frame_flip",

    // debug
    "--display 0",
  ];
  const command = `${execName} ${execParams.join(" ")}`;
  const cwd = path.resolve(__dirname, "openpose-1.3.0-win64-gpu-binaries");

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

  // delete the folder if it already exists, prevents stale frames from the last run from interfering
  rimraf(outputFolder, (err) => {
    if (err != null) {
      console.error("couldn't delete output folder because", err, ", things may be wonky");
    }
  });

  const delay = 1000 / 60;
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
          if (err != null) {
            console.error("couldn't delete ", filePath, "because", err);
          }
        });
      }
      // console.log(files);

      // now grab the json of the last file
      const mostRecentFilePath = path.resolve(outputFolder, files[files.length - 1]);
      try {
        var json = require(mostRecentFilePath);
        // console.log(json);
        callback(json);
      } catch (e) {
        // console.error(e);
      }
    }
  }, delay);

  function killOpenPose() {
    console.log("got exit, killing openpose");
    openPoseProcess.kill();
  }
  process.on('exit', killOpenPose);
  process.on('SIGINT', killOpenPose);
}
