// Main application JavaScript - simplified non-module approach
// Global API key
const GEMINI_API_KEY = "AIzaSyDOFdqJfwsruNs1mA3Byfk4wza-j3gk1FE";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// File parsing functions
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}

async function parseFile(file) {
  if (!file) {
    throw new Error('No file provided');
  }

  const extension = file.name.split('.').pop().toLowerCase();
  const fileContent = await readFileAsText(file);

  switch (extension) {
    case 'csv':
      return parseCSV(fileContent);
    case 'txt':
      return fileContent;
    case 'json':
      try {
        // For JSON files, we just validate it's proper JSON and return raw content
        JSON.parse(fileContent);
        return fileContent;
      } catch (error) {
        throw new Error('Invalid JSON file');
      }
    default:
      throw new Error(`Unsupported file format: ${extension}`);
  }
}

function parseCSV(csvContent) {
  // For simple CSV parsing, we'll convert to a more readable format for the AI
  const lines = csvContent.split('\n');
  let formattedTranscript = '';
  
  // Remove empty lines and skip header if it exists
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  const hasHeader = nonEmptyLines[0].includes('timestamp') && nonEmptyLines[0].includes('speaker');
  
  const dataLines = hasHeader ? nonEmptyLines.slice(1) : nonEmptyLines;
  
  for (const line of dataLines) {
    // Handle quoted CSV fields properly
    let parts = [];
    let inQuotes = false;
    let currentPart = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(currentPart);
        currentPart = '';
      } else {
        currentPart += char;
      }
    }
    
    // Add the last part
    parts.push(currentPart);
    
    // Ensure we have at least timestamp, speaker, and text
    if (parts.length >= 3) {
      const timestamp = parts[0].trim();
      const speaker = parts[1].trim();
      const text = parts[2].trim().replace(/^"|"$/g, ''); // Remove surrounding quotes if any
      
      formattedTranscript += `[${timestamp}] ${speaker}: ${text}\n`;
    }
  }
  
  return formattedTranscript;
}

// API integration
async function processTranscript(transcript) {
  try {
    // Show processing notification
    document.getElementById('processing-notification').classList.remove('hidden');
    
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
    
    // Hide processing notification
    document.getElementById('processing-notification').classList.add('hidden');
    
    return result;
  } catch (error) {
    console.error('Error processing transcript with Gemini API:', error);
    // Hide processing notification and show error
    document.getElementById('processing-notification').classList.add('hidden');
    document.getElementById('error-notification').textContent = error.message;
    document.getElementById('error-notification').classList.remove('hidden');
    throw error;
  }
}

// Alpine.js handlers
document.addEventListener('alpine:init', () => {
  Alpine.data('uploadHandler', () => ({
    isDragging: false,
    isUploading: false,
    fileName: '',
    fileContent: null,
    hasError: false,
    errorMessage: '',

    handleFileDrop(event) {
      this.isDragging = false;
      const file = event.dataTransfer.files[0];
      if (file) {
        this.processFile(file);
      }
    },
    
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        this.processFile(file);
      }
    },
    
    async processFile(file) {
      try {
        this.fileName = file.name;
        this.isUploading = true;
        this.hasError = false;
        
        // Check file extension
        const extension = file.name.split('.').pop().toLowerCase();
        if (!['csv', 'txt', 'json'].includes(extension)) {
          throw new Error(`Unsupported file format: ${extension}. Please upload CSV, TXT, or JSON.`);
        }
        
        const fileContent = await parseFile(file);
        this.fileContent = fileContent;
        
        // Process transcript with Gemini API
        const result = await processTranscript(fileContent);
        
        // Generate a unique ID for this result
        const resultId = Date.now().toString();
        
        // Store result in localStorage
        localStorage.setItem(`meeting_result_${resultId}`, JSON.stringify(result));
        
        // Redirect to results page
        window.location.href = `results.html?id=${resultId}`;
      } catch (error) {
        console.error('Error processing file:', error);
        this.isUploading = false;
        this.hasError = true;
        this.errorMessage = error.message;
      }
    },
    
    async loadDemo() {
      try {
        this.isUploading = true;
        this.hasError = false;
        
        console.log("Loading demo transcript...");
        
        // Fetch sample transcript
        const response = await fetch('data/sample-transcript.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch demo data: ${response.status} ${response.statusText}`);
        }
        
        const content = await response.text();
        console.log("Demo content loaded, parsing...");
        
        const parsedContent = parseCSV(content);
        console.log("Demo content parsed, processing with API...");
        
        // Process with Gemini API
        const result = await processTranscript(parsedContent);
        console.log("API processing complete:", result);
        
        // Generate a unique ID for this result
        const resultId = Date.now().toString();
        
        // Store result in localStorage
        localStorage.setItem(`meeting_result_${resultId}`, JSON.stringify(result));
        
        // Redirect to results page
        window.location.href = `results.html?id=${resultId}`;
      } catch (error) {
        console.error('Error loading demo:', error);
        this.isUploading = false;
        this.hasError = true;
        this.errorMessage = error.message;
      }
    }
  }));
});