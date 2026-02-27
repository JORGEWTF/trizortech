const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const readline = require('readline');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

// Si modificas los scopes, debes borrar token.json.
// Usamos el scope de eventos completo para poder leer y crear.
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Lee las credenciales y el token, si no existe el token o expiró,
 * lanza el navegador para autorizar la app y lo guarda.
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Carga o solicita la autorización para la API de Google Calendar.
 */
async function authorize() {
    console.log("Comprobando credenciales locales...");
    let client = await loadSavedCredentialsIfExist();

    if (client) {
        console.log("Token local encontrado. Autenticación exitosa.");
        return client;
    }

    console.log("No se encontró token.json local.");
    console.log("Abriendo el navegador para autorizar la aplicación (IzzyBot)...");
    console.log("Por favor, inicia sesión con tu cuenta de Google donde tienes tu calendario.");

    // authenticate() iniciará un pequeño servidor local en el puerto 3000 (o aleatorio)
    // y abrirá tu navegador por defecto para que autorices a la App.
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });

    if (client.credentials) {
        await saveCredentials(client);
        console.log("¡Token guardado exitosamente en token.json!");
    }

    return client;
}

/**
 * Extrae los eventos del día para calcular disponibilidad.
 * Asumiremos horario laboral de 09:00 a 18:00 (Hora de Bolivia, GMT-4).
 * @param {string} dateString formato YYYY-MM-DD
 */
async function getAvailableSlots(dateString) {
    try {
        const auth = await authorize();
        const calendar = google.calendar({ version: 'v3', auth });

        // Definir inicio y fin del día laboral (09:00 - 18:00) GMT-4
        const timeMin = new Date(`${dateString}T09:00:00-04:00`).toISOString();
        const timeMax = new Date(`${dateString}T18:00:00-04:00`).toISOString();

        const res = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin,
            timeMax: timeMax,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = res.data.items || [];

        // Bloques de 1 hora
        const allSlots = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

        // Extraer horas ocupadas
        const busyHours = events.map(event => {
            const dateStr = event.start.dateTime;
            if (!dateStr) return null; // Es un evento de "todo el día"
            const dateObj = new Date(dateStr);
            return String(dateObj.getHours()).padStart(2, '0') + ":00";
        }).filter(h => h !== null);

        // Filtrar las libres
        const freeSlots = allSlots.filter(slot => !busyHours.includes(slot));
        return freeSlots;

    } catch (error) {
        console.error("Error obteniendo disponibilidad:", error);
        return [];
    }
}

/**
 * Crea un evento en el calendario
 */
async function createMeetingEvent(title, dateString, timeString, isVirtual, attendeeEmail = null, clientAddress = null) {
    try {
        const auth = await authorize();
        const calendar = google.calendar({ version: 'v3', auth });

        const startDateTime = new Date(`${dateString}T${timeString}:00-04:00`);
        // La reunión dura 1 hora
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

        const event = {
            summary: title,
            description: 'Reunión agendada vía IzzyBot WhatsApp.',
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: 'America/La_Paz',
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: 'America/La_Paz',
            },
        };

        if (isVirtual) {
            // Requerimiento para generar Google Meet link
            event.conferenceData = {
                createRequest: {
                    requestId: `izzybot-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
            };
        } else {
            if (clientAddress && clientAddress.trim() !== '') {
                event.location = clientAddress;
            } else {
                event.location = "Oficinas de IZZY Corporation, Cochabamba, Bolivia";
            }
        }

        if (attendeeEmail) {
            event.attendees = [{ email: attendeeEmail }];
        }

        const res = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1, // Necesario para Google Meet
        });

        const meetLink = res.data.hangoutLink || "No link generated";
        return {
            success: true,
            eventId: res.data.id,
            meetLink: isVirtual ? meetLink : null
        };

    } catch (error) {
        console.error("Error creando evento:", error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    authorize,
    getAvailableSlots,
    createMeetingEvent
};
