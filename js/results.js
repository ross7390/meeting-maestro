// Results page JavaScript - simplified non-module approach

document.addEventListener('alpine:init', () => {
  // Initialize EmailJS - Configured with user's account
  const EMAIL_SERVICE_ID = 'service_h4npzph'; // Gmail service provided by user
  const EMAIL_TEMPLATE_ID = 'template_2iz1r38'; // Email template ID
  const EMAIL_PUBLIC_KEY = 'gVoRJ9BsD-g5lbkLK'; // User's public key
  
  // Initialize EmailJS
  (function() {
    try {
      // Initialize with the configured public key
      if (typeof emailjs !== 'undefined' && emailjs.init) {
        emailjs.init(EMAIL_PUBLIC_KEY);
        console.log('EmailJS initialized successfully with key');
      } 
    } catch (error) {
      console.error('Error initializing EmailJS:', error);
    }
  })();
  
  Alpine.data('resultsHandler', () => ({
    activeTab: 'summary',
    loading: true,
    error: null,
    meetingData: null,
    emailRecipient: '',
    emailSubject: '',
    emailBody: '',
    senderEmail: '',
    senderName: '',
    editingItem: null,
    selectedRecipients: [], // For multi-select email recipients
    emailServiceId: EMAIL_SERVICE_ID,
    emailTemplateId: EMAIL_TEMPLATE_ID,
    emailPublicKey: EMAIL_PUBLIC_KEY,
    sendingEmail: false,
    emailSent: false,
    emailError: null,
    editingParticipant: null, // For editing participant email
    refreshFlag: 0, // Add a reactive flag to force refreshes
    showTaskAssignmentTable: true, // Flag to show task assignment table
    
    init() {
      console.log("Initializing results handler");
      this.loadMeetingData();
    },
    
    loadMeetingData() {
      try {
        // Get result ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const resultId = urlParams.get('id');
        
        console.log("Loading meeting data with ID:", resultId);
        
        if (!resultId) {
          this.error = 'No result ID provided';
          this.loading = false;
          return;
        }
        
        // Retrieve data from localStorage
        const storedData = localStorage.getItem(`meeting_result_${resultId}`);
        
        if (!storedData) {
          this.error = 'No data found for this session';
          this.loading = false;
          return;
        }
        
        // Parse the data
        try {
          this.meetingData = JSON.parse(storedData);
          console.log("Meeting data loaded:", this.meetingData);
        } catch (e) {
          console.error("Error parsing stored data:", e);
          this.error = 'Error parsing meeting data';
          this.loading = false;
          return;
        }
        
        // Add email addresses to participants if they don't have them
        if (this.meetingData.participants) {
          this.meetingData.participants = this.meetingData.participants.map(participant => {
            if (!participant.email) {
              // Create a likely email based on name
              const nameWithoutSpaces = participant.name.toLowerCase().replace(/\s+/g, '.');
              const likelyEmail = `${nameWithoutSpaces}@example.com`;
              
              return {
                ...participant,
                email: likelyEmail
              };
            }
            return participant;
          });
        }
        
        // Add editable flag and determine appropriate status for each action item
        if (this.meetingData.actionItems) {
          this.meetingData.actionItems = this.meetingData.actionItems.map(item => {
            // Analyze the task description and due date to determine a likely status
            let status = this.determineTaskStatus(item);
            
            return {
              ...item,
              status: status,
              editing: false
            };
          });
        }
        
        // Set default email subject and body
        this.setDefaultEmailContent();
        
        this.loading = false;
      } catch (error) {
        console.error('Error loading meeting data:', error);
        this.error = `Error loading meeting data: ${error.message}`;
        this.loading = false;
      }
    },
    
    setDefaultEmailContent() {
      if (!this.meetingData) return;
      
      // Set default subject with meeting title
      this.emailSubject = `Follow-up: ${this.meetingData.title}`;
      
      // Create default email body
      this.emailBody = `Hello [Recipient],

I hope this email finds you well. I'm following up on our recent meeting: "${this.meetingData.title}" held on ${this.meetingData.date}.

Here's a brief summary of what we discussed:
${this.meetingData.summary}

Key decisions made:
${this.meetingData.keyDecisions.map(decision => `- ${decision}`).join('\n')}

Your action items:
${this.getRecipientActionItems('[Recipient]').map(item => `- ${item.task} (Due: ${item.dueDate})`).join('\n')}

Please let me know if you have any questions or need any clarification.

Best regards,
[Your Name]`;
    },
    
    getRecipientActionItems(recipient) {
      if (!this.meetingData || !this.meetingData.actionItems) {
        return [];
      }
      
      if (recipient === 'all' || recipient === '[Recipient]') {
        return this.meetingData.actionItems;
      }
      
      return this.meetingData.actionItems.filter(item => 
        item.person.toLowerCase() === recipient.toLowerCase()
      );
    },
    
    toggleRecipientSelection(recipient) {
      const index = this.selectedRecipients.indexOf(recipient);
      if (index === -1) {
        // Add to selection
        this.selectedRecipients.push(recipient);
      } else {
        // Remove from selection
        this.selectedRecipients.splice(index, 1);
      }
      
      // Update the email body based on selected recipients
      this.updateSelectedRecipientsEmail();
    },
    
    selectAllRecipients() {
      if (this.meetingData && this.meetingData.participants) {
        this.selectedRecipients = this.meetingData.participants.map(p => p.name);
        this.updateSelectedRecipientsEmail();
      }
    },
    
    clearRecipientSelection() {
      this.selectedRecipients = [];
      this.updateSelectedRecipientsEmail();
    },
    
    updateSelectedRecipientsEmail() {
      if (this.selectedRecipients.length === 0) {
        // Reset to default template
        this.setDefaultEmailContent();
        return;
      }
      
      if (this.selectedRecipients.length === 1) {
        // Single recipient
        this.updateEmailBodyForRecipient(this.selectedRecipients[0]);
      } else {
        // Multiple recipients
        this.updateEmailBodyForMultipleRecipients();
      }
    },
    
    updateEmailBodyForRecipient(recipient) {
      console.log("Updating email body for recipient:", recipient);
      
      const personalizedBody = this.emailBody.replace(/\[Recipient\]/g, recipient);
      
      // Get action items for this recipient
      const recipientTasks = this.getRecipientActionItems(recipient);
      
      // Create a formatted task list with status indicators
      let actionItemsText = '';
      
      if (recipientTasks.length > 0) {
        recipientTasks.forEach(task => {
          const statusIndicator = task.status === 'Completed' 
            ? '✅ [COMPLETED]' 
            : task.status === 'In Progress' 
              ? '🔄 [IN PROGRESS]' 
              : '⏳ [PENDING]';
          
          actionItemsText += `- ${task.task} (Due: ${task.dueDate}) ${statusIndicator}\n`;
        });
      } else {
        actionItemsText = 'You have no assigned tasks from this meeting.\n';
      }
      
      // Also show tasks assigned to others for awareness
      const otherTasks = this.meetingData.actionItems.filter(item => 
        item.person && item.person !== recipient
      );
      
      if (otherTasks.length > 0) {
        actionItemsText += '\nTasks assigned to others:\n';
        
        // Group tasks by assignee
        const tasksByPerson = {};
        
        otherTasks.forEach(task => {
          if (!tasksByPerson[task.person]) {
            tasksByPerson[task.person] = [];
          }
          tasksByPerson[task.person].push(task);
        });
        
        // Format tasks by person
        for (const person in tasksByPerson) {
          actionItemsText += `${person}:\n`;
          
          tasksByPerson[person].forEach(task => {
            const statusIndicator = task.status === 'Completed' 
              ? '✅' 
              : task.status === 'In Progress' 
                ? '🔄' 
                : '⏳';
            
            actionItemsText += `  ${statusIndicator} ${task.task} (Due: ${task.dueDate})\n`;
          });
        }
      }
      
      // Replace the action items section
      const newBody = personalizedBody.replace(
        /Your action items:\n(.*?)(\n\nPlease)/s,
        `Your action items:\n${actionItemsText}\n\nPlease`
      );
      
      this.emailBody = newBody;
    },
    
    updateEmailBodyForMultipleRecipients() {
      // Create a greeting for multiple recipients
      let recipientList = this.selectedRecipients.join(', ');
      const personalizedBody = this.emailBody.replace(/Hello \[Recipient\],/g, `Hello ${recipientList},`);
      
      // Get all participants and their action items
      let allParticipants = [];
      
      // First, get a complete list of participants who have tasks
      this.meetingData.actionItems.forEach(item => {
        if (!allParticipants.includes(item.person)) {
          allParticipants.push(item.person);
        }
      });
      
      // Filter the participants based on selected recipients
      const relevantParticipants = this.selectedRecipients.length > 0 
        ? allParticipants.filter(p => this.selectedRecipients.includes(p))
        : allParticipants;
      
      // Create a task assignment table
      let formattedItems = '';
      
      // Header section
      formattedItems += 'TASK ASSIGNMENTS\n';
      formattedItems += '---------------\n\n';
      
      // Get tasks by participant
      relevantParticipants.forEach(person => {
        // Get tasks for this person
        const tasks = this.meetingData.actionItems.filter(item => item.person === person);
        
        if (tasks.length > 0) {
          formattedItems += `${person}:\n`;
          
          tasks.forEach(task => {
            const statusIndicator = task.status === 'Completed' 
              ? '✅ [COMPLETED]' 
              : task.status === 'In Progress' 
                ? '🔄 [IN PROGRESS]' 
                : '⏳ [PENDING]';
            
            formattedItems += `- ${task.task} (Due: ${task.dueDate}) ${statusIndicator}\n`;
          });
          
          formattedItems += '\n';
        }
      });
      
      // For tasks that don't have an assignee
      const unassignedTasks = this.meetingData.actionItems.filter(item => !item.person || item.person.trim() === '');
      
      if (unassignedTasks.length > 0) {
        formattedItems += 'Unassigned Tasks:\n';
        unassignedTasks.forEach(task => {
          formattedItems += `- ${task.task} (Due: ${task.dueDate})\n`;
        });
        formattedItems += '\n';
      }
      
      // Update the email body
      const newBody = personalizedBody.replace(
        /Your action items:\n(.*?)(\n\nPlease)/s,
        `Task Assignments:\n\n${formattedItems.trim()}\n\nPlease`
      );
      
      this.emailBody = newBody;
    },
    
    // Legacy method - maintained for compatibility
    updateEmailBody() {
      if (this.emailRecipient) {
        if (this.emailRecipient === 'all') {
          this.selectAllRecipients();
        } else {
          this.selectedRecipients = [this.emailRecipient];
          this.updateEmailBodyForRecipient(this.emailRecipient);
        }
      }
    },
    
    startEditParticipant(index) {
      // Deep copy to avoid reference issues
      const participant = JSON.parse(JSON.stringify(this.meetingData.participants[index]));
      
      console.log(`Starting to edit participant ${participant.name} with email ${participant.email}`);
      
      this.editingParticipant = { 
        ...participant,
        index
      };
      
      // Access and ensure the email field is correctly set in the modal
      setTimeout(() => {
        const emailInput = document.querySelector('input[x-model="editingParticipant ? editingParticipant.email : \'\'"]');
        if (emailInput && this.editingParticipant) {
          emailInput.value = this.editingParticipant.email || '';
          console.log(`Set email input value to: ${emailInput.value}`);
        } else {
          console.warn("Could not find email input element");
        }
      }, 50);
    },
    
    saveParticipantEmail() {
      if (!this.editingParticipant) {
        console.error("No participant being edited");
        return;
      }
      
      console.log("Saving participant email:", this.editingParticipant);
      
      if (!this.validateEmail(this.editingParticipant.email)) {
        alert('Please enter a valid email address');
        return;
      }
      
      try {
        // Deep copy to avoid reference issues
        const updatedParticipant = JSON.parse(JSON.stringify(this.editingParticipant));
        const { index } = updatedParticipant;
        delete updatedParticipant.index;
        
        console.log("Updating participant at index:", index);
        console.log("Before update:", this.meetingData.participants[index]);
        
        // Create new array with updated reference to trigger reactivity
        const updatedParticipants = [...this.meetingData.participants];
        updatedParticipants[index] = updatedParticipant;
        
        // Replace entire participants array to ensure reactivity
        this.meetingData.participants = updatedParticipants;
        
        console.log("After update:", this.meetingData.participants[index]);
        console.log("Full participants array:", this.meetingData.participants);
        
        // Clear editing state
        this.editingParticipant = null;
        
        // Force update localStorage immediately
        this.saveChanges();
        
        // Double check localStorage save
        const resultId = new URLSearchParams(window.location.search).get('id');
        const savedData = localStorage.getItem(`meeting_result_${resultId}`);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log("Verification - data in localStorage:", parsedData.participants);
        }
        
        // Force Alpine to refresh the view by updating the refresh flag
        this.refreshFlag++;
        
        // Direct DOM manipulation to bypass Alpine caching
        // Find and update the email display for this participant directly in the DOM
        setTimeout(() => {
          try {
            const participantName = updatedParticipant.name;
            const participantEmail = updatedParticipant.email;
            
            // Find all elements that might contain this participant's email
            const emailElements = document.querySelectorAll('.text-xs');
            
            emailElements.forEach(element => {
              // Look for elements near the participant's name
              const nameElement = element.closest('li')?.querySelector('.font-medium');
              if (nameElement && nameElement.textContent.trim() === participantName) {
                // This is likely the element we want to update
                const emailElement = element.closest('li')?.querySelector('.text-gray-500.text-xs:last-child');
                if (emailElement) {
                  // Force update the content
                  emailElement.textContent = participantEmail;
                  console.log(`Directly updated email display for ${participantName} to ${participantEmail}`);
                }
              }
            });
          } catch (error) {
            console.warn("Error during direct DOM update:", error);
          }
        }, 10);
        
        // Show confirmation
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-50 text-green-700 p-3 rounded-lg shadow-lg border border-green-200 z-50';
        notification.innerHTML = 'Participant email updated successfully!';
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 3000);
        
        // Update email content if the participants are selected as recipients
        this.updateSelectedRecipientsEmail();
        
        // Force UI refresh for Alpine
        setTimeout(() => {
          this.refreshFlag++;
          
          // Try once more with a longer delay
          setTimeout(() => {
            this.refreshFlag++;
            // As a last resort, force a hard page reload if the UI still doesn't update
            // We could uncomment this if needed, but it's disruptive
            // window.location.reload();
          }, 500);
        }, 100);
      } catch (error) {
        console.error("Error saving participant email:", error);
        alert("Error saving participant data: " + error.message);
      }
    },
    
    cancelEditParticipant() {
      this.editingParticipant = null;
    },
    
    async sendEmail() {
      if (this.selectedRecipients.length === 0) {
        alert('Please select at least one recipient');
        return;
      }
      
      if (!this.senderEmail) {
        alert('Please enter your email address');
        return;
      }
      
      if (!this.validateEmail(this.senderEmail)) {
        alert('Please enter a valid email address');
        return;
      }
      
      // Using pre-configured EmailJS settings
      
      // Reset status
      this.sendingEmail = true;
      this.emailSent = false;
      this.emailError = null;
      
      try {
        // Make sure EmailJS is initialized
        if (typeof emailjs !== 'undefined' && emailjs.init) {
          try {
            // Re-initialize EmailJS with the configured key
            emailjs.init(EMAIL_PUBLIC_KEY);
            console.log('EmailJS re-initialized for sending');
          } catch (initError) {
            console.warn('EmailJS initialization warning:', initError);
            // Continue anyway, as the library might already be initialized
          }
        }
        
        // Get recipient email addresses with validation
        let recipients = [];
        const selectedParticipants = [];
        
        // Log for debugging purposes
        console.log("Selected recipients:", this.selectedRecipients);
        console.log("All participants:", this.meetingData.participants);
        
        for (const name of this.selectedRecipients) {
          const participant = this.meetingData.participants.find(p => p.name === name);
          console.log(`Looking for participant "${name}":`, participant);
          
          if (participant && participant.email && this.validateEmail(participant.email)) {
            recipients.push(participant.email);
            selectedParticipants.push(participant);
          } else {
            console.warn(`Invalid or missing email for participant "${name}"`);
          }
        }
        
        // Additional cleanup to ensure no empty strings
        recipients = recipients.filter(email => email && email.trim() !== '');
        
        if (recipients.length === 0) {
          throw new Error('No valid recipient email addresses found. Edit participant emails in the Summary tab.');
        }
        
        // Create template parameters - be explicit with each field
        // Examine EmailJS template parameters exactly as expected
        const recipientEmails = recipients.join(',');
        console.log("Final recipient list:", recipientEmails);
        
        const templateParams = {
          to_email: recipientEmails, // explicitly use the validated list
          to_name: this.selectedRecipients.join(', '),  // Include names as well
          from_name: this.senderName || this.senderEmail,
          from_email: this.senderEmail,
          subject: this.emailSubject,
          message: this.emailBody,
          meeting_title: this.meetingData.title || 'Meeting Summary',
          meeting_date: this.meetingData.date || new Date().toLocaleDateString(),
          recipient_name: recipients.length === 1 ? this.selectedRecipients[0] : 'All'
        };
        
        // Extra validation to ensure no undefined values
        Object.keys(templateParams).forEach(key => {
          if (templateParams[key] === undefined || templateParams[key] === null) {
            templateParams[key] = ''; // Replace null/undefined with empty string
          }
        });
        
        console.log('Sending email with parameters:', templateParams);
        
        // Additional validation before sending
        if (!recipientEmails || recipientEmails.trim() === '') {
          throw new Error('Recipients list is empty. Make sure participant emails are set correctly.');
        }
        
        // Log the exact recipient list for verification
        console.log("Final recipient list is:", recipientEmails);
        console.log("Recipient list length:", recipientEmails.length);
        console.log("First few characters:", recipientEmails.substring(0, 20));
        
        // Prepare data for direct API call - double check everything
        const emailData = {
          service_id: this.emailServiceId || EMAIL_SERVICE_ID,  // Fallback to constant if not set
          template_id: this.emailTemplateId || EMAIL_TEMPLATE_ID,
          user_id: EMAIL_PUBLIC_KEY,
          template_params: {
            ...templateParams,
            // Ensure critical parameters are set
            to_email: recipientEmails,  // Force this again
            from_email: this.senderEmail || 'noreply@example.com'
          }
        };
        
        console.log('Sending email with data:', JSON.stringify(emailData, null, 2));
        
        // Send email using direct API call
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Email API error:', errorText);
          throw new Error(`Email API returned ${response.status}: ${errorText}`);
        }
        
        console.log('Email sent successfully!');
        this.emailSent = true;
        
        // Create success notification element
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-50 text-green-700 p-3 rounded-lg shadow-lg border border-green-200 z-50 max-w-md';
        notification.innerHTML = `
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">Email Sent Successfully!</h3>
              <div class="mt-1 text-xs text-green-700">
                <p>Recipients: ${recipients.join(', ')}</p>
                <p class="mt-1">Email sent from ${this.senderEmail}</p>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 5000);
      } catch (error) {
        console.error('Error sending email:', error);
        this.emailError = error.message || 'Failed to send email';
        
        // Create error notification element
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-50 text-red-700 p-3 rounded-lg shadow-lg border border-red-200 z-50 max-w-md';
        notification.innerHTML = `
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Email Sending Failed</h3>
              <div class="mt-1 text-xs text-red-700">
                <p>${this.emailError}</p>
                <p class="mt-1">Please check your network connection and try again.</p>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 8000);
      } finally {
        this.sendingEmail = false;
      }
    },
    
    async sendTestEmail() {
      if (!this.senderEmail) {
        alert('Please enter your email address');
        return;
      }
      
      if (!this.validateEmail(this.senderEmail)) {
        alert('Please enter a valid email address');
        return;
      }
      
      // Using pre-configured EmailJS settings
      
      // Reset status
      this.sendingEmail = true;
      this.emailSent = false;
      this.emailError = null;
      
      try {
        // Make sure EmailJS is initialized
        if (typeof emailjs !== 'undefined' && emailjs.init) {
          try {
            // Re-initialize EmailJS with the configured key
            emailjs.init(EMAIL_PUBLIC_KEY);
            console.log('EmailJS re-initialized for sending');
          } catch (initError) {
            console.warn('EmailJS initialization warning:', initError);
            // Continue anyway, as the library might already be initialized
          }
        }
        
        // Validate sender email again to be sure
        if (!this.senderEmail || !this.validateEmail(this.senderEmail)) {
          throw new Error('Invalid sender email address. Please check your email address.');
        }
        
        // Send a test email to yourself with exhaustive parameters
        const templateParams = {
          to_email: this.senderEmail,
          to_name: this.senderName || this.senderEmail, // Include name for template
          from_name: this.senderName || this.senderEmail,
          from_email: this.senderEmail,
          subject: 'Meeting Maestro - Test Email',
          message: 'This is a test email from Meeting Maestro to verify that email sending is working correctly.',
          meeting_title: 'Test Meeting',
          meeting_date: new Date().toLocaleDateString(),
          recipient_name: this.senderName || 'there'
        };
        
        // Ensure no undefined values in the template
        Object.keys(templateParams).forEach(key => {
          if (templateParams[key] === undefined || templateParams[key] === null) {
            templateParams[key] = ''; // Replace null/undefined with empty string
          }
        });
        
        console.log('Sending test email with parameters:', templateParams);
        
        // Additional validation before sending
        if (!this.senderEmail || this.senderEmail.trim() === '') {
          throw new Error('Sender email is empty. Please provide a valid email address.');
        }
        
        // Log for verification
        console.log(`Sending test email to ${this.senderEmail}`);
        
        // Prepare data for direct API call - with extra verification
        const emailData = {
          service_id: this.emailServiceId || EMAIL_SERVICE_ID,
          template_id: this.emailTemplateId || EMAIL_TEMPLATE_ID,
          user_id: EMAIL_PUBLIC_KEY,
          template_params: {
            ...templateParams,
            // Force important fields again to ensure they're set
            to_email: this.senderEmail,
            from_email: this.senderEmail || 'noreply@example.com'
          }
        };
        
        console.log('Sending test email with data:', JSON.stringify(emailData, null, 2));
        
        // Send email using direct API call
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Email API error:', errorText);
          throw new Error(`Email API returned ${response.status}: ${errorText}`);
        }
        
        console.log('Test email sent successfully!');
        this.emailSent = true;
        
        // Create success notification element
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-50 text-green-700 p-3 rounded-lg shadow-lg border border-green-200 z-50 max-w-md';
        notification.innerHTML = `
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">Test Email Sent Successfully!</h3>
              <div class="mt-1 text-xs text-green-700">
                <p>Check your inbox at ${this.senderEmail}</p>
                <p class="mt-1">Email should arrive within a few minutes.</p>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 5000);
      } catch (error) {
        console.error('Error sending test email:', error);
        this.emailError = error.message || 'Failed to send test email';
        
        // Create error notification element
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-50 text-red-700 p-3 rounded-lg shadow-lg border border-red-200 z-50 max-w-md';
        notification.innerHTML = `
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Test Email Failed</h3>
              <div class="mt-1 text-xs text-red-700">
                <p>${this.emailError}</p>
                <p class="mt-1">Please check your EmailJS configuration and try again.</p>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 8000);
      } finally {
        this.sendingEmail = false;
      }
    },
    
    async sendAllEmails() {
      if (!this.senderEmail) {
        alert('Please enter your email address');
        return;
      }
      
      if (!this.validateEmail(this.senderEmail)) {
        alert('Please enter a valid email address');
        return;
      }
      
      // Using pre-configured EmailJS settings
      
      // Get all participants
      const participants = this.meetingData.participants;
      
      // Reset status
      this.sendingEmail = true;
      this.emailSent = false;
      this.emailError = null;
      
      try {
        // Make sure EmailJS is initialized
        if (typeof emailjs !== 'undefined' && emailjs.init) {
          try {
            // Re-initialize EmailJS with the configured key
            emailjs.init(EMAIL_PUBLIC_KEY);
            console.log('EmailJS re-initialized for sending');
          } catch (initError) {
            console.warn('EmailJS initialization warning:', initError);
            // Continue anyway, as the library might already be initialized
          }
        }
        
        let successCount = 0;
        const failedRecipients = [];
        
        // Send personalized emails to each participant
        for (const participant of participants) {
          if (!participant.email || !this.validateEmail(participant.email)) {
            failedRecipients.push(`${participant.name} (invalid email)`);
            continue;
          }
          
          // Create personalized email
          const personalized = this.createPersonalizedEmail(participant.name);
          
          // Validate the email first
          if (!participant.email || !this.validateEmail(participant.email)) {
            console.warn(`Invalid email for participant ${participant.name}: ${participant.email}`);
            failedRecipients.push(`${participant.name} (invalid email: ${participant.email || 'empty'})`);
            continue;
          }
          
          // Create template parameters with extensive validation
          const templateParams = {
            to_email: participant.email,
            to_name: participant.name || '',  // Make sure name is included
            from_name: this.senderName || this.senderEmail,
            from_email: this.senderEmail,
            subject: personalized.subject || `Meeting Summary: ${this.meetingData.title || 'Your Meeting'}`,
            message: personalized.body || 'Meeting summary and action items are attached.',
            meeting_title: this.meetingData.title || 'Meeting Summary',
            meeting_date: this.meetingData.date || new Date().toLocaleDateString(),
            recipient_name: participant.name || 'Team Member'
          };
          
          // Ensure no undefined/null values
          Object.keys(templateParams).forEach(key => {
            if (templateParams[key] === undefined || templateParams[key] === null) {
              templateParams[key] = ''; // Replace with empty string
            }
          });
          
          console.log(`Sending email to ${participant.name} (${participant.email}) with params:`, templateParams);
          
          try {
            // Double-check recipient email
            if (!participant.email || participant.email.trim() === '') {
              console.warn(`Empty email for participant ${participant.name} - skipping`);
              failedRecipients.push(`${participant.name} (empty email)`);
              continue;
            }
            
            // Prepare data for direct API call with explicit fields
            const emailData = {
              service_id: this.emailServiceId || EMAIL_SERVICE_ID,
              template_id: this.emailTemplateId || EMAIL_TEMPLATE_ID,
              user_id: EMAIL_PUBLIC_KEY,
              template_params: {
                ...templateParams,
                // Force important fields again
                to_email: participant.email,
                from_email: this.senderEmail || 'noreply@example.com'
              }
            };
            
            // Send email using direct API call
            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(emailData)
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Email API error for ${participant.name}:`, errorText);
              throw new Error(`Email API returned ${response.status}: ${errorText}`);
            }
            
            successCount++;
          } catch (error) {
            console.error(`Error sending email to ${participant.name}:`, error);
            failedRecipients.push(participant.name);
          }
        }
        
        if (successCount > 0) {
          this.emailSent = true;
          let message = `Successfully sent ${successCount} of ${participants.length} emails`;
          
          if (failedRecipients.length > 0) {
            message += `\nFailed to send to: ${failedRecipients.join(', ')}`;
          }
          
          alert(message);
        } else {
          throw new Error('Failed to send any emails');
        }
      } catch (error) {
        console.error('Error sending emails:', error);
        this.emailError = error.message || 'Failed to send emails';
        
        // Create error notification element
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-50 text-red-700 p-3 rounded-lg shadow-lg border border-red-200 z-50 max-w-md';
        notification.innerHTML = `
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Email Sending Failed</h3>
              <div class="mt-1 text-xs text-red-700">
                <p>${this.emailError}</p>
                <p class="mt-1">Please check your network connection and try again.</p>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 8000);
      } finally {
        this.sendingEmail = false;
      }
    },
    
    createPersonalizedEmail(recipient) {
      // Clone the current email body
      let personalizedBody = this.emailBody.replace(/\[Recipient\]/g, recipient);
      
      // Update action items section to only include items for this recipient
      const actionItemsText = this.getRecipientActionItems(recipient)
        .map(item => `- ${item.task} (Due: ${item.dueDate})`)
        .join('\n');
      
      const newBody = personalizedBody.replace(
        /Your action items:\n(.*?)(\n\nPlease)/s,
        `Your action items:\n${actionItemsText}\n\nPlease`
      );
      
      return {
        subject: this.emailSubject,
        body: newBody
      };
    },
    
    validateEmail(email) {
      const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(String(email).toLowerCase());
    },
    
    // Task management functions
    startEditItem(index) {
      this.editingItem = { ...this.meetingData.actionItems[index], index };
    },
    
    saveEditItem() {
      if (!this.editingItem) return;
      
      // Store previous person for comparison
      const previousPerson = this.meetingData.actionItems[this.editingItem.index].person;
      const newPerson = this.editingItem.person;
      
      // Apply the changes
      const { index, ...item } = this.editingItem;
      this.meetingData.actionItems[index] = { 
        ...item,
        editing: false
      };
      this.editingItem = null;
      
      // Update localStorage to persist changes
      this.saveChanges();
      
      // Force Alpine to refresh the view
      this.refreshFlag++;
      
      // Show notification
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-green-50 text-green-700 p-3 rounded-lg shadow-lg border border-green-200 z-50';
      
      if (previousPerson !== newPerson) {
        notification.innerHTML = `Task reassigned from <strong>${previousPerson}</strong> to <strong>${newPerson}</strong>`;
      } else {
        notification.innerHTML = 'Task updated successfully!';
      }
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
      
      // Update the email content if we're in the email tab or the task assignment changed
      if (this.activeTab === 'followUp' || previousPerson !== newPerson) {
        this.updateSelectedRecipientsEmail();
      }
    },
    
    cancelEditItem() {
      this.editingItem = null;
    },
    
    addNewTask() {
      const newTask = {
        person: '',
        task: 'New task',
        dueDate: this.formatDate(new Date()),
        status: 'Pending',
        editing: true
      };
      
      this.meetingData.actionItems.push(newTask);
      this.editingItem = { ...newTask, index: this.meetingData.actionItems.length - 1 };
    },
    
    updateTaskStatus(index, status) {
      this.meetingData.actionItems[index].status = status;
      this.saveChanges();
    },
    
    saveChanges() {
      try {
        // Save changes back to localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const resultId = urlParams.get('id');
        
        if (!resultId) {
          console.error("No result ID found in URL, cannot save changes");
          return false;
        }
        
        console.log("Saving changes to localStorage with ID:", resultId);
        
        // Create a clean copy to avoid circular references
        const dataCopy = JSON.parse(JSON.stringify(this.meetingData));
        console.log("Data to save:", dataCopy);
        
        // Explicitly check participant data before saving
        if (dataCopy.participants) {
          console.log("Participants being saved:", dataCopy.participants);
          
          // Ensure all participant objects have valid properties
          dataCopy.participants = dataCopy.participants.map(p => {
            return {
              name: p.name || '',
              role: p.role || '',
              email: p.email || ''
              // Only include needed fields to avoid bloat
            };
          });
        }
        
        // Serialize and save
        const serializedData = JSON.stringify(dataCopy);
        localStorage.setItem(`meeting_result_${resultId}`, serializedData);
        
        // Verify the save worked
        const saved = localStorage.getItem(`meeting_result_${resultId}`);
        if (saved) {
          console.log("Data successfully saved to localStorage");
          
          // Verify participant data specifically 
          try {
            const parsedSaved = JSON.parse(saved);
            if (parsedSaved.participants) {
              console.log("Verification - Participants in localStorage:", parsedSaved.participants);
            }
          } catch (parseError) {
            console.error("Error parsing saved data during verification:", parseError);
          }
          
          return true;
        } else {
          console.error("Failed to save data to localStorage");
          return false;
        }
      } catch (error) {
        console.error("Error saving changes:", error);
        return false;
      }
    },
    
    formatDate(date) {
      const d = new Date(date);
      const month = '' + (d.getMonth() + 1);
      const day = '' + d.getDate();
      const year = d.getFullYear();
      
      return [month.padStart(2, '0'), day.padStart(2, '0'), year].join('/');
    },
    
    getParticipantNames() {
      if (!this.meetingData || !this.meetingData.participants) {
        return [];
      }
      return this.meetingData.participants.map(p => p.name);
    },
    
    determineTaskStatus(item) {
      try {
        // Default status is Pending
        let status = 'Pending';
        
        // Check if the task description contains any completion indicators
        const completionTerms = ['completed', 'done', 'finished', 'delivered', 'submitted', 'resolved'];
        const inProgressTerms = ['working on', 'in progress', 'started', 'began', 'initiated', 'ongoing'];
        
        // Check for completion terms in the task
        if (completionTerms.some(term => item.task.toLowerCase().includes(term))) {
          status = 'Completed';
        }
        // Check for in-progress terms
        else if (inProgressTerms.some(term => item.task.toLowerCase().includes(term))) {
          status = 'In Progress';
        }
        
        // Check due date if available
        if (item.dueDate) {
          const today = new Date();
          let dueDate;
          
          // Try to parse the date
          try {
            // Try MM/DD/YYYY format
            const parts = item.dueDate.split('/');
            if (parts.length === 3) {
              dueDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
            }
          } catch (e) {
            console.log("Could not parse due date:", item.dueDate);
          }
          
          // If due date is in the past and status is Pending, change to In Progress
          if (dueDate && dueDate < today && status === 'Pending') {
            status = 'In Progress';
          }
        }
        
        return status;
      } catch (error) {
        console.error('Error determining task status:', error);
        return 'Pending'; // Default to Pending if any error occurs
      }
    }
  }));
});