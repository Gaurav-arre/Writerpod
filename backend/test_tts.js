require('dotenv').config();
const { ElevenLabsClient } = require('elevenlabs');

const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY
});

async function test() {
    console.log('Testing ElevenLabs API with key:', process.env.ELEVENLABS_API_KEY ? 'Present' : 'Missing');
    try {
        const audio = await elevenlabs.generate({
            voice: '21m00Tcm4TlvDq8ikWAM', // Rachel
            text: 'Hello, this is a test of the WriterPod TTS system.',
            model_id: 'eleven_multilingual_v2'
        });

        console.log('API call successful, processing stream...');
        const chunks = [];
        for await (const chunk of audio) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        console.log('Total buffer size:', buffer.length);
        if (buffer.length < 1000) {
            console.log('WARNING: Buffer size is very small, might be empty or error response.');
        }
    } catch (error) {
        console.error('API Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

test();
