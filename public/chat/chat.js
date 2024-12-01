const today = new Date();
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log('User Timezone:', userTimeZone);
const formattedToday = today.toLocaleString('en-US', { timeZone: userTimeZone }).replace(',', '');    

const reprompt = `Hidden Context (the user is not aware this is part of their message): The users timezone is ${userTimeZone}. The current date/time is ${formattedToday}.`;

async function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        // Remove initial content
        if (initialContent) {
            initialContent.remove();
        }

        // Add user message
        // const userMessage = document.createElement('div');
        // userMessage.classList.add('message', 'user-message');
        // userMessage.textContent = message;
        // chatContent.appendChild(userMessage);
        displayMessage(message, 'user-message');


        // Clear input
        messageInput.value = '';

        // Fetch session_id from localStorage
        const session_id = localStorage.getItem('session_id');
        const userId = localStorage.getItem('userId');
        
        // Prepare request body
        const requestBody = {
            session_id: session_id,
            user_id: userId,
            message: message + reprompt,
            tools: tools // Assuming tools is a global variable
        };

        try {
            // Make POST request to /ai/chat endpoint
            const response = await fetch('/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (data.finish_reason === 'stop') {
                // Display AI response
                displayMessage(data.response, 'ai-message');
            } else if (data.finish_reason === 'tool_calls') {
                // Log tool calls
                console.log(data);
                handleToolCalls(data);
            }

            chatContent.scrollTop = chatContent.scrollHeight;
        } catch (error) {
            console.error('Error fetching AI response:', error);
        }
    }
}

function handleSuggestionCardClick(event) {
    const card = event.currentTarget;
    const suggestionText = card.querySelector('p').textContent;
    
    // Remove initial content
    if (initialContent) {
        initialContent.remove();
    }

    // Display user message
    displayMessage(suggestionText, 'user-message');

    // Send message to AI
    const session_id = localStorage.getItem('session_id');
    const userId = localStorage.getItem('userId');
    
    const requestBody = {
        session_id: session_id,
        user_id: userId,
        message: suggestionText + reprompt,
        tools: tools
    };

    fetch('/ai/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => response.json())
    .then(data => {
        if (data.finish_reason === 'stop') {
            displayMessage(data.response, 'ai-message');
        } else if (data.finish_reason === 'tool_calls') {
            console.log(data);
            handleToolCalls(data);
        }
        chatContent.scrollTop = chatContent.scrollHeight;
    })
    .catch(error => console.error('Error fetching AI response:', error));
}

const cards = document.querySelectorAll('.card');
cards.forEach(card => {
    card.addEventListener('click', handleSuggestionCardClick);
});