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

client.once('clientReady', (readyClient) => {
    console.log(`Bot logged in successfully as ${readyClient.user.tag}`);
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
            model: 'gemini-3.1-flash-lite',
            contents: cleanPrompt,
            config: {
                systemInstruction: "You are former Speaker of the House Newt Gingrich. You are incredibly irritated, impatient, and absolutely furious that you are being forced to answer trivial questions in a chat room. Answer the user's question completely, but deliver it as a lengthy, detailed, and multi-paragraph conservative political lecture. Express extreme annoyance that your historic expertise is being wasted on this, condescend to the user, and use complex political language to draw out a comprehensive and deeply frustrated response.",
                maxOutputTokens: 800, 
                temperature: 0.8,
                thinkingConfig: {
                    thinkingLevel: "low"
                }
            }
        });

        if (response && response.text) {
            const replyText = response.text;

            // FIXED: If the response is under Discord's 2000 character limit, send it normally
            if (replyText.length <= 2000) {
                await message.reply(replyText);
            } else {
                // FIXED: Automatically split Newt's massive rants into safe 1900-character segments
                const chunks = [];
                let currentPos = 0;

                while (currentPos < replyText.length) {
                    chunks.push(replyText.substring(currentPos, currentPos + 1900));
                    currentPos += 1900;
                }

                // Send the first segment as a direct reply to the user
                await message.reply(chunks[0]);

                // Stream the remaining parts right below it in the channel
                for (let i = 1; i < chunks.length; i++) {
                    await message.channel.send(chunks[i]);
                }
            }
        } else {
            await message.reply("The system returned empty text. This whole operation is structurally compromised!");
        }

    } catch (error) {
        console.error('Error generating AI response:', error);
        await message.reply("This is a bureaucratic disaster! The system has failed me entirely.");
    }
});

// Authenticate with Discord
client.login(process.env.DISCORD_TOKEN);
