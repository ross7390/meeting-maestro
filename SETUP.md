# Meeting Follow-Up Agent - Simplified Setup

## Core Functionality

This application processes meeting transcripts to automatically:
- Generate meeting summaries
- Extract key decisions
- Identify action items with assignees and due dates
- Create follow-up emails

## Simplified Architecture

### Technology Stack
- **HTML/CSS/JavaScript**: Modern vanilla JavaScript (ES6+) approach, no build steps required
- **Alpine.js**: Lightweight JavaScript framework for interactivity (loaded via CDN)
- **Tailwind CSS**: For styling (loaded via CDN)
- **Gemini API**: For transcript analysis (direct browser calls using fetch API)
- **localStorage**: For temporary data storage between pages

### File Structure
```
/
├── index.html                  # Landing page with file upload
├── results.html                # Results display page with tabs
├── js/
│   ├── app.js                  # Main application logic
│   ├── gemini-api.js           # API integration with Gemini
│   ├── results.js              # Renders results in tabs
│   └── parser.js               # Parses different file formats
├── css/
│   └── styles.css              # Custom styles beyond Tailwind
├── data/
│   └── sample-transcript.csv   # Demo transcript file
└── img/
    └── logo.svg                # App logo
```

## User Flow

1. User visits index.html and uploads a transcript or tries demo mode
2. JavaScript reads the file and sends content to Gemini API
3. API response is stored in localStorage with a unique ID
4. User is redirected to results.html?id=[unique-id]
5. Results page reads data from localStorage and displays it in tabs

## CSV Format

The application handles CSV files with this structure:

```csv
timestamp,speaker,text
00:00,Meeting Bot,Meeting: Quarterly Product Planning
00:15,Meeting Bot,Date: 04/25/2025
00:30,Meeting Bot,"Participants: John Smith (Product Manager), Sarah Lee (UX Designer)"
01:30,John Smith,"Good morning everyone! Let's get started with our planning session."
02:15,Sarah Lee,"I'd like to discuss the new dashboard design we've been working on."
```

## Gemini API Integration

### API Key
- The application uses a Gemini API key hardcoded in `gemini-api.js` - no need to hide it in environment variables
- Key: `AIzaSyDOFdqJfwsruNs1mA3Byfk4wza-j3gk1FE`
- Simply include this directly in your JavaScript:
```javascript
const GEMINI_API_KEY = "AIzaSyDOFdqJfwsruNs1mA3Byfk4wza-j3gk1FE";
```

### Prompt Structure
The Gemini API call uses this prompt structure:
```javascript
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
```

## UI Components (Matching Original Design)

### Homepage
- Sticky header with logo and app name
- Blue/purple gradient headline: "Transform Meetings into Action"
- "Streamline Your Meetings" tag above headline
- Description text about the app's functionality
- Upload card with:
  - Drag-and-drop file functionality
  - File type support message (TXT, CSV, JSON)
  - Upload button with icon
  - "OR" divider
  - "Try Demo" button
- Features section with 3-column layout below upload area
- Footer with attribution

### Results Page with Tabs
- Tabbed interface with 3 tabs:
  - Summary Tab:
    - Meeting title and date at top
    - Participants list with names and roles
    - Meeting summary in a card
    - Key decisions in an accordion or list
  - Action Items Tab:
    - Table/cards for action items
    - Each item shows: assignee, task description, due date
    - Visual indicators for due date proximity
  - Follow-Up Emails Tab:
    - Template email composer
    - Recipient dropdown based on participants
    - Pre-filled content based on meeting summary and action items
    - "Send" button (simulated in this implementation)
- Navigation between tabs with visual indicators
- "Back to Home" link or button

## Deployment to GitHub Pages

1. Create a repository on GitHub
2. Clone the repository locally
3. Add all HTML, CSS, and JavaScript files to the repository's root directory
   - **IMPORTANT**: Make sure index.html is in the root directory, not in a subdirectory
4. Push the changes to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```
5. Go to repository Settings → Pages
6. Under "Build and deployment":
   - Set Source to "Deploy from a branch" (NOT GitHub Actions)
   - Select the "main" branch
   - Set the folder to "/" (root)
7. Your site will be published at: https://[username].github.io/[repository-name]/

GitHub Pages will automatically serve your index.html from the root directory without any build process. When you make updates, simply commit and push to the main branch again, and GitHub Pages will automatically update your site.

**Note**: Using the branch deployment approach is much simpler than GitHub Actions or gh-pages npm package. No workflows, no build tools, no complex deployment scripts - just pure static files served directly from your main branch.

## Example HTML Structure with Alpine.js

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Follow-Up Agent</title>
  <!-- Modern CDN approaches -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body class="bg-white min-h-screen flex flex-col" x-data="{ darkMode: false }">
  <header class="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-800 dark:text-white">
    <div class="flex h-16 items-center justify-between px-4 max-w-screen-xl mx-auto">
      <div class="flex items-center space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span class="font-bold text-xl">Meeting Follow-Up Agent</span>
      </div>
      <button @click="darkMode = !darkMode" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
        <svg x-show="!darkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <svg x-show="darkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </button>
    </div>
  </header>
  
  <main class="flex-1 flex flex-col items-center p-4">
    <!-- Main content here with Alpine.js components -->
    <div x-data="{ isUploading: false, fileName: '' }" class="max-w-md w-full">
      <!-- Upload component example -->
    </div>
  </main>

  <footer class="border-t py-6 w-full dark:bg-gray-800 dark:text-white">
    <div class="flex flex-col md:flex-row items-center justify-center md:justify-between max-w-screen-xl mx-auto px-4">
      <p class="text-center text-sm text-gray-500 dark:text-gray-400">Built with Alpine.js and Tailwind CSS</p>
      <div class="flex items-center space-x-1 mt-2 md:mt-0">
        <span class="text-sm text-gray-500 dark:text-gray-400">Powered by Gemini AI</span>
      </div>
    </div>
  </footer>

  <!-- Modern approach with ES modules -->
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

This simplified approach maintains the same functionality as the original application but is much easier to deploy to GitHub Pages since all files are static and there's no build process required.

## Modern Development Benefits

- **No Build Tools Required**: All dependencies loaded via CDN, no npm or build steps needed
- **Alpine.js**: Modern, lightweight JavaScript framework (only 7.1KB gzipped) for reactive components
- **ES Modules**: Native browser module support for clean code organization
- **Mobile-First**: Fully responsive design with Tailwind CSS
- **Dark Mode Support**: Built-in dark mode toggle using Alpine.js
- **Easy to Modify**: Simple file structure makes it easy to understand and update
- **Cross-Browser Compatible**: Works in all modern browsers

## Getting Started

To start developing locally:

1. Clone the repository
2. Open index.html in a modern browser (Chrome, Firefox, Edge, Safari)
3. For a local development server, you can use any of these simple options:
   - Python: `python -m http.server`
   - VS Code: Use the Live Server extension
   - Node.js: `npx serve`

No complex setup, dependencies, or build tools required!