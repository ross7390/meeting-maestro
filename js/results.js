// Results page JavaScript - simplified non-module approach

document.addEventListener('alpine:init', () => {
  Alpine.data('resultsHandler', () => ({
    activeTab: 'summary',
    loading: true,
    error: null,
    meetingData: null,
    emailRecipient: '',
    emailSubject: '',
    emailBody: '',
    senderEmail: '',
    editingItem: null,
    selectedRecipients: [], // For multi-select email recipients
    
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
        this.meetingData = JSON.parse(storedData);
        console.log("Meeting data loaded:", this.meetingData);
        
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
      
      // Update action items section to only include items for this recipient
      const actionItemsText = this.getRecipientActionItems(recipient)
        .map(item => `- ${item.task} (Due: ${item.dueDate})${item.status !== 'Pending' ? ' [' + item.status + ']' : ''}`)
        .join('\n');
      
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
      
      // Collect action items for all selected recipients
      let allActionItems = [];
      
      this.selectedRecipients.forEach(recipient => {
        const items = this.getRecipientActionItems(recipient);
        items.forEach(item => {
          allActionItems.push({
            person: recipient,
            task: item.task,
            dueDate: item.dueDate,
            status: item.status
          });
        });
      });
      
      // Format action items grouped by person
      let actionItemsByPerson = {};
      allActionItems.forEach(item => {
        if (!actionItemsByPerson[item.person]) {
          actionItemsByPerson[item.person] = [];
        }
        actionItemsByPerson[item.person].push(item);
      });
      
      let formattedItems = '';
      
      for (const person in actionItemsByPerson) {
        formattedItems += `${person}:\n`;
        formattedItems += actionItemsByPerson[person]
          .map(item => `- ${item.task} (Due: ${item.dueDate})${item.status !== 'Pending' ? ' [' + item.status + ']' : ''}`)
          .join('\n');
        formattedItems += '\n\n';
      }
      
      // Update the email body
      const newBody = personalizedBody.replace(
        /Your action items:\n(.*?)(\n\nPlease)/s,
        `Action items by person:\n\n${formattedItems.trim()}\n\nPlease`
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
    
    sendEmail() {
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
      
      // This is a demo app, so we'll just show an alert
      alert(`Email would be sent to ${this.selectedRecipients.join(', ')} from ${this.senderEmail}`);
      
      // In a real application, you would send the email using a server-side API
      console.log('Email details:', {
        sender: this.senderEmail,
        recipients: this.selectedRecipients,
        subject: this.emailSubject,
        body: this.emailBody
      });
    },
    
    sendAllEmails() {
      if (!this.senderEmail) {
        alert('Please enter your email address');
        return;
      }
      
      if (!this.validateEmail(this.senderEmail)) {
        alert('Please enter a valid email address');
        return;
      }
      
      // Get all participants
      const participants = this.meetingData.participants.map(p => p.name);
      this.selectedRecipients = participants;
      
      // Create personalized emails for each participant
      const emails = participants.map(participant => {
        // Get personalized email for this participant
        const personalized = this.createPersonalizedEmail(participant);
        return {
          recipient: participant,
          ...personalized
        };
      });
      
      // Show success message
      alert(`${emails.length} emails would be sent to all participants from ${this.senderEmail}`);
      console.log('All emails:', emails);
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
      
      const { index, ...item } = this.editingItem;
      this.meetingData.actionItems[index] = { 
        ...item,
        editing: false
      };
      this.editingItem = null;
      
      // Update localStorage to persist changes
      this.saveChanges();
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
      // Save changes back to localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const resultId = urlParams.get('id');
      
      if (resultId) {
        localStorage.setItem(`meeting_result_${resultId}`, JSON.stringify(this.meetingData));
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