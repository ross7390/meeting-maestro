const GEMINI_API_KEY = "AIzaSyDOFdqJfwsruNs1mA3Byfk4wza-j3gk1FE";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

export async function processTranscript(transcript) {
  try {
    const prompt = `
      Analyze this meeting transcript and extract the following information in a structured JSON format:
      
      1. Meeting title
      2. Meeting date (in MM/DD/YYYY format)
      3. Participants and their roles
      4. A concise summary of the meeting (1-2 paragraphs)
      5. Key decisions made (as a list)
      6. Action items with assignees and due dates
    
      Meeting Transcript:
      ${transcript}
    
      Response Format:
      {
        "title": "Meeting Title",
        "date": "MM/DD/YYYY",
        "participants": [
          {"name": "Person Name", "role": "Person Role"},
          ...
        ],
        "summary": "Concise meeting summary",
        "keyDecisions": [
          "Decision 1",
          "Decision 2",
          ...
        ],
        "actionItems": [
          {"person": "Name", "task": "Task description", "dueDate": "Due date"},
          ...
        ]
      }
    
      Only respond with the JSON object, no additional text or explanations.
    `;
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error.message}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
      throw new Error('No response from API');
    }
    
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // Sometimes the API might return text before/after the JSON, so extract just the JSON part
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON response');
    }
    
    const jsonStr = jsonMatch[0];
    const result = JSON.parse(jsonStr);
    
    return result;
  } catch (error) {
    console.error('Error processing transcript with Gemini API:', error);
    throw error;
  }
}