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
      'Generate a filename:',
      '',
      `- Use ${_case}`,
      `- Max ${chars} characters`,
      `- ${language} only`,
      `- No file extension`,
      `- No special chars`,
      `- Only key elements`,
      `- One word if possible`,
      `- Prefer noun-verb format`,
      '',
      'File metadata (Use only if custom prompt asks to):',
      `- Current filename: ${relativeFilePath}`,
      `- File created: ${stats.birthtime.toISOString()}`,
      `- File modified: ${stats.mtime.toISOString()}`,
      `- File size: ${stats.size} bytes`,
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
