const path = require('path');
const fs = require('fs').promises;
const { Sema } = require('async-sema');

const processFile = require('./processFile');

const processDirectory = async ({ options, inputPath }) => {
  try {
    const sema = new Sema(options.concurrency || 10);

    const files = await fs.readdir(inputPath);
    const processPromises = [];

    for (const file of files) {
      const filePath = path.join(inputPath, file);
      const fileStats = await fs.stat(filePath);

      if (fileStats.isFile()) {
        const processWithSemaphore = async () => {
          try {
            await sema.acquire();
            await processFile({ ...options, filePath });
          } finally {
            sema.release();
          }
        };

        processPromises.push(processWithSemaphore());
      } else if (fileStats.isDirectory() && options.includeSubdirectories) {
        await processDirectory({ options, inputPath: filePath });
      }
    }

    await Promise.all(processPromises);
  } catch (err) {
    console.log(err.message);
  }
};

module.exports = processDirectory;
