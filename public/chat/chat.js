const today = new Date();
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log('User Timezone:', userTimeZone);
const formattedToday = today.toLocaleString('en-US', { timeZone: userTimeZone }).replace(',', '');    

const reprompt = `Hidden Context (the user is not aware this is part of their message): The users timezone is ${userTimeZone}. The current date/time is ${formattedToday}.`;

function getActiveToolTypes() {
    const activeToggles = document.querySelectorAll('.toggle.active, .tool-toggle.active');
    return Array.from(activeToggles).map(toggle => toggle.dataset.tool);
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        if (initialContent) {
            initialContent.remove();
        }

        displayMessage(message, 'user-message');
        messageInput.value = '';

        const skeletonLoader = document.createElement('div');
        skeletonLoader.className = 'skeleton-message';
        skeletonLoader.innerHTML = `
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
        `;
        chatContent.appendChild(skeletonLoader);

        const session_id = localStorage.getItem('session_id');
        const userId = localStorage.getItem('userId');
        
        const activeToolTypes = getActiveToolTypes();
        const activeTools = window.toolsModule.getActiveTools(activeToolTypes);

        // Create tool states map
        const toolStates = {};
        document.querySelectorAll('.tool-toggle').forEach(toggle => {
            const toolType = toggle.getAttribute('data-tool');
            toolStates[toolType] = toggle.classList.contains('active');
        });

        const requestBody = {
            session_id: session_id,
            user_id: userId,
            message: message + reprompt,
            tools: activeTools,
            tool_states: toolStates
        };

        try {
            const response = await fetch('/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            
            if (data.finish_reason === 'stop') {
                skeletonLoader.remove();
                displayMessage(data.response, 'ai-message');
            } else if (data.finish_reason === 'tool_calls') {
                console.log(data);
                handleToolCalls(data);
            }

            chatContent.scrollTop = chatContent.scrollHeight;
        } catch (error) {
            skeletonLoader.remove();
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