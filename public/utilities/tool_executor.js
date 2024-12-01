//function to submit tool calls

async function submitToolCall(session_id, tool_call_id, function_name, function_response) {
    const url = '/ai/tool-response';
    const body = {
        session_id: session_id,
        tool_call_id: tool_call_id,
        function_name: function_name,
        function_response: function_response
    };

    console.log(body);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error submitting tool call:', error);
        throw error;
    }
}

// main tools

//test tool to open google search in a new tab
async function openGoogle(query, functionName, toolCallId) {
    console.log(query);
    // Open new tab with Google search
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
    console.log(`Google search opened with query: ${query}`);

    const sessionId = localStorage.getItem('session_id');

    const toolCallResults = {
        "status": "success",
        "message": `Google search completed for ${query}`
    };

    let data = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
    displayMessage(data.response, 'ai-message');
}

// Function to get calendar events
async function getCalendarEvents(timePeriod, query, functionName, toolCallId) {
    const authToken = localStorage.getItem('authToken');
    const calendarId = localStorage.getItem('email');
    const sessionId = localStorage.getItem('session_id');
    const userId = localStorage.getItem('userId');

    console.log(authToken);

    //get todays date
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    const response = await fetch("/google/calendar/events", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            accessToken: authToken,
            calendarId: calendarId,
            timePeriod: timePeriod,
            userId: userId
        })
    });

    if (!response.ok) {
        const toolCallResults = {
            "status": "error",
            "message": `There was an error getting your calendar events. Please try again later or check your config.`
        };

        let toolCallResponse = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
        console.log('toolCallResponse', toolCallResponse);
        displayMessage(toolCallResponse.response, 'ai-message');
        return;
    }

    const data = await response.json();
    console.log(data);

    const toolCallResults = data;

    let toolCallResponse = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
    console.log('toolCallResponse', toolCallResponse);
    const skeletonLoader = document.querySelector('.skeleton-message');
    if (skeletonLoader) skeletonLoader.remove();
    displayMessage(toolCallResponse.response, 'ai-message');
}

//function to save calendar events
// Function to save a calendar event
async function saveEvent(summary, location, description, start, end, functionName, toolCallId) {
    const accessToken = localStorage.getItem('authToken');
    const calendarId = localStorage.getItem('email');
    const sessionId = localStorage.getItem('session_id');
    const userId = localStorage.getItem('userId');

    const response = await fetch("/google/calendar/save-event", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            accessToken: accessToken,
            calendarId: calendarId,
            summary: summary,
            location: location,
            description: description,
            start: start,
            end: end,
            userId: userId
        })
    });

    if (!response.ok) {
        const toolCallResults = {
            "status": "error",
            "message": `There was an error saving your calendar event. Please try again later or check your config.`
        };

        let toolCallResponse = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
        console.log('toolCallResponse', toolCallResponse);
        displayMessage(toolCallResponse.response, 'ai-message');
        return;
    }

    const data = await response.json();
    console.log(data);

    const toolCallResults = data;

    let toolCallResponse = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
    console.log('toolCallResponse', toolCallResponse);
    const skeletonLoader = document.querySelector('.skeleton-message');
    if (skeletonLoader) skeletonLoader.remove();
    displayMessage(toolCallResponse.response, 'ai-message');
}

// Function to list Gmail messages
async function listGmailMessages(maxResults, query, functionName, toolCallId) {
    const accessToken = localStorage.getItem('authToken');
    const sessionId = localStorage.getItem('session_id');
    const userId = localStorage.getItem('userId');

    try {
        const response = await fetch("/google/gmail/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                accessToken,
                maxResults,
                query,
                userId
            })
        });

        if (!response.ok) {
            const toolCallResults = {
                "status": "error",
                "message": `There was an error listing your emails. Please try again later or check your config.`
            };
    
            let toolCallResponse = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
            console.log('toolCallResponse', toolCallResponse);
            displayMessage(toolCallResponse.response, 'ai-message');
            return;
        }

        const data = await response.json();
        console.log(data);
        const toolCallResults = {
            "emails": data
        };

        let toolCallResponse = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
        console.log('toolCallResponse', toolCallResponse);
        const skeletonLoader = document.querySelector('.skeleton-message');
        if (skeletonLoader) skeletonLoader.remove();
        displayMessage(toolCallResponse.response, 'ai-message');
        
        } catch (error) {
        console.error('Error fetching emails:', error);
        const toolCallResults = {
            "status": "error",
            "message": `There was an error listing your emails. Please try again later or check your config.`
        };

        let toolCallResponse = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
        console.log('toolCallResponse', toolCallResponse);
        displayMessage(toolCallResponse.response, 'ai-message');
        return;
    }
}

// Function to get specific Gmail message details
async function getGmailMessage(messageId, functionName, toolCallId) {
    const accessToken = localStorage.getItem('authToken');
    const sessionId = localStorage.getItem('session_id');
    const userId = localStorage.getItem('userId');

    try {
        const response = await fetch(`/google/gmail/message/${messageId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                accessToken,
                userId
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const toolCallResults = data;

        let toolCallResponse = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
        console.log('toolCallResponse', toolCallResponse);
        const skeletonLoader = document.querySelector('.skeleton-message');
        if (skeletonLoader) skeletonLoader.remove();
        displayMessage(toolCallResponse.response, 'ai-message');

    } catch (error) {
        console.error('Error fetching email details:', error);
        const toolCallResults = {
            "status": "error",
            "message": `There was an error listing your emails. Please try again later or check your config.`
        };

        let toolCallResponse = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
        console.log('toolCallResponse', toolCallResponse);
        displayMessage(toolCallResponse.response, 'ai-message');
        return;
    }
}

// Function to send Gmail message
async function sendGmailMessage(to, subject, body, cc, bcc, isHtml, functionName, toolCallId) {
    const accessToken = localStorage.getItem('authToken');
    const sessionId = localStorage.getItem('session_id');
    const userId = localStorage.getItem('userId');

    try {
        const response = await fetch("/google/gmail/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                accessToken: accessToken,
                to: to,
                subject: subject,
                body: body,
                // cc: cc,
                // bcc: bcc,
                isHtml: isHtml,
                userId: userId
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const toolCallResults = data;

        let toolCallResponse = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
        console.log('toolCallResponse', toolCallResponse);
        const skeletonLoader = document.querySelector('.skeleton-message');
        if (skeletonLoader) skeletonLoader.remove();
        displayMessage(toolCallResponse.response, 'ai-message');


    } catch (error) {
        console.error('Error sending email:', error);
        const toolCallResults = {
            "status": "error",
            "message": `There was an error sending your email. Please try again later or check your config.`
        };

        let toolCallResponse = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
        console.log('toolCallResponse', toolCallResponse);
        displayMessage(toolCallResponse.response, 'ai-message');
        return;
    }
}

// Function to perform Google Custom Search
async function performGoogleSearch(query, functionName, toolCallId) {
    const sessionId = localStorage.getItem('session_id');
    const userId = localStorage.getItem('userId');

    try {
        const response = await fetch("/google/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query,
                userId
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const toolCallResults = data;

        let toolCallResponse = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
        console.log('toolCallResponse', toolCallResponse);
        const skeletonLoader = document.querySelector('.skeleton-message');
        if (skeletonLoader) skeletonLoader.remove();
        displayMessage(toolCallResponse.response, 'ai-message');

    } catch (error) {
        console.error('Error performing Google search:', error);
        const toolCallResults = {
            "status": "error",
            "message": `There was an error performing the Google search. Please try again later.`
        };

        let toolCallResponse = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
        console.log('toolCallResponse', toolCallResponse);
        displayMessage(toolCallResponse.response, 'ai-message');
        return;
    }
}

async function usePerplexity(query, functionName, toolCallId) {
    const sessionId = localStorage.getItem('session_id');
    const userId = localStorage.getItem('userId');

    try {
        const response = await fetch("/perplexity/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                query,
                userId 
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const toolCallResults = data;

        let toolCallResponse = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
        console.log('toolCallResponse', toolCallResponse);
        const skeletonLoader = document.querySelector('.skeleton-message');
        if (skeletonLoader) skeletonLoader.remove();
        displayMessage(toolCallResponse.response, 'ai-message');

    } catch (error) {
        console.error('Error using Perplexity:', error);
        const toolCallResults = {
            "status": "error",
            "message": `There was an error performing the Perplexity search. Please try again later.`
        };

        let toolCallResponse = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
        console.log('toolCallResponse', toolCallResponse);
        displayMessage(toolCallResponse.response, 'ai-message');
        return;
    }
}

//function to check knowledge base
async function checkKnowledgeBase(query, functionName, toolCallId) {
    const sessionId = localStorage.getItem('session_id');
    const userId = localStorage.getItem('userId');

    try {
        const response = await fetch("https://coreapi.inovasolutions.ai/v1/workflows/run", {
            method: "POST",
            headers: {
                "Authorization": "Bearer app-X8irMeOKWmXoKymsp1sJqXku",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: {
                    query: query
                },
                response_mode: "blocking",
                user: userId
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const toolCallResults = data;

        let toolCallResponse = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
        console.log('toolCallResponse', toolCallResponse);
        const skeletonLoader = document.querySelector('.skeleton-message');
        if (skeletonLoader) skeletonLoader.remove();
        displayMessage(toolCallResponse.response, 'ai-message');

    } catch (error) {
        console.error('Error checking knowledge base:', error);
        const toolCallResults = {
            "status": "error",
            "message": `There was an error checking the knowledge base. Please try again later.`
        };

        let toolCallResponse = await submitToolCall(sessionId, toolCallId, functionName, toolCallResults);
        console.log('toolCallResponse', toolCallResponse);
        displayMessage(toolCallResponse.response, 'ai-message');
        return;
    }
}









