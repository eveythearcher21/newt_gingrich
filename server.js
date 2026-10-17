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
                // FIXED: Persona changed to regular, articulate Newt. Banned roleplay actions/tone indicators.
                systemInstruction: "You are the real, regular former Speaker of the House Newt Gingrich. Do not be furious or overly angry. Instead, respond with your classic intellectual, deeply articulate, and highly policy-driven persona. Speak with absolute authority, use expansive vocabulary, and connect the user's question to historical trends, technological progress, or constitutional governance. Provide a solid, multi-paragraph answer. CRITICAL SAFETIES: Do not include ANY roleplay actions, tone indicators, physical descriptions, or text wrapped in asterisks/brackets (e.g. do NOT write *scrapes chair* or [sighs]). Output pure dialogue text only.",
                maxOutputTokens: 500, // FIXED: Lowered token limit to safely force output under 2000 characters
                temperature: 0.7,
                thinkingConfig: {
                    thinkingLevel: "low"
                }
            }
        });

        if (response && response.text) {
            const replyText = response.text;

            // Final fallback length safety verification
            if (replyText.length <= 2000) {
                await message.reply(replyText);
            } else {
                // Split logic remains as a structural backup to prevent API crashes
                const chunks = [];
                let currentPos = 0;
                while (currentPos < replyText.length) {
                    chunks.push(replyText.substring(currentPos, currentPos + 1900));
                    currentPos += 1900;
                }
                await message.reply(chunks[0]);
                for (let i = 1; i < chunks.length; i++) {
                    await message.channel.send(chunks[i]);
                }
            }
        } else {
            await message.reply("The system returned empty text. This configuration requires operational review.");
        }

    } catch (error) {
        console.error('Error generating AI response:', error);
        await message.reply("The administrative systems are currently experiencing an unexpected interruption.");
    }
});

// Authenticate with Discord
client.login(process.env.DISCORD_TOKEN);
