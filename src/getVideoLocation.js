const { exec } = require('child_process');

async function getVideoLocation(filePath) {
  return new Promise((resolve, reject) => {
    const command = `ffprobe -v error -select_streams v:0 -show_entries format_tags=location -of json "${filePath}"`;

    exec(command, (err, stdout) => {
      if (err) {
        reject(new Error(`Error getting video location: ${err.message}`));
        return;
      }

      try {
        const data = JSON.parse(stdout);
        const location = data?.format?.tags?.location;
        const creationTime = data?.format?.tags?.creation_time;

        if (!location) {
          resolve(null);
          return;
        }

        // Parse location string in format "+50.0407+8.5575+000.000/"
        const matches = location.match(
          /([+-]\d+\.\d+)([+-]\d+\.\d+)([+-]\d+\.\d+)/
        );
        if (!matches) {
          resolve(null);
          return;
        }

        const [, latitude, longitude, altitude] = matches;
        return resolve({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          altitude: parseFloat(altitude),
          creationTime: creationTime,
        });
      } catch (error) {
        reject(
          new Error(`Error parsing video location data: ${error.message}`)
        );
      }
    });
  });
}

module.exports = getVideoLocation;
