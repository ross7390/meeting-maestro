# Meeting Maestro

Meeting Maestro is an AI-powered web application that transforms meeting transcripts into actionable insights. It automatically analyzes meeting transcripts to generate summaries, extract key decisions, identify action items, and create personalized follow-up emails.

## Features

### Core Functionality
- **Smart Meeting Summaries**: Automatically generates concise, accurate summaries from meeting transcripts
- **Action Item Tracking**: Extracts tasks with assignees and due dates from meeting content
- **Decision Documentation**: Records key decisions made during meetings
- **Follow-up Email Generator**: Creates customized emails based on meeting outcomes
- **Dark Mode**: Supports both light and dark UI themes

### Task Management
- **Dual Task Views**: Toggle between table view and grouped-by-assignee views
- **Smart Task Status Detection**: Automatically determines task status based on content analysis
- **Task Editing and Reassignment**: Easily modify or reassign tasks with visual notifications
- **Task Status Tracking**: Manage tasks as Pending, In Progress, or Completed
- **Create New Tasks**: Add tasks that weren't mentioned in the meeting

### Email Functionality (Currently Not Working)
- **Email Contact Management**: Edit participant email addresses
- **Multi-select Recipients**: Choose specific recipients for targeted follow-ups
- **Personalized Emails**: Generate custom emails based on recipient's assigned tasks
- **Status Indicators**: Clear visual indicators for task status (✅ ⏳ 🔄)
- **Test Email Feature**: Verify email configuration is working properly

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **UI Framework**: Alpine.js (loaded via CDN)
- **Styling**: Tailwind CSS (loaded via CDN)
- **AI Integration**: Google Gemini API for transcript analysis
- **Storage**: localStorage for data persistence between pages
- **Email**: EmailJS integration (currently not functioning)

## How It Works

1. **Upload Transcript**: Upload a meeting transcript file (CSV, TXT, JSON) or try the demo mode
2. **AI Processing**: The transcript is sent to the Gemini API for analysis
3. **Results Display**: View the meeting summary, action items, and follow-up email options
4. **Manage Tasks**: Edit, reassign, or update the status of action items
5. **Create Follow-ups**: Generate personalized follow-up emails based on meeting outcomes

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

## Getting Started

### Local Development

1. Clone the repository
2. Open index.html in a modern browser (Chrome, Firefox, Edge, Safari)
3. For a local development server, you can use any of these simple options:
   - Python: `python -m http.server`
   - VS Code: Use the Live Server extension
   - Node.js: `npx serve`

### Deployment

Deploy to GitHub Pages:

1. Create a repository on GitHub
2. Push all files to the repository's root directory
3. Go to repository Settings → Pages
4. Set Source to "Deploy from a branch"
5. Select the "main" branch and set the folder to "/" (root)

## Known Issues

- **Email Functionality**: The EmailJS integration is currently not working. The email sending feature has been implemented but requires proper configuration with a valid EmailJS account and credentials.

## Future Improvements

- Fix EmailJS integration for working email functionality
- Add support for more transcript formats
- Implement cloud storage for larger transcripts
- Add collaborative features for team task management
- Integrate with calendar apps for scheduling follow-up meetings

## License

This project is licensed under the MIT License - see the LICENSE file for details.