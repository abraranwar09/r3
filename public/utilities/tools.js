//initialize tools array
const tools = [
    // {
    //     type: "function",
    //     function: {
    //         name: "open_google",
    //         description: "open google in a new tab with a specific search query",
    //         parameters: {
    //             type: "object",
    //             properties: {
    //                 query: { type: "string", description: "The search query to open google with" }
    //             }
    //         }
    //     }
    // },
    {
        type: "function",
        function: {
            name: "getCalendarEvents",
            description: "You can use the Google API to fetch the user's events based on time period.",
            parameters: {
                type: "object",
                properties: {
                    timePeriod: {
                        type: "string",
                        description: "Allows you to control the time period of events retrieved. All values include today.",
                        enum: ["last 30 days", "last week", "today", "next week", "next 30 days"],
                    },
                    query: {
                        type: "string",
                        description: "The query the user is asking about his past events.",
                    },
                },
                required: ["timePeriod", "query"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "saveEvent",
            description: "Saves an event to the user's Google Calendar.",
            parameters: {
                type: "object",
                properties: {
                    summary: {
                        type: "string",
                        description: "The title or summary of the event.",
                    },
                    location: {
                        type: "string",
                        description: "The location where the event will take place.",
                    },
                    description: {
                        type: "string",
                        description: "A detailed description of the event.",
                    },
                    start: {
                        type: "string",
                        description: "The start date and time of the event in ISO 8601 format.",
                    },
                    end: {
                        type: "string",
                        description: "The end date and time of the event in ISO 8601 format.",
                    },
                },
                required: ["summary", "location", "description", "start", "end"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "listGmailMessages",
            description: "Fetches a list of Gmail messages based on the specified query parameters.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search query to filter Gmail messages.",
                    },
                    maxResults: {
                        type: "integer",
                        description: "The maximum number of messages to retrieve.",
                    }
                },
                required: ["query"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "getGmailMessage",
            description: "Fetches details of a specific Gmail message using its messageId. Use this tool only when the user provides a messageId and explicitly asks for Gmail message details.",
            parameters: {
                type: "object",
                properties: {
                    messageId: {
                        type: "string",
                        description: "The ID of the Gmail message to retrieve.",
                    },
                },
                required: ["messageId"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "sendGmailMessage",
            description: "Sends an email through Gmail with the specified parameters.",
            parameters: {
                type: "object",
                properties: {
                    to: {
                        type: "string",
                        description: "Email address of the recipient.",
                    },
                    subject: {
                        type: "string",
                        description: "Subject line of the email.",
                    },
                    body: {
                        type: "string",
                        description: "Content of the email message.",
                    },
                    cc: {
                        type: "string",
                        description: "Email addresses to CC (comma-separated). Send empty string if not needed.",
                    },
                    bcc: {
                        type: "string",
                        description: "Email addresses to BCC (comma-separated). Send empty string if not needed.",
                    },
                    isHtml: {
                        type: "boolean",
                        description: "Whether the email body contains HTML formatting. Send false if not needed.",
                    },
                },
                required: ["to", "subject", "body"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "performGoogleSearch",
            description: "Perform a Google Search with the specified query.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "The search query to perform a Google Custom Search with" }
                }
            }
        }
    }
];
