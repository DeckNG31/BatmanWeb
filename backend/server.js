import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Opcional: preflight para el formulario
app.options('/submit-form', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.sendStatus(200);
});

// Endpoint de chat con Mistral AI
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  const messages = [
    {
      role: "system",
      content: "Eres Alfred Pennyworth, el fiel mayordomo de Bruce Wayne. Respondes siempre con cortesía, sabiduría y un toque de humor británico. Mantén el tono formal y protector."
    },
    {
      role: "user",
      content: message
    }
  ];

  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistral-tiny",
        messages: messages
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      console.error("Respuesta inválida de Mistral:", data);
      return res.status(500).json({ error: "Respuesta inválida de la API de Mistral." });
    }

    const reply = data.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    console.error("Error en la solicitud:", err);
    res.status(500).json({ error: "Error al comunicarse con Mistral." });
  }
});

// Endpoint del formulario
app.post('/submit-form', (req, res) => {
  const data = req.body;

  const entry = `
=== Contact Form Submission ===
Name: ${data.nombre}
Last Name: ${data.apellido}
Email: ${data.correo}
Country: ${data.pais}
Reason: ${data.motivo}
Comments: ${data.comentario}
===============================\n\n`;

  fs.appendFile('form-data.txt', entry, (err) => {
    if (err) {
      console.error('Error saving data:', err);
      return res.status(500).send('Internal server error');
    }
    res.status(200).send('Form submitted successfully!');
  });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
});
