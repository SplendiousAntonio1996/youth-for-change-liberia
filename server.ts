import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { 
  sendPartnerNotificationEmail, 
  generatePartnerEmailHtml,
  sendStemProposalAlertEmail,
  generateStemProposalAlertHtml,
  sendCoachFixtureAlertEmail,
  generateCoachFixtureAlertHtml,
  sendBatchCoachFixtureAlerts,
  getSmtpStatus,
  testSmtpConnection
} from "./server/emailService.ts";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Ensure upload folders exist
const uploadsBaseDir = path.join(process.cwd(), "public", "uploads");
const uploadsVideosDir = path.join(uploadsBaseDir, "videos");
const uploadsImagesDir = path.join(uploadsBaseDir, "images");

try {
  fs.mkdirSync(uploadsVideosDir, { recursive: true });
  fs.mkdirSync(uploadsImagesDir, { recursive: true });
} catch (e) {
  console.warn("Could not create uploads directory:", e);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Support high-resolution video and photo payloads up to 150MB
  app.use(express.json({ limit: "150mb" }));
  app.use(express.urlencoded({ limit: "150mb", extended: true }));

  // Dedicated Video Streaming Route with HTTP 206 Byte-Range & HEAD preflight support
  app.all(["/uploads/videos/:filename", "/uploads/videos/*"], (req, res) => {
    try {
      const rawParam = req.params.filename || req.params[0] || '';
      const filename = path.basename(rawParam.split('?')[0]);
      const filePath = path.join(uploadsVideosDir, filename);

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Range, Origin, X-Requested-With, Content-Type, Accept");

      if (req.method === "OPTIONS") {
        return res.status(200).end();
      }

      if (!filename || !fs.existsSync(filePath)) {
        return res.status(404).send("Video file not found on server");
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      let contentType = "video/mp4";
      const ext = path.extname(filename).toLowerCase();
      if (ext === ".webm") contentType = "video/webm";
      else if (ext === ".mov") contentType = "video/quicktime";
      else if (ext === ".mkv") contentType = "video/x-matroska";
      else if (ext === ".m4v") contentType = "video/mp4";
      else if (ext === ".ogv") contentType = "video/ogg";

      if (req.method === "HEAD") {
        res.writeHead(200, {
          "Content-Length": fileSize,
          "Content-Type": contentType,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable"
        });
        return res.end();
      }

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize) {
          res.status(416).send(`Requested range not satisfiable: ${start} >= ${fileSize}`);
          return;
        }

        const chunkSize = end - start + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });
        const headers = {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*"
        };

        res.writeHead(206, headers);
        fileStream.pipe(res);
      } else {
        const headers = {
          "Content-Length": fileSize,
          "Content-Type": contentType,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*"
        };
        res.writeHead(200, headers);
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (streamErr: any) {
      console.error("[Video Streaming Error]:", streamErr);
      if (!res.headersSent) {
        res.status(500).send("Video streaming error: " + streamErr.message);
      }
    }
  });

  // Serve uploaded media files with streaming and range support
  app.use("/uploads", express.static(uploadsBaseDir, {
    setHeaders: (res, filePath) => {
      res.setHeader('Accept-Ranges', 'bytes');
      if (filePath.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
      } else if (filePath.endsWith('.webm')) {
        res.setHeader('Content-Type', 'video/webm');
      } else if (filePath.endsWith('.mov')) {
        res.setHeader('Content-Type', 'video/quicktime');
      }
    }
  }));

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Youth For Change Liberia" });
  });

  // Direct Binary Media Streaming Upload API (for videos & large images, supports up to 2GB)
  app.post("/api/upload-binary", (req, res) => {
    try {
      // Disable socket timeout for long video uploads
      if (req.socket) {
        req.socket.setTimeout(0);
      }

      const filename = (req.query.filename as string) || "media.mp4";
      const type = (req.query.type as string) || "video";
      const isVideo = type === "video" || req.headers["content-type"]?.startsWith("video") || filename.match(/\.(mp4|webm|mov|m4v|mkv)$/i);
      
      const targetDir = isVideo ? uploadsVideosDir : uploadsImagesDir;
      const subFolder = isVideo ? "videos" : "images";

      let ext = path.extname(filename);
      if (!ext) {
        ext = isVideo ? ".mp4" : ".jpg";
      }

      const rawBaseName = filename
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .substring(0, 40);

      const savedFileName = `${isVideo ? "vid" : "img"}_${Date.now()}_${rawBaseName}${ext}`;
      const destinationPath = path.join(targetDir, savedFileName);

      const fileWriteStream = fs.createWriteStream(destinationPath);
      let totalBytes = 0;

      req.on('data', (chunk) => {
        totalBytes += chunk.length;
      });

      req.pipe(fileWriteStream);

      fileWriteStream.on('finish', () => {
        const publicUrl = `/uploads/${subFolder}/${savedFileName}`;
        console.log(`[Upload Binary API] Saved ${publicUrl} (${(totalBytes / (1024 * 1024)).toFixed(2)} MB)`);
        res.json({
          success: true,
          url: publicUrl,
          filename: savedFileName,
          size: totalBytes
        });
      });

      fileWriteStream.on('error', (err) => {
        console.error('[Upload Binary Stream Error]:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: 'Failed to save media stream: ' + err.message });
        }
      });
    } catch (err: any) {
      console.error('[Upload Binary Route Error]:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: err.message });
      }
    }
  });

  // Media File Base64 Upload API for backward compatibility
  app.post("/api/upload-media", async (req, res) => {
    try {
      const { dataUrl, filename, name, type = "video" } = req.body;
      if (!dataUrl || typeof dataUrl !== "string") {
        return res.status(400).json({ error: "Missing dataUrl parameter" });
      }

      // Parse data URL components
      const matches = dataUrl.match(/^data:([A-Za-z-+/0-9]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: "Invalid base64 Data URL format" });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      const isVideo = mimeType.startsWith("video/") || type === "video";
      const targetDir = isVideo ? uploadsVideosDir : uploadsImagesDir;
      const subFolder = isVideo ? "videos" : "images";

      // Determine extension
      let extension = ".mp4";
      if (mimeType.includes("webm")) extension = ".webm";
      else if (mimeType.includes("quicktime") || mimeType.includes("mov")) extension = ".mov";
      else if (mimeType.includes("png")) extension = ".png";
      else if (mimeType.includes("webp")) extension = ".webp";
      else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) extension = ".jpg";
      else if (filename && path.extname(filename)) extension = path.extname(filename);

      const rawBaseName = (name || filename || (isVideo ? "video" : "media"))
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .substring(0, 40);

      const savedFileName = `${isVideo ? "vid" : "img"}_${Date.now()}_${rawBaseName}${extension}`;
      const destinationPath = path.join(targetDir, savedFileName);

      await fs.promises.writeFile(destinationPath, buffer);

      const publicUrl = `/uploads/${subFolder}/${savedFileName}`;
      console.log(`[Upload API] Saved ${isVideo ? "video" : "image"} (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) to ${publicUrl}`);

      return res.json({
        success: true,
        url: publicUrl,
        filename: savedFileName,
        size: buffer.length,
        mimeType
      });
    } catch (uploadError: any) {
      console.error("[Upload API Error]:", uploadError);
      return res.status(500).json({
        success: false,
        error: "Failed to process media upload: " + uploadError.message
      });
    }
  });

  // Admin Media Cleanup API: Clears server video files if user wants to delete all
  app.post("/api/admin/clear-videos", (req, res) => {
    try {
      if (fs.existsSync(uploadsVideosDir)) {
        const files = fs.readdirSync(uploadsVideosDir);
        let deletedCount = 0;
        for (const file of files) {
          try {
            fs.unlinkSync(path.join(uploadsVideosDir, file));
            deletedCount++;
          } catch (delErr) {
            console.warn(`Could not delete video file ${file}:`, delErr);
          }
        }
        console.log(`[Admin Media Cleanup] Cleared ${deletedCount} server video files.`);
        return res.json({ success: true, count: deletedCount });
      }
      return res.json({ success: true, count: 0 });
    } catch (err: any) {
      console.error("[Admin Media Cleanup Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // AI Forensics & STEM Coach Endpoint
  app.post("/api/gemini/coach", async (req, res) => {
    try {
      const { prompt, mode, motion, category } = req.body;
      
      const client = getAiClient();
      if (!client) {
        // Fallback intelligent response if API key is not yet configured
        return res.json({
          reply: `[AI Forensics Coach - Liberia Edition]\n\nRegarding: "${motion || prompt || 'Debate & STEM Preparation'}"\n\n1. Strategic Framing: In the context of Liberia's socioeconomic and governance landscape, define clear stakeholders (e.g., local communities, Ministry of Education, student innovators, rural counties).\n\n2. Key Argument Pillars:\n- Affirmative / Innovation Side: Focus on immediate community impact, scalability, local raw material utilization, and constitutional rights.\n- Opposition / Feasibility Side: Highlight fiscal sustainability, institutional capacity, regional equity across the 15 counties, and alternative policy instruments.\n\n3. Rebuttal & POI Strategy: Anticipate opposition claims on implementation barriers and offer empirical precedence from Liberian developmental history.`
        });
      }

      const systemInstruction = `You are the official Youth For Change Liberia AI Forensics & STEM Coach. 
You assist Liberian high school students, teachers, and debaters preparing for the National Debate Championship and National STEM Challenge. 
Focus your advice on:
- High school debate framing, argumentation (World Schools Debate Championship - WSDC / Parliamentary adapted formats)
- Liberian contexts (15 counties, governance, economy, youth empowerment, rural education, climate resilience)
- STEM engineering feasibility using locally available materials
- Constructive speeches, reply speeches, and sharp Points of Information (POIs)
Keep answers inspiring, well-structured, educational, and patriotic.`;

      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemInstruction}\n\nTask (${mode || 'General Coaching'}): ${prompt || motion || 'Help me prepare arguments for high school forensics in Liberia.'}`
              }
            ]
          }
        ]
      });

      const replyText = response.text || "No response generated.";
      res.json({ reply: replyText });
    } catch (error: any) {
      console.error("Gemini Coach Error:", error);
      res.status(500).json({ 
        error: "Failed to generate AI coaching advice",
        details: error.message 
      });
    }
  });

  // Partner Email Notification Dispatch Endpoint
  app.post("/api/send-partner-notification", async (req, res) => {
    try {
      const { partnerName, email, orgName, status, partnerType, county, reviewerNotes, applicationId, customSubject, customBody } = req.body;
      
      if (!email || !status) {
        return res.status(400).json({ error: "Missing required fields: email and status are mandatory." });
      }

      const result = await sendPartnerNotificationEmail({
        partnerName: partnerName || orgName || "Valued Partner",
        email,
        orgName: orgName || partnerName,
        status,
        partnerType,
        county,
        reviewerNotes,
        applicationId,
        customSubject,
        customBody
      });

      res.json(result);
    } catch (error: any) {
      console.error("Email notification dispatch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to dispatch email notification: " + error.message
      });
    }
  });

  // Partner Email Preview Endpoint
  app.post("/api/preview-partner-email", (req, res) => {
    try {
      const { partnerName, email, orgName, status, partnerType, county, reviewerNotes, applicationId, customSubject } = req.body;
      
      const preview = generatePartnerEmailHtml({
        partnerName: partnerName || orgName || "Valued Partner",
        email: email || "partner@example.com",
        orgName: orgName || partnerName,
        status: status || 'approved',
        partnerType,
        county,
        reviewerNotes,
        applicationId,
        customSubject
      });

      res.json({ success: true, preview });
    } catch (error: any) {
      console.error("Email preview error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // STEM Proposal Email Notification Dispatch Endpoint
  app.post("/api/notify-stem-proposal", async (req, res) => {
    try {
      const {
        proposalId,
        title,
        school,
        county,
        category,
        teamLead,
        studentTeam,
        mentor,
        mentorEmail,
        mentorPhone,
        problemStatement,
        solution,
        materialsBudget,
        prototypeStage,
        submittedAt,
        adminEmailOverride,
        configOverride
      } = req.body;

      if (!title || !school) {
        return res.status(400).json({ error: "Missing required fields: title and school are required." });
      }

      const result = await sendStemProposalAlertEmail({
        proposalId,
        title,
        school,
        county: county || "Montserrado",
        category: category || "STEM Innovation",
        teamLead: teamLead || "Team Lead",
        studentTeam: Array.isArray(studentTeam) ? studentTeam : [],
        mentor: mentor || "Science Teacher",
        mentorEmail,
        mentorPhone,
        problemStatement: problemStatement || "Not specified",
        solution: solution || "Not specified",
        materialsBudget: materialsBudget || "Under $350 USD",
        prototypeStage: prototypeStage || "Working Prototype",
        submittedAt: submittedAt || new Date().toISOString(),
        adminEmailOverride
      }, configOverride);

      res.json(result);
    } catch (error: any) {
      console.error("STEM proposal email alert error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to dispatch proposal alert: " + error.message
      });
    }
  });

  // STEM Proposal Alert Preview Endpoint
  app.post("/api/preview-stem-proposal-email", (req, res) => {
    try {
      const {
        proposalId,
        title,
        school,
        county,
        category,
        teamLead,
        studentTeam,
        mentor,
        mentorEmail,
        mentorPhone,
        problemStatement,
        solution,
        materialsBudget,
        prototypeStage,
        submittedAt
      } = req.body;

      const preview = generateStemProposalAlertHtml({
        proposalId: proposalId || "YFC-PREVIEW-001",
        title: title || "Solar-Assisted Cassava Root Dehydrator",
        school: school || "Gboveh High School",
        county: county || "Bong",
        category: category || "Agri-Tech & Food Preservation",
        teamLead: teamLead || "Emmanuel Flomo",
        studentTeam: Array.isArray(studentTeam) && studentTeam.length > 0 ? studentTeam : ["Kebeh Kollie", "Moses Tokpah"],
        mentor: mentor || "Dr. Prince Tokpah",
        mentorEmail: mentorEmail || "ptokpah@cuttington.edu.lr",
        mentorPhone: mentorPhone || "+231 770 123 456",
        problemStatement: problemStatement || "High post-harvest loss during rainy seasons destroying smallholder cassava roots.",
        solution: solution || "Parabolic solar drying unit with low-cost 12V convective ventilation fan built from recycled scrap sheet metal.",
        materialsBudget: materialsBudget || "$180 USD",
        prototypeStage: prototypeStage || "Working Prototype",
        submittedAt: submittedAt || new Date().toISOString()
      });

      res.json({ success: true, preview });
    } catch (error: any) {
      console.error("STEM proposal preview error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // SMTP Configuration Status Endpoint
  app.get("/api/smtp-status", (req, res) => {
    try {
      const status = getSmtpStatus();
      res.json({ success: true, ...status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // SMTP Test Connection & Dispatch Endpoint
  app.post("/api/test-smtp", async (req, res) => {
    try {
      const { targetEmail } = req.body;
      const result = await testSmtpConnection(targetEmail);
      res.json(result);
    } catch (err: any) {
      console.error("SMTP test error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Coach Fixture Alert Notification Endpoint
  app.post("/api/notify-coach-fixture", async (req, res) => {
    try {
      const {
        fixtureId,
        roundName,
        county,
        stage,
        program,
        schoolName,
        coachName,
        coachEmail,
        coachPhone,
        opponentSchool,
        assignedSide,
        matchDate,
        matchTime,
        venue,
        motion,
        motionInfoSlide,
        motionDomain,
        antiBiasHash,
        adjudicators,
        customNotes,
        configOverride
      } = req.body;

      if (!coachEmail || !schoolName || !fixtureId) {
        return res.status(400).json({ 
          error: "Missing required fields: coachEmail, schoolName, and fixtureId are mandatory." 
        });
      }

      const result = await sendCoachFixtureAlertEmail({
        fixtureId,
        roundName: roundName || "Tournament Qualifier",
        county: county || "Montserrado",
        stage,
        program,
        schoolName,
        coachName: coachName || "Debate/STEM Coach",
        coachEmail,
        coachPhone,
        opponentSchool: opponentSchool || "TBD",
        assignedSide: assignedSide || "Proposition / Lead",
        matchDate: matchDate || "TBD",
        matchTime: matchTime || "10:00 AM GMT",
        venue: venue || "National Forensics Arena",
        motion: motion || "Official Forensics Resolution",
        motionInfoSlide,
        motionDomain,
        antiBiasHash: antiBiasHash || "YFC-FAIR-2025",
        adjudicators: Array.isArray(adjudicators) ? adjudicators : [],
        customNotes
      }, configOverride);

      res.json(result);
    } catch (error: any) {
      console.error("Coach fixture alert dispatch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to dispatch coach fixture notification: " + error.message
      });
    }
  });

  // Preview Coach Fixture Alert Email Endpoint
  app.post("/api/preview-coach-fixture-email", (req, res) => {
    try {
      const {
        fixtureId,
        roundName,
        county,
        stage,
        program,
        schoolName,
        coachName,
        coachEmail,
        coachPhone,
        opponentSchool,
        assignedSide,
        matchDate,
        matchTime,
        venue,
        motion,
        motionInfoSlide,
        motionDomain,
        antiBiasHash,
        adjudicators,
        customNotes
      } = req.body;

      const preview = generateCoachFixtureAlertHtml({
        fixtureId: fixtureId || "fix-preview-01",
        roundName: roundName || "Montserrado Zone 1 - Round 1",
        county: county || "Montserrado",
        stage,
        program,
        schoolName: schoolName || "D. Twe Memorial High School",
        coachName: coachName || "Kolu G. Brown",
        coachEmail: coachEmail || "dtwe.debate@gmail.com",
        coachPhone,
        opponentSchool: opponentSchool || "St. Mary Catholic High School",
        assignedSide: assignedSide || "Affirmative (Proposition)",
        matchDate: matchDate || "2025-11-15",
        matchTime: matchTime || "10:30 AM GMT",
        venue: venue || "D. Twe Memorial High Auditorium, New Kru Town",
        motion: motion || "This House Would Institute Mandatory Civic and Legal Education Across Liberian Secondary Schools.",
        motionInfoSlide: motionInfoSlide || "Context: Strengthening constitutional literacy and youth participation in national governance.",
        motionDomain: motionDomain || "Governance & Constitution",
        antiBiasHash: antiBiasHash || "YFC-FAIR-2025-A8F2",
        adjudicators: Array.isArray(adjudicators) && adjudicators.length > 0 ? adjudicators : [
          { name: "Cllr. Gloria Musu-Scott", role: "Chief Adjudicator", institution: "Liberia National Bar Forensics" },
          { name: "Dr. Togba-Nah Tipoteh", role: "Panelist", institution: "University of Liberia" }
        ],
        customNotes
      });

      res.json({ success: true, preview });
    } catch (error: any) {
      console.error("Coach fixture preview error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Batch Coach Fixture Alerts Dispatch Endpoint
  app.post("/api/batch-notify-coach-fixtures", async (req, res) => {
    try {
      const { notifications, configOverride } = req.body;

      if (!Array.isArray(notifications) || notifications.length === 0) {
        return res.status(400).json({ error: "notifications array must not be empty." });
      }

      const result = await sendBatchCoachFixtureAlerts(notifications, configOverride);
      res.json(result);
    } catch (error: any) {
      console.error("Batch coach fixture dispatch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to dispatch batch coach notifications: " + error.message
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Youth For Change Liberia server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
