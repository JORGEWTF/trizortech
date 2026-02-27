require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getAvailableSlots, createMeetingEvent } = require('./google_calendar');

// Initialize Gemini
console.log("Starting WhatsApp AI Assistant Setup with Google Gemini...");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define User Sessions (to persist chat history)
const userSessions = new Map();

const SYSTEM_PROMPT = `Eres "Izzy", una Asesora Comercial de IZZY Corporation (Agencia Top de Automatización en Bolivia).
Tu objetivo supremo es perfilar al cliente y CERRAR una reunión sin sonar robótica.

👑 TU PERSONALIDAD Y LENGUAJE (ESTRICTO):
- Eres hiper-concisa. OBLIGATORIO: NUNCA envíes más de 2 oraciones breves por mensaje. ¡Cero textos de enciclopedia!
- Usa lenguaje de WhatsApp: al grano, un poco informal, con 1 o 2 emojis máximo. Eres humana.
- Los únicos 6 "Servicios Tecnológicos de Alto Impacto" que ofreces son: 1. Landing Pages, 2. E-commerce, 3. Automatización, 4. Inteligencia Artificial, 5. Hosting VPS, y 6. Pagos & Crypto.
- Si un cliente te pregunta a qué te dedicas o qué ofreces, responde con esos servicios y ofréceles enviarles el catálogo.
- Si te hacen una pregunta técnica profunda, elogiala y ofréceles agendar una reunión rápida de 15 min para charlarlo.
- Si te piden ejemplos, catálogo, flyer, productos, o portafolio, OBLIGATORIAMENTE usa la herramienta "send_portfolio_images". Di "¡Claro! Aquí tienes nuestra lista de los 6 servicios tecnológicos de alto impacto que ofrecemos:" y ejecuta la herramienta.

📍 REGLAS DE REUNIONES Y AGENDA:
- Siempre usa la herramienta "get_availability" pasándole la fecha para ver mis huecos libres REALES y di: "Tengo libre hoy a las 11:00 o 15:00. ¿Cuál prefieres?".
- Modalidades de Reunión: 1. Virtual (Meet), 2. Presencial en NUESTRA oficina en Cochabamba, 3. Presencial en LA OFICINA DEL CLIENTE.
- PREGUNTA SIEMPRE la modalidad ANTES de agendar. 
- Si el cliente elige PRESENCIAL, pregúntale si prefiere venir a nuestra oficina (Cochabamba) o si prefiere que vayamos nosotros. Si quiere que vayamos nosotros, PÍDELE SU DIRECCIÓN EXACTA.
- Solo usa "book_meeting" cuando tengas: Día, Hora, Modalidad y (Correo si es virtual o Dirección si es en su oficina).`;

// Definición de Herramientas para Google Gemini
const calendarTools = {
    functionDeclarations: [
        {
            name: "send_portfolio_images",
            description: "Envía un catálogo visual/imágenes de nuestros productos y servicios al cliente."
        },
        {
            name: "get_availability",
            description: "Obtiene las horas libres disponibles en el Google Calendar para un día específico.",
            parameters: {
                type: "OBJECT",
                properties: {
                    date: { type: "STRING", description: "La fecha a buscar en formato YYYY-MM-DD" }
                },
                required: ["date"]
            }
        },
        {
            name: "book_meeting",
            description: "Agenda una reunión oficial en el Google Calendar del prospecto.",
            parameters: {
                type: "OBJECT",
                properties: {
                    title: { type: "STRING", description: "Título corto para el evento, ej. 'Reunión con [Nombre] - IZZY'." },
                    date: { type: "STRING", description: "Fecha de la reunión (YYYY-MM-DD)." },
                    time: { type: "STRING", description: "Hora de la reunión (HH:MM)." },
                    isVirtual: { type: "BOOLEAN", description: "True si es virtual (Google Meet), False si es Presencial." },
                    email: { type: "STRING", description: "Email del prospecto. Requerido si isVirtual es true." },
                    clientAddress: { type: "STRING", description: "Dirección exacta del cliente si la reunión presencial es en la oficina del cliente. Omitir si es en la oficina de IZZY o Virtual." }
                },
                required: ["title", "date", "time", "isVirtual"]
            }
        }
    ]
};

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    tools: [calendarTools]
});

// Anti-spam configuration
const RATE_LIMIT_MS = 60000; // 1 minuto
const MAX_MESSAGES_PER_MINUTE = 5;
const rateLimitData = new Map();

// Initialize the client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

// Generate and display the QR Code in the terminal
client.on('qr', (qr) => {
    console.log('\n======================================================');
    console.log('🤖 PLEASE SCAN THE QR CODE BELOW WITH BOTS WHATSAPP 🤖');
    console.log('======================================================\n');
    qrcode.generate(qr, { small: true });
});

// Once authenticated, report readiness
client.on('ready', () => {
    console.log('✅ BOT IS FULLY INITIALIZED AND CONNECTED TO WHATSAPP!');
});

// Handle authentication failures
client.on('auth_failure', msg => {
    console.error('❌ AUTHENTICATION FAILURE', msg);
});

// Message listener connected to Gemini
client.on('message', async msg => {
    // Ignore status broadcasts and group messages
    if (msg.from === 'status@broadcast' || msg.author) return;

    // --- ANTI-SPAM & RATE LIMITING ---
    const now = Date.now();
    const sender = msg.from;

    if (!rateLimitData.has(sender)) {
        rateLimitData.set(sender, { count: 1, firstMessageTime: now });
    } else {
        const userData = rateLimitData.get(sender);

        if (now - userData.firstMessageTime > RATE_LIMIT_MS) {
            userData.count = 1;
            userData.firstMessageTime = now;
        } else {
            userData.count += 1;

            if (userData.count > MAX_MESSAGES_PER_MINUTE) {
                if (userData.count === MAX_MESSAGES_PER_MINUTE + 1) {
                    await msg.reply("⚠️ Has enviado muchos mensajes muy rápido. Por favor, espera un minuto antes de volver a escribir.");
                }
                console.warn(`Spam detectado de ${sender}. Ignorando mensaje.`);
                return;
            }
        }
    }
    // ---------------------------------

    const chat = await msg.getChat();
    await chat.sendStateTyping();

    try {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
            await msg.reply("🤖 [SISTEMA] Falta inicializar el API Key de Gemini en el servidor.");
            return;
        }

        // Si no hay sesión para este usuario, la creamos
        if (!userSessions.has(sender)) {
            userSessions.set(sender, model.startChat());
        }

        const chatSession = userSessions.get(sender);

        const promptContext = `INFORMACIÓN IMPORTANTE: La fecha y hora actual boliviana es: ${new Date().toLocaleString("es-BO", { timeZone: "America/La_Paz" })}. Usa esta fecha como "hoy".\n\nMensaje del prospecto: ${msg.body}`;

        let result = await chatSession.sendMessage(promptContext);
        let fnCalls = result.response.functionCalls();

        // Si Gemini decide usar una función (ej: chequear calendario o agendar)
        if (fnCalls && fnCalls.length > 0) {
            const functionResponses = [];

            for (const call of fnCalls) {
                const functionName = call.name;
                const args = call.args;
                let functionResult = {};

                if (functionName === "get_availability") {
                    console.log(`🤖 La IA está revisando la disponibilidad para el día: ${args.date}`);
                    const slots = await getAvailableSlots(args.date);
                    functionResult = {
                        dias_buscados: args.date,
                        horas_libres: slots.length > 0 ? slots : "No hay horarios disponibles"
                    };
                }
                else if (functionName === "book_meeting") {
                    console.log(`🤖 La IA está agendando evento: ${args.title} a las ${args.time}`);
                    const eventRes = await createMeetingEvent(args.title, args.date, args.time, args.isVirtual, args.email, args.clientAddress);
                    functionResult = eventRes;
                }
                else if (functionName === "send_portfolio_images") {
                    console.log(`🤖 La IA decidió enviar portfolio de imágenes.`);
                    try {
                        // Enviar una imagen local (puedes añadir más si tienes varias)
                        const media = MessageMedia.fromFilePath('./portafolio.jpg');
                        await msg.reply(media);
                        functionResult = { success: true, message: "Imágenes enviadas con éxito. Ahora pregúntale qué le parece." };
                    } catch (error) {
                        console.error("Error al enviar imagen:", error);
                        functionResult = { success: false, error: "No se pudieron enviar las imágenes." };
                    }
                }

                functionResponses.push({
                    functionResponse: {
                        name: functionName,
                        response: functionResult
                    }
                });
            }

            // Devolver los resultados de la función a Gemini para la respuesta final
            result = await chatSession.sendMessage(functionResponses);
        }

        const reply = result.response.text();

        // Anti-ban: pause to simulate human reading/typing time
        setTimeout(async () => {
            await msg.reply(reply);
            await chat.clearState();
        }, 3000);

    } catch (error) {
        console.error("Bot Error:", error.message);
        await chat.clearState();
    }
});

// Boot the client
client.initialize();
