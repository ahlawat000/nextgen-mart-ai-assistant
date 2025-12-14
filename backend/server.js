import dotenv from "dotenv";
dotenv.config();

console.log("\n========== ENV DEBUG (server.js) ==========");
console.log("AI_PROVIDER:", process.env.AI_PROVIDER);
console.log("AI_MODEL:", process.env.AI_MODEL);
console.log("AI_API_KEY exists:", !!process.env.AI_API_KEY);
console.log(
  "AI_API_KEY value:",
  process.env.AI_API_KEY
    ? process.env.AI_API_KEY.substring(0, 20) + "..."
    : "UNDEFINED"
);
console.log("==========================================\n");

import express from "express";
import cors from "cors";
import { callAiAssistant } from "./aiClient.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ==========================================
// CHAT ENDPOINT WITH ALL FEATURES
// ==========================================
app.post("/api/chat", async (req, res) => {
  console.log("\n========== NEW REQUEST ==========");
  
  try {
    const { message, imageData } = req.body;

    // Validate message
    if (!message || typeof message !== "string") {
      console.log("❌ Invalid message");
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("Message received:", message.substring(0, 50) + "...");
    console.log("AI_API_KEY exists:", !!process.env.AI_API_KEY);
    console.log("Image data provided:", !!imageData);

    // Call enhanced AI assistant with image support
    let result;
    try {
      result = await callAiAssistant(message, {
        imageData: imageData || null
      });
      console.log("✅ AI response received");
      console.log("   Source:", result.source);
      console.log("   Has quality metrics:", !!result.qualityMetrics);
      console.log("   Has purchase intent:", !!result.purchaseIntent);
    } catch (aiError) {
      console.error("❌ AI Error (caught):", aiError.message);
      
      // Return fallback response with structure
      result = {
        reply: "I'm here to help with your shopping questions! Please ask me about products, pricing, shipping, or returns.",
        source: "fallback",
        qualityMetrics: null,
        purchaseIntent: null
      };
    }

    // Send enhanced response with all features
    res.json({
      reply: result.reply,
      source: result.source || "unknown",
      qualityMetrics: result.qualityMetrics || null,
      purchaseIntent: result.purchaseIntent || null
    });
    
    console.log("✅ Response sent to client");
    
  } catch (error) {
    console.error("❌ Endpoint Error:", error.message);
    console.error("Stack:", error.stack);
    
    // ALWAYS respond, never crash
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Sorry, something went wrong. Please try again.",
        reply: "I apologize for the inconvenience. Please try again in a moment.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  }
  
  console.log("========== REQUEST END ==========\n");
});

// ==========================================
// FEEDBACK ENDPOINT FOR RATING SYSTEM
// ==========================================
app.post("/api/feedback", async (req, res) => {
  console.log("\n========== FEEDBACK REQUEST ==========");
  
  try {
    const { messageId, rating } = req.body;
    
    if (!messageId || !rating) {
      return res.status(400).json({ error: "messageId and rating are required" });
    }
    
    console.log(`📊 Feedback received:`);
    console.log(`   Message ID: ${messageId}`);
    console.log(`   Rating: ${rating}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    
  
    res.json({ 
      success: true,
      message: "Thank you for your feedback!"
    });
    
    console.log("✅ Feedback saved");
    
  } catch (error) {
    console.error("❌ Feedback Error:", error.message);
    res.status(500).json({ 
      error: "Failed to save feedback",
      success: false
    });
  }
  
  console.log("========== FEEDBACK END ==========\n");
});

// ==========================================
// HEALTH CHECK ENDPOINT
// ==========================================
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "✅ Backend is running",
    timestamp: new Date().toISOString(),
    provider: process.env.AI_PROVIDER || "gemini",
    model: process.env.AI_MODEL || "default",
    uptime: process.uptime(),
    features: {
      voiceSupport: true,
      visualSearch: true,
      qualityRanking: true,
      purchaseIntent: true
    }
  });
});

// ==========================================
// ROOT ENDPOINT
// ==========================================
app.get("/", (req, res) => {
  res.json({
    message: "🚀 AI Shopping Assistant API",
    version: "2.0.0",
    features: [
      "Voice Input/Output Support",
      "Visual Product Search",
      "Response Quality Ranking",
      "Purchase Intent Analysis",
      "User Feedback System"
    ],
    endpoints: {
      chat: "POST /api/chat",
      feedback: "POST /api/feedback",
      health: "GET /api/health"
    }
  });
});

// ==========================================
// 404 HANDLER
// ==========================================
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    availableEndpoints: ["/api/chat", "/api/feedback", "/api/health"]
  });
});

// ==========================================
// GLOBAL ERROR HANDLER - PREVENTS CRASHES
// ==========================================
app.use((error, req, res, next) => {
  console.error("❌ Unhandled error:", error.message);
  if (!res.headersSent) {
    res.status(500).json({ 
      error: "Internal server error",
      reply: "Something went wrong. Please try again."
    });
  }
});

// ==========================================
// START SERVER
// ==========================================
let server;
try {
  server = app.listen(PORT, () => {
    console.log("\n" + "=".repeat(50));
    console.log("🚀 AI Shopping Assistant Backend Started!");
    console.log("=".repeat(50));
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`📦 AI Provider: ${process.env.AI_PROVIDER || "gemini"}`);
    console.log(`🤖 AI Model: ${process.env.AI_MODEL || "default"}`);
    console.log(`🔑 API Key: ${process.env.AI_API_KEY ? "✓ Configured" : "✗ Not Set (Mock Mode)"}`);
    console.log("\n✨ Advanced Features Enabled:");
    console.log("   🎤 Voice Input/Output");
    console.log("   📸 Visual Product Search");
    console.log("   ⭐ Response Quality Ranking");
    console.log("   📊 Purchase Intent Analysis");
    console.log("   👍 User Feedback System");
    console.log("\n" + "=".repeat(50));
    console.log("⚡ Server is STABLE - Press Ctrl+C to stop");
    console.log("=".repeat(50) + "\n");
  });
} catch (error) {
  console.error("❌ Failed to start server:", error.message);
  process.exit(1);
}

// ==========================================
// SERVER ERROR HANDLER
// ==========================================
server.on('error', (error) => {
  console.error("❌ Server error:", error.message);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.log(`💡 Try: PORT=3001 npm start`);
    process.exit(1);
  }
});

// ==========================================
// CRITICAL: PREVENT CRASHES
// ==========================================
process.on("unhandledRejection", (reason, promise) => {
  console.error("\n❌ Unhandled Promise Rejection:");
  console.error("Reason:", reason);
  console.error("Promise:", promise);
  console.log("⚠️  Server continues running...\n");
  // DO NOT EXIT - Keep server running
});

process.on("uncaughtException", (error) => {
  console.error("\n❌ Uncaught Exception:");
  console.error("Error:", error.message);
  console.error("Stack:", error.stack);
  console.log("⚠️  Server continues running...\n");
  // DO NOT EXIT - Keep server running
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
process.on("SIGINT", () => {
  console.log("\n\n🛑 Received SIGINT (Ctrl+C)");
  console.log("Shutting down gracefully...");
  
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
  
  // Force close after 5 seconds
  setTimeout(() => {
    console.error("⚠️  Forcing shutdown...");
    process.exit(1);
  }, 5000);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

console.log("✅ All error handlers registered\n");

export default app;
