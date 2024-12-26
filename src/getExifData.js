const ExifReader = require('exifreader');
const fs = require('fs');

async function getExifData(filePath) {
  try {
    const data = await ExifReader.load(fs.readFileSync(filePath));

    const bulletPoints = [];

    if (data['GPSLatitude'] && data['GPSLongitude']) {
      bulletPoints.push(
        `- GPS Coordinates: Latitude ${data['GPSLatitude'].description} (North), Longitude ${data['GPSLongitude'].description} (East)`
      );
    }

    if (data['GPSAltitude']) {
      bulletPoints.push(`- GPS Altitude: ${data['GPSAltitude'].description}`);
    }

    if (data['GPSImgDirection']) {
      bulletPoints.push(
        `- GPS Direction: ${data['GPSImgDirection'].description} degrees`
      );
    }

    if (data['DateTime']) {
      bulletPoints.push(
        `- Capture Date and Time: ${data['DateTime'].description}`
      );
    }

    if (bulletPoints.length === 0) {
      return null;
    } else {
      return bulletPoints.join('\n');
    }
  } catch (error) {
    console.error('Error reading EXIF data:', error);
    return null;
  }
}

module.exports = getExifData;
