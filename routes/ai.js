const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const mongoose = require('mongoose');
const { generateChatName } = require('../utils/nameGenerator');


// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});   

// Define Chat History Schema
const messageSchema = new mongoose.Schema({
    role: String,
    content: String,
    name: String,
    function_call: mongoose.Schema.Types.Mixed,
    tool_calls: [mongoose.Schema.Types.Mixed],
    tool_call_id: String
}, { _id: false });

const chatHistorySchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    session_id: { type: String, required: true, unique: true },
    name: { type: String },
    messages: [messageSchema],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    tool_states: { type: Map, of: Boolean, default: new Map() }
});

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

// Middleware to parse JSON bodies
router.use(express.json());

// Chat endpoint
router.post('/chat', async (req, res) => {
    try {
        const { message, session_id, tools, user_id, tool_states } = req.body;

        if (!message || !user_id) {
            return res.status(400).json({
                error: 'Message and user_id are required'
            });
        }

        // Find or create chat history
        let chatHistory = await ChatHistory.findOne({ session_id, user_id });
        if (!chatHistory) {
            const chatName = await generateChatName(message);
            chatHistory = new ChatHistory({ 
                user_id,
                session_id,
                name: chatName,
                tool_states: new Map(Object.entries(tool_states || {})),
                messages: [{"role": "system", "content": `
                            You are a helpful assistant. You can use your tools to help the user with their queries.
                            Format your responses as structured HTML with the appropriate tags and styling like lists, paragraphs, etc. 
                            Only respond in HTML no markdown. You have the ability to run tool calls. Do not run parallel tool calls, but you can respond to a tool call
                            with another tool call if you want to chain tool calls.
                            `}]
            });
        } else {
            // Update tool states
            chatHistory.tool_states = new Map(Object.entries(tool_states || {}));
        }

        // Add user message to history
        chatHistory.messages.push({
            role: 'user',
            content: message
        });

        // Clean messages before sending to OpenAI
        const cleanedMessages = chatHistory.messages.map(msg => {
            const cleanMsg = {
                role: msg.role,
                content: msg.content
            };
            
            // Only include additional fields if they have values
            if (msg.name) cleanMsg.name = msg.name;
            if (msg.function_call) cleanMsg.function_call = msg.function_call;
            if (msg.tool_calls && msg.tool_calls.length > 0) {
                cleanMsg.tool_calls = msg.tool_calls;
            }
            if (msg.tool_call_id) cleanMsg.tool_call_id = msg.tool_call_id;
            
            return cleanMsg;
        });

        // Prepare messages for OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: cleanedMessages,
            temperature: 0.7,
            ...(tools && tools.length > 0 ? {
                tools: tools,
                parallel_tool_calls: false
            } : {})
        });

        // Get the assistant's response and completion details
        const assistantResponse = completion.choices[0].message;
        const finishReason = completion.choices[0].finish_reason;

        // Add assistant response to history
        chatHistory.messages.push(assistantResponse);

        // Update timestamp
        chatHistory.updated_at = new Date();

        // Save to database
        await chatHistory.save();

        // Prepare response based on finish_reason
        const responseData = {
            session_id,
            finish_reason: finishReason
        };

        if (finishReason === 'tool_calls') {
            responseData.tool_calls = assistantResponse.tool_calls;
            responseData.response = null; // No content when it's a tool call
        } else {
            responseData.response = assistantResponse.content;
            responseData.tool_calls = null;
        }

        // Send response
        res.json(responseData);

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Tool call response endpoint
router.post('/tool-response', async (req, res) => {
    try {
        const { session_id, tool_call_id, function_name, function_response, tools } = req.body;

        if (!session_id || !tool_call_id || !function_name || !function_response) {
            return res.status(400).json({ 
                error: 'Missing required fields: session_id, tool_call_id, function_name, function_response' 
            });
        }

        // Find chat history
        let chatHistory = await ChatHistory.findOne({ session_id });
        if (!chatHistory) {
            return res.status(404).json({ error: 'Chat history not found' });
        }

        // Add tool response message to history
        chatHistory.messages.push({
            role: 'tool',
            content: typeof function_response === 'string' 
                ? function_response 
                : JSON.stringify(function_response),
            name: function_name,
            tool_call_id: tool_call_id
        });

        // Clean messages before sending to OpenAI
        const cleanedMessages = chatHistory.messages.map(msg => {
            const cleanMsg = {
                role: msg.role,
                content: msg.content
            };
            
            if (msg.name) cleanMsg.name = msg.name;
            if (msg.function_call) cleanMsg.function_call = msg.function_call;
            if (msg.tool_calls && msg.tool_calls.length > 0) {
                cleanMsg.tool_calls = msg.tool_calls;
            }
            if (msg.tool_call_id) cleanMsg.tool_call_id = msg.tool_call_id;
            
            return cleanMsg;
        });

        // Get OpenAI's response to the tool result
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: cleanedMessages,
            temperature: 0.7,
            ...(tools && tools.length > 0 ? {
                tools: tools,
                parallel_tool_calls: false
            } : {})
        });

        // Get the assistant's response and completion details
        const assistantResponse = completion.choices[0].message;
        const finishReason = completion.choices[0].finish_reason;

        // Add assistant response to history
        chatHistory.messages.push(assistantResponse);

        // Update timestamp
        chatHistory.updated_at = new Date();

        // Save to database
        await chatHistory.save();

        // Prepare response based on finish_reason
        const responseData = {
            session_id,
            finish_reason: finishReason
        };

        if (finishReason === 'tool_calls') {
            responseData.tool_calls = assistantResponse.tool_calls;
            responseData.response = null;
        } else {
            responseData.response = assistantResponse.content;
            responseData.tool_calls = null;
        }

        // Send response
        res.json(responseData);

    } catch (error) {
        console.error('Tool Response API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get chat history endpoint
router.get('/history/:session_id', async (req, res) => {
    try {
        const { session_id } = req.params;
        const chatHistory = await ChatHistory.findOne({ session_id });
        
        if (!chatHistory) {
            return res.status(404).json({ error: 'Chat history not found' });
        }

        res.json(chatHistory);
    } catch (error) {
        console.error('History API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/history/list/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const chatHistories = await ChatHistory.find({ user_id })
            .sort({ updated_at: -1 });  // Sort by updated_at in descending order

        if (!chatHistories || chatHistories.length === 0) {
            return res.status(404).json({ error: 'No chat histories found for this user' });
        }

        res.json(chatHistories);
    } catch (error) {
        console.error('List History API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Suggestions endpoint
router.get('/suggest', async (req, res) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { 
                    role: "system", 
                    content: "You return three suggestions as JSON data. You will suggest a topic to research, a topic to stay updated on (latest news, current events), and a topic to learn." 
                },
                {
                    role: "user",
                    content: "Generate three suggestions now!",
                }
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "suggestions_schema",
                    schema: {
                        type: "object",
                        properties: {
                            research_topic: {
                                description: "A suggested topic for the user to research. Example: Overview of the solar panel industry.",
                                type: "string"
                            },
                            update_topic: {
                                description: "A suggested topic for the user to stay updated on. Example: Latest news on the stock market.",
                                type: "string"
                            },
                            learn_topic: {  
                                description: "A suggested topic for the user to learn. Example: How to code in Python.",
                                type: "string"
                            }
                        },
                        additionalProperties: false
                    }
                }
            }
        });

        res.json(JSON.parse(completion.choices[0].message.content));

    } catch (error) {
        console.error('Suggestions API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;


