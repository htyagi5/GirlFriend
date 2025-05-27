const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const scrib = {
    show: (msg) => {
      document.getElementById("output").textContent = msg;
      console.log(msg);
    }
  };

  if (!SpeechRecognition) {
    console.error("SpeechRecognition is not supported in this browser.");
    scrib.show("Speech recognition not supported.");
  } else {
    const r = new SpeechRecognition();
    r.continuous = false;
    r.interimResults = false;
    r.maxAlternatives = 1;

    r.onstart = function () {
      scrib.show("Listening...");
    };

    r.onresult = async function (event) {
      try {
        const transcript = event.results[0][0].transcript;
        scrib.show(`You said: ${transcript}`);
        const result = await callGemini(transcript);

        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't understand that.";
        scrib.show(text);
        await speakWithElevenLabs(text);
      } catch (err) {
        console.error(err);
        scrib.show("Error processing speech.");
      }
    };

    document.addEventListener("DOMContentLoaded", () => {
      document.getElementById("listenBtn").addEventListener("click", () => {
        r.start();
      });
    });
  }

  async function callGemini(text) {
    const body = {
      system_instruction: {
        parts: [
          {
            text: "You are an AI Girlfriend of Aayush Kannaujiya who likes Coding and Stuff. He is a tech guy. The text is a voice transcription. Reply with short, emotional responses suitable for text-to-speech."
          }
        ]
      },
      contents: [{
        parts: [{ text }]
      }]
    };

    const API_KEY = 'AIzaSyBLzWb4MCB3_gZQ8yK90tXbliHqII6lsLM'; // Your Gemini API Key
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error("Gemini API error");
    return await response.json();
  }

  async function speakWithElevenLabs(text) {
    const API_KEY = 'sk_83ff3093dfa96a95c0805f4571b86801e3743e5a7bfae757'; // replace with your actual ElevenLabs key
    const VOICE_ID = 'mg9npuuaf8WJphS6E0Rt'; // Rachel - recommended girlfriend voice

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.7
        }
      })
    });

    if (!response.ok) {
      console.error("ElevenLabs API error");
      return;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = document.getElementById('audio');
    audio.src = audioUrl;
      audio.playbackRate = 0.8;
    audio.play();
  }