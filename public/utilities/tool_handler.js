async function handleToolCalls(data) {
    if (data.finish_reason === 'tool_calls') {
        console.log(data.tool_calls[0].function.name);
        const functionName = data.tool_calls[0].function.name;
        const args = JSON.parse(data.tool_calls[0].function.arguments);

        switch (functionName) {
            case 'open_google':
                openGoogle(args.query, functionName, data.tool_calls[0].id);
                break;
            case 'generateProfile':
                generateProfile(args.taskDescription, args.industry, args.additionalRequirements, args.model, functionName, data.tool_calls[0].id);
                break;
            case 'getCalendarEvents':
                getCalendarEvents(args.timePeriod, args.query, functionName, data.tool_calls[0].id);
                break;
            case 'saveEvent':
                saveEvent(args.summary, args.location, args.description, args.start, args.end, functionName, data.tool_calls[0].id);
                break;
            case 'listGmailMessages':
                listGmailMessages(args.maxResults, args.query, functionName, data.tool_calls[0].id);
                break;
            case 'getGmailMessage':
                getGmailMessage(args.messageId, functionName, data.tool_calls[0].id);
                break;
            case 'sendGmailMessage':
                sendGmailMessage(args.to, args.subject, args.body, args.cc, args.bcc, args.isHtml, functionName, data.tool_calls[0].id);
                break;
            case 'performGoogleSearch':
                performGoogleSearch(args.query, functionName, data.tool_calls[0].id);
                break;
            default:
                console.warn(`Unhandled function name: ${functionName}`);
        }
    }
}
