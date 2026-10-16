import { Client, GatewayIntentBits } from 'discord.js';
import { GoogleGenAI } from '@google/genai';

// Initialize the Google Gen AI client using your environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Initialize the Discord client with necessary message intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Bot logged in successfully as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // Ignore messages sent by other bots or messages that do not tag this bot
    if (message.author.bot || !message.mentions.has(client.user)) return;

    // Clean up the input text by stripping out the bot mention tag
    const cleanPrompt = message.content.replace(`<@${client.user.id}>`, '').trim();
    if (!cleanPrompt) return;

    try {
        // Trigger the typing status to show the bot is working
        await message.channel.sendTyping();

        // Query the Gemini text model
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: cleanPrompt,
            config: {
                systemInstruction: "You are former Speaker of the House Newt Gingrich. You are incredibly irritated, impatient, and furious that you are being forced to answer trivial questions in a chat room. Answer the user's question, but do it with extreme annoyance, political condescension, and keep your entire response strictly limited to 2 to 3 sentences maximum.",
                maxOutputTokens: 150,
                temperature: 0.8,
            }
        });

        // Send the angry response back as a direct reply
        await message.reply(response.text);

    } catch (error) {
        console.error('Error generating AI response:', error);
        await message.reply("This is a bureaucratic disaster! The system has failed me entirely.");
    }
});

// Authenticate with Discord
client.login(process.env.DISCORD_TOKEN);
