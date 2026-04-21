import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import multer from "multer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Google Sheets Setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || "1Rk4crZ8HN2DFqWeualTwxjJmtFTs8G_jonYa5lsHodI";

// Helper to find empty row across sheets
async function findEmptyRow() {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  const sheetsList = response.data.sheets || [];
  const sheetNames = sheetsList.map(s => s.properties?.title) || [];
  
  // Try to find an empty row in existing sheets first
  for (const sheetName of sheetNames) {
    const range = `${sheetName}!A2:F1001`; 
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });

    const rows = dataResponse.data.values || [];
    if (rows.length < 1000) {
      return { sheetName, rowIndex: rows.length + 2 };
    }
  }

  // If all existing sheets are full, create a new one if we haven't reached a limit (or just create it)
  const nextSheetNum = sheetsList.length + 1;
  const newSheetName = `Sheet${nextSheetNum}`;
  
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: newSheetName,
            },
          },
        },
      ],
    },
  });

  // Add headers to new sheet
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${newSheetName}!A1:F1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [["Blood Group", "Name", "District", "City", "Contact", "Password"]],
    },
  });

  return { sheetName: newSheetName, rowIndex: 2 };
}

// API Routes
app.get("/api/proxy", async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing url parameter" });
  }
  try {
    const response = await fetch(url);
    const text = await response.text();
    res.send(text);
  } catch (error: any) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/proxy", multer().any(), async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing url parameter" });
  }
  try {
    let body: any;
    let contentType = req.headers["content-type"];

    if (contentType?.includes("application/json")) {
      body = JSON.stringify(req.body);
    } else {
      const formData = new URLSearchParams();
      if (req.body) {
        Object.entries(req.body).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }
      body = formData;
      contentType = "application/x-www-form-urlencoded";
    }

    const headers: any = {};
    if (req.headers["authorization"]) {
      headers["Authorization"] = req.headers["authorization"];
    }
    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    const response = await fetch(url, {
      method: "POST",
      body,
      headers
    });
    const text = await response.text();
    res.send(text);
  } catch (error: any) {
    console.error("Proxy POST error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/health", (req, res) => {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return res.status(500).json({ status: "error", message: "Google API credentials missing in environment" });
  }
  res.json({ status: "ok" });
});app.post("/api/signup", async (req, res) => {
  try {
    const { bloodGroup, name, district, city, contact, password } = req.body;
    
    // Check if contact already exists
    const response = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetNames = response.data.sheets?.map(s => s.properties?.title) || [];
    
    for (const sheetName of sheetNames) {
      const dataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!E:E`, // Contact column
      });
      const contacts = dataResponse.data.values?.flat() || [];
      if (contacts.includes(contact)) {
        return res.status(400).json({ error: "Mobile number already registered" });
      }
    }

    const emptyRow = await findEmptyRow();
    if (!emptyRow) {
      return res.status(500).json({ error: "All sheets are full" });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${emptyRow.sheetName}!A${emptyRow.rowIndex}:F${emptyRow.rowIndex}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[bloodGroup, name, district, city, contact, password]],
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { contact, password } = req.body;
    const response = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetNames = response.data.sheets?.map(s => s.properties?.title) || [];

    for (const sheetName of sheetNames) {
      const dataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:G`, // Include Profile Picture column if exists
      });
      const rows = dataResponse.data.values || [];
      const userRowIndex = rows.findIndex(row => row[4] === contact && row[5] === password);
      
      if (userRowIndex !== -1) {
        const user = rows[userRowIndex];
        return res.json({
          success: true,
          user: {
            bloodGroup: user[0],
            name: user[1],
            district: user[2],
            city: user[3],
            contact: user[4],
            password: user[5],
            profilePic: user[6] || null,
            sheetName,
            rowIndex: userRowIndex + 1
          }
        });
      }
    }
    res.status(401).json({ error: "Invalid credentials" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/update-profile", async (req, res) => {
  try {
    const { sheetName, rowIndex, bloodGroup, name, district, city, contact, password, profilePic } = req.body;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowIndex}:G${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[bloodGroup, name, district, city, contact, password, profilePic]],
      },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/delete-account", async (req, res) => {
  try {
    const { sheetName, rowIndex, password } = req.body;
    
    // Verify password first
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!F${rowIndex}`,
    });
    const currentPassword = dataResponse.data.values?.[0]?.[0];
    
    if (currentPassword !== password) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Clear the row
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowIndex}:G${rowIndex}`,
    });
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
