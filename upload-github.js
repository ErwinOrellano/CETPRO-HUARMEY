import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function initFirebaseAdmin() {
  if (getApps().length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Faltan variables FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY en Vercel.");
  }

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey })
  });
}

async function verifyAdmin(req) {
  initFirebaseAdmin();

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    const error = new Error("No autorizado. Falta token de Firebase.");
    error.status = 401;
    throw error;
  }

  const decoded = await getAuth().verifyIdToken(token);
  const allowedEmails = String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length && !allowedEmails.includes(String(decoded.email || "").toLowerCase())) {
    const error = new Error("Este usuario no está autorizado para subir archivos.");
    error.status = 403;
    throw error;
  }

  return decoded;
}

function cleanFileName(name) {
  return String(name || "archivo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    await verifyAdmin(req);

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { fileName, folder, contentBase64 } = body;

    const allowedFolders = ["docentes", "noticias", "galeria", "documentos"];

    if (!fileName || !folder || !contentBase64) {
      return res.status(400).json({ error: "Faltan datos del archivo" });
    }

    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({ error: "Carpeta no permitida" });
    }

    if (String(contentBase64).length > 6_000_000) {
      return res.status(413).json({ error: "El archivo es muy pesado. Usa imágenes o documentos más livianos." });
    }

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return res.status(500).json({ error: "Faltan variables de GitHub en Vercel" });
    }

    const path = `assets/${folder}/${Date.now()}_${cleanFileName(fileName)}`;

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Subir archivo ${path}`,
        content: contentBase64,
        branch
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || "GitHub rechazó la subida", detalle: data });
    }

    return res.status(200).json({
      ok: true,
      path,
      sha: data.content?.sha || "",
      url: `https://${owner}.github.io/${repo}/${path}`
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      error: error.message || "Error al subir archivo a GitHub"
    });
  }
}
