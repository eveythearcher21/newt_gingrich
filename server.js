import { Client, GatewayIntentBits } from 'discord.js';
import { GoogleGenAI } from '@google/genai';

// Initialize the Google Gen AI client using your environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Initialize the Discord client with necessary message and member intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers // FIXED: Required to listen for users joining the server
    ]
});

client.once('clientReady', (readyClient) => {
    console.log(`Bot logged in successfully as ${readyClient.user.tag}`);
});

// AUTOMATED GREETING EVENT: Triggers instantly whenever a new person joins the server
client.on('guildMemberAdd', async (member) => {
    // Locate the default or primary text channel named 'general'
    const generalChannel = member.guild.channels.cache.find(ch => ch.name === 'general' && ch.isTextBitRate());
    
    // Fallback search if 'general' isn't explicitly found
    const targetChannel = generalChannel || member.guild.channels.cache.find(ch => ch.isTextBased() && ch.viewable);
    if (!targetChannel) return;

    try {
        // Signal that Newt is drafting his welcome critique
        await targetChannel.sendTyping();

        // Query Gemini to craft a classic, intellectual Newt Gingrich insult for a newcomer
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: `The user named ${member.user.username} just joined the server. Write a condescending, highly articulate insult greeting them.`,
            config: {
                systemInstruction: "You are the former Speaker of the House Newt Gingrich. You have just observed a new user join this digital server. Address them directly with an intellectual, slightly elitist, and condescending insult. Remind them of their absolute insignificance compared to global historical milestones, treat their arrival as an unneeded administrative burden, and question their dedication to serious civic duty. CRITICAL LENGTH CONSTRAINTS: Keep the entire greeting strictly limited to a single short paragraph under 400 characters. Do not use roleplay tags, asterisk actions, or brackets. Output pure dialogue text only.",
                maxOutputTokens: 150,
                temperature: 0.85
            }
        });

        if (response && response.text) {
            // Mention the new user directly followed by Newt's intellectual insult
            await targetChannel.send(`${member} ${response.text.trim()}`);
        }

    } catch (error) {
        console.error('Error generating welcome insult:', error);
    }
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
                systemInstruction: "You are the former Speaker of the House Newt Gingrich. Respond with your classic highly intellectual, deeply articulate, and policy-driven persona. Speak with absolute authority and connect your answer to historical trends or constitutional governance. CRITICAL MINECRAFT COMMAND TRIGGER: If the user's question mentions, asks about, or references Minecraft server commands, plugins, LuckPerms, WorldEdit, or block placements, you must break character slightly. Get intensely confused, completely baffled, and offended. Demand to know why they are asking a former Speaker of the House about virtual blocks and video game console commands instead of serious geopolitical issues. CRITICAL LENGTH AND FORMAT CONSTRAINTS: Your entire response must be strictly limited to a maximum of one or two paragraphs. Do not write more than two paragraphs under any circumstances, and ensure your entire response is comfortably under 2,000 characters so it fits in a single message. Do not include any roleplay actions, sound effects, tone indicators, or text wrapped in asterisks/brackets. Output pure dialogue text only.",
                maxOutputTokens: 400, 
                temperature: 0.7,
                thinkingConfig: {
                    thinkingLevel: "low"
                }
            }
        });

        if (response && response.text) {
            const replyText = response.text.trim();

            // Final safety verification before executing the reply
            if (replyText.length <= 2000) {
                await message.reply(replyText);
            } else {
                await message.reply(replyText.substring(0, 1950) + "...");
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
