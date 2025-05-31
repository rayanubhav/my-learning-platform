const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('Loading geminiApi.js');

let genAI;
if (process.env.GEMINI_API_KEY) {
  console.log('Using GEMINI_API_KEY:', process.env.GEMINI_API_KEY);
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.warn('GEMINI_API_KEY is not set in environment variables. Test generation with AI will be disabled.');
}

async function generateTest(courseTitle, courseDescription) {
  if (!genAI) {
    throw new Error('Test generation with AI is disabled because GEMINI_API_KEY is not set.');
  }

  console.log('generateTest called with:', courseTitle, courseDescription);
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
      Generate a test with 3 multiple-choice questions based on the course titled "${courseTitle}" with the description: "${courseDescription}". 
      Format the response as a JSON object with the following structure:
      {
        "questions": [
          {
            "question": "Question text",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswer": "Correct option"
          }
        ]
      }
      Ensure the response is valid JSON and do not wrap the response in Markdown code blocks (e.g., do not include \`\`\`json or \`\`\`).
    `;

    console.log('Sending prompt to Gemini API:', prompt);
    const result = await model.generateContent(prompt);
    console.log('Gemini API response:', result);

    const responseText = result.response.text();
    console.log('Raw response text:', responseText);

    // Clean the response by removing Markdown code block syntax
    let cleanedText = responseText;
    // Remove ```json at the start and ``` at the end
    cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
    // Trim any extra whitespace or newlines
    cleanedText = cleanedText.trim();
    console.log('Cleaned response text:', cleanedText);

    let test;
    try {
      test = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      throw new Error('Gemini API did not return valid JSON: ' + cleanedText);
    }
    console.log('Parsed test:', test);

    if (!test.questions || !Array.isArray(test.questions)) {
      throw new Error('Invalid test format: "questions" must be an array');
    }
    for (const q of test.questions) {
      if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length !== 4 || !q.correctAnswer) {
        throw new Error('Invalid question format: Each question must have a question, 4 options, and a correctAnswer');
      }
    }

    return test;
  } catch (error) {
    console.error('Error generating test:', error.message, error.stack);
    throw new Error('Failed to generate test: ' + error.message);
  }
}

module.exports = { generateTest };
console.log('Exporting from geminiApi.js:', module.exports);