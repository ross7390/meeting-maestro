export async function parseFile(file) {
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

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
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