const changeCase = require('./changeCase');
const getModelResponse = require('./getModelResponse');
const fs = require('fs').promises;
const path = require('path');

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
  } = options;

  try {
    const fullPath = path.join(inputPath, relativeFilePath);
    const stats = await fs.stat(fullPath);

    const promptLines = [
      'Generate filename:',
      '',
      `Use ${_case}`,
      `Max ${chars} characters`,
      `${language} only`,
      'No file extension',
      'No special chars',
      'Only key elements',
      'One word if possible',
      'Noun-verb format',
      '',
      'File metadata (Use only if custom prompt asks to):',
      `Current file name: ${relativeFilePath}`,
      `Created: ${stats.birthtime.toISOString()}`,
      `Modified: ${stats.mtime.toISOString()}`,
      `Size: ${stats.size} bytes`,
      '',
      'Respond ONLY with filename.',
    ];

    if (videoPrompt) {
      promptLines.unshift(videoPrompt, '');
    }

    if (content) {
      promptLines.push('', 'Content:', content);
    }

    if (customPrompt) {
      promptLines.push('', 'Custom instructions:', customPrompt);
    }

    const prompt = promptLines.join('\n');

    const modelResult = await getModelResponse({ ...options, prompt });

    const maxChars = chars + 10;
    const text = modelResult.trim().slice(-maxChars);
    const filename = await changeCase({ text, _case });
    return filename;
  } catch (err) {
    console.log(`🔴 Model error: ${err.message} (${relativeFilePath})`);
  }
};
