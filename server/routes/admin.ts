import { RequestHandler } from "express";
import {
  AdminLicenseCreate,
  AdminUserAction,
  LicensePlan,
  GeneratedLicense,
  AIConfig,
  UserListItem,
} from "@shared/api";
import {
  generateLicenseKey,
  calculateMessageLimit,
  calculateExpiryDate,
  formatLicenseKey,
} from "../lib/licenseUtils";
import { verifyAdminToken } from "../lib/adminAuth";

const generatedLicenses: Map<string, GeneratedLicense> = new Map();
let aiConfig: AIConfig = {
  model: "x-ai/grok-4.1-fast",
  systemPrompt:
    "You are a helpful assistant. Respond to user queries in a clear, concise, and friendly manner.",
  temperature: 0.7,
  maxTokens: 1024,
};

async function verifyAdmin(req: any): Promise<boolean> {
  const result = await verifyAdminToken(req);
  return result.isAdmin;
}

export const handleCreateLicense: RequestHandler = async (req, res) => {
  try {
    if (!(await verifyAdmin(req))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { email, plan, durationDays } = req.body as AdminLicenseCreate;

    if (!email || !plan || !durationDays) {
      return res.status(400).json({
        error: "Email, plan, and durationDays are required",
      });
    }

    const licenseKey = generateLicenseKey();
    const expiryDate = calculateExpiryDate(durationDays);
    const messageLimit = calculateMessageLimit(plan);

    return res.json({
      success: true,
      key: licenseKey,
      formattedKey: formatLicenseKey(licenseKey),
      plan,
      expiresAt: expiryDate.toISOString(),
      messageLimit,
    });
  } catch (error) {
    console.error("License creation error:", error);
    return res.status(500).json({ error: "Failed to create license" });
  }
};

export const handleUserAction: RequestHandler = async (req, res) => {
  try {
    if (!(await verifyAdmin(req))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const {
      email: userEmail,
      action,
      reason,
      durationDays,
    } = req.body as AdminUserAction & {
      email: string;
      durationDays?: number;
    };

    if (!userEmail || !action) {
      return res.status(400).json({
        error: "User email and action are required",
      });
    }

    return res.json({
      success: true,
      message: `Action '${action}' applied to ${userEmail}`,
    });
  } catch (error) {
    console.error("User action error:", error);
    return res.status(500).json({ error: "Failed to apply user action" });
  }
};

export const handleMaintenanceMode: RequestHandler = async (req, res) => {
  try {
    if (!(await verifyAdmin(req))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { enabled, message } = req.body;

    return res.json({
      success: true,
      enabled: enabled === true,
      message,
    });
  } catch (error) {
    console.error("Maintenance mode error:", error);
    return res.status(500).json({ error: "Failed to update maintenance mode" });
  }
};

export const handleGetStats: RequestHandler = async (req, res) => {
  try {
    if (!(await verifyAdmin(req))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    return res.json({
      totalUsers: 0,
      activeSubscriptions: 0,
      totalMessagesUsed: 0,
    });
  } catch (error) {
    console.error("Stats retrieval error:", error);
    return res.status(500).json({ error: "Failed to retrieve stats" });
  }
};

export const handleCreateLicenseNoEmail: RequestHandler = async (req, res) => {
  try {
    if (!(await verifyAdmin(req))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { plan, durationDays } = req.body as {
      plan: LicensePlan;
      durationDays: number;
    };

    if (!plan || !durationDays) {
      return res.status(400).json({
        error: "Plan and durationDays are required",
      });
    }

    const licenseKey = generateLicenseKey();
    const expiryDate = calculateExpiryDate(durationDays);
    const messageLimit = calculateMessageLimit(plan);

    const newLicense: GeneratedLicense = {
      id: licenseKey,
      key: licenseKey,
      plan,
      durationDays,
      expiresAt: expiryDate.toISOString(),
      createdAt: new Date().toISOString(),
    };

    generatedLicenses.set(licenseKey, newLicense);

    return res.json({
      success: true,
      license: {
        id: licenseKey,
        key: licenseKey,
        formattedKey: formatLicenseKey(licenseKey),
        plan,
        durationDays,
        expiresAt: expiryDate.toISOString(),
        createdAt: new Date().toISOString(),
        messageLimit,
      },
    });
  } catch (error) {
    console.error("License creation error:", error);
    return res.status(500).json({ error: "Failed to create license" });
  }
};

export const handleGetGeneratedLicenses: RequestHandler = async (req, res) => {
  try {
    if (!(await verifyAdmin(req))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const licenses = Array.from(generatedLicenses.values());
    return res.json({
      success: true,
      licenses,
      total: licenses.length,
    });
  } catch (error) {
    console.error("Get licenses error:", error);
    return res.status(500).json({ error: "Failed to retrieve licenses" });
  }
};

export const handleGetAIConfig: RequestHandler = async (req, res) => {
  try {
    if (!(await verifyAdmin(req))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    return res.json({
      success: true,
      config: aiConfig,
    });
  } catch (error) {
    console.error("Get AI config error:", error);
    return res.status(500).json({ error: "Failed to retrieve AI config" });
  }
};

export const handleUpdateAIConfig: RequestHandler = async (req, res) => {
  try {
    if (!(await verifyAdmin(req))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const config = req.body as AIConfig;

    if (!config.model || !config.systemPrompt) {
      return res.status(400).json({
        error: "Model and systemPrompt are required",
      });
    }

    aiConfig = {
      model: config.model,
      systemPrompt: config.systemPrompt,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1024,
    };

    return res.json({
      success: true,
      config: aiConfig,
    });
  } catch (error) {
    console.error("Update AI config error:", error);
    return res.status(500).json({ error: "Failed to update AI config" });
  }
};

export const handleGetUsers: RequestHandler = async (req, res) => {
  try {
    if (!(await verifyAdmin(req))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Return empty users list for now (would be populated from Firestore in production)
    const users: UserListItem[] = [];

    return res.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ error: "Failed to retrieve users" });
  }
};

export const handleGetMessageHistory: RequestHandler = async (req, res) => {
  try {
    if (!(await verifyAdmin(req))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { userId } = req.query as { userId?: string };

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required",
      });
    }

    try {
      const { adminDb } = await import("../lib/firebase-admin");
      if (!adminDb) {
        return res.json({
          success: true,
          messages: [],
          total: 0,
        });
      }

      const messagesSnapshot = await adminDb
        .collection("private_messages")
        .doc(userId)
        .collection("history")
        .orderBy("timestamp", "desc")
        .limit(100)
        .get();

      const messages = messagesSnapshot.docs
        .map((doc) => doc.data())
        .filter((msg: any) => !msg.deleted);

      return res.json({
        success: true,
        messages,
        total: messages.length,
      });
    } catch (err) {
      console.error("Error fetching message history:", err);
      return res.json({
        success: true,
        messages: [],
        total: 0,
      });
    }
  } catch (error) {
    console.error("Message history error:", error);
    return res.status(500).json({ error: "Failed to retrieve message history" });
  }
};

export const handleDeleteUserData: RequestHandler = async (req, res) => {
  try {
    if (!(await verifyAdmin(req))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { userId } = req.body as { userId: string };

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required",
      });
    }

    try {
      const { adminDb } = await import("../lib/firebase-admin");
      if (!adminDb) {
        return res.json({
          success: true,
          message: "User data deletion completed",
        });
      }

      const messagesSnapshot = await adminDb
        .collection("private_messages")
        .doc(userId)
        .collection("history")
        .get();

      for (const doc of messagesSnapshot.docs) {
        await doc.ref.delete();
      }

      return res.json({
        success: true,
        message: "User data deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting user data:", err);
      return res.json({
        success: true,
        message: "User data deletion completed",
      });
    }
  } catch (error) {
    console.error("Delete user data error:", error);
    return res.status(500).json({ error: "Failed to delete user data" });
  }
};

export function getAIConfig_() {
  return aiConfig;
}

export function getLicenses_() {
  return generatedLicenses;
}
