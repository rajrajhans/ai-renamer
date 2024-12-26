const changeCase = require('./changeCase');
const getModelResponse = require('./getModelResponse');
const fs = require('fs').promises;
const path = require('path');
const getExifData = require('./getExifData');

module.exports = async (options) => {
  const {
    _case,
    chars,
    content,
    language,
    videoPrompt,
    customPrompt,
    relativeFilePath,
    inputPath,
    images,
  } = options;

  let imageExifData = {};

  if (images) {
    await Promise.all(
      images.map(async (image) => {
        const exifData = await getExifData(image);
        if (exifData) {
          imageExifData[image] = exifData;
        }
      })
    );
  }

  try {
    const fullPath = path.join(inputPath, relativeFilePath);
    const exifData = imageExifData[fullPath];
    const stats = await fs.stat(fullPath);

    const basePrompt = `You are a filename generator, and you need to create a short, descriptive, and meaningful filename.

- Use ${_case}
- Max ${chars} characters
- ${language} only
- No file extension
- No special chars
- Only key elements
- One word if possible
- Prefer noun-verb format

File metadata (Use only if Custom instructions asks to):
- Current filename: ${relativeFilePath}
- File created: ${stats.birthtime.toISOString()}
- File modified: ${stats.mtime.toISOString()}
- File size: ${stats.size} bytes
`;

    const promptLines = [basePrompt];

    if (videoPrompt) {
      promptLines.unshift(videoPrompt, '');
    }

    if (content) {
      promptLines.push('', 'Content:', content);
    }

    if (exifData) {
      promptLines.push(
        '',
        'Following is the EXIF Data extracted from image. Use the GPS coordinates to estimate the location to generate a more descriptive filename.',
        exifData
      );
    }

    if (customPrompt) {
      promptLines.push('', 'Custom instructions:', customPrompt);
    }

    const cotPrompt = `
    Output format:
\`\`\`plaintext
<scratchpad>
Are there GPS coordinates, altitude, or image direction in metadata that could give us an estimate of the location?
...
Is there any information in the metadata provided that could help?
...
Let's think through what a good file name should contain for this. 
...
</scratchpad> 

Suggested File Name: <filename>
\`\`\`
    `;

    promptLines.push(cotPrompt);

    const prompt = promptLines.join('\n');

    const modelResult = await getModelResponse({ ...options, prompt });

    const cleanedResult = modelResult.replace(/^```plaintext\n|\n```$/g, '');
    const match = cleanedResult.match(/Suggested File Name:\s*(.*)/);
    if (!match) {
      throw new Error('Could not find suggested file name in model response');
    }
    const suggestedName = match[1].trim();
    const maxChars = chars + 10;
    const text = suggestedName.trim().slice(-maxChars);
    const filename = await changeCase({ text, _case });
    return filename;
  } catch (err) {
    console.log(`🔴 Model error: ${err.message} (${relativeFilePath})`);
  }
};
