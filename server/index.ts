import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleChat } from "./routes/chat";
import { handleSecurityCheck } from "./routes/security";
import { handleCaptchaVerify } from "./routes/captcha";
import {
  handleLicenseVerify,
  handleLicenseActivate,
  handleIncrementMessageCount,
} from "./routes/license";
import {
  handleCreateLicense,
  handleUserAction,
  handleMaintenanceMode,
  handleGetStats,
  handleCreateLicenseNoEmail,
  handleGetGeneratedLicenses,
  handleGetAIConfig,
  handleUpdateAIConfig,
  handleGetUsers,
} from "./routes/admin";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Chat API route
  app.post("/api/chat", handleChat);

  // Security check route
  app.post("/api/security/check", handleSecurityCheck);

  // Captcha verification route
  app.post("/api/captcha/verify", handleCaptchaVerify);

  // License routes
  app.post("/api/license/verify", handleLicenseVerify);
  app.post("/api/license/activate", handleLicenseActivate);
  app.post("/api/license/increment", handleIncrementMessageCount);

  // Admin routes
  app.post("/api/admin/license/create", handleCreateLicense);
  app.post("/api/admin/user/action", handleUserAction);
  app.post("/api/admin/maintenance", handleMaintenanceMode);
  app.get("/api/admin/stats", handleGetStats);

  return app;
}
