import { RequestHandler } from "express";
import {
  LicenseVerificationRequest,
  LicenseVerificationResponse,
  Warning,
  SecurityAlert,
} from "@shared/api";
import { validateLicense, isLicenseExpired, getDaysRemaining } from "../lib/licenseUtils";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import app from "../lib/firebaseAdmin";

const db = getFirestore(app);

export const handleLicenseVerify: RequestHandler = async (req, res) => {
  try {
    const { email, licenseKey, deviceId }: LicenseVerificationRequest = req.body;

    if (!email || !deviceId) {
      return res.status(400).json({
        valid: false,
        error: "Email and device ID are required",
      });
    }

    let userRef = null;
    let userData = null;

    const usersQuery = query(
      collection(db, "users"),
      where("email", "==", email),
    );

    const usersSnapshot = await getDocs(usersQuery);

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      userRef = userDoc.ref;
      userData = userDoc.data();
    }

    if (!userData) {
      return res.status(404).json({
        valid: false,
        error: "User not found",
      });
    }

    const licenseRef = doc(db, "users", userData.id || userRef?.id || "", "license", "current");
    const licenseSnapshot = await getDoc(licenseRef);
    const licenseData = licenseSnapshot.data();

    if (!licenseData) {
      const alerts: SecurityAlert[] = [];
      const maintenanceMode = await getMaintenanceMode();

      return res.json({
        valid: false,
        plan: "Gratuit",
        messageLimit: 10,
        messageCount: userData.messageCount || 0,
        canSendMessage: (userData.messageCount || 0) < 10,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        warnings: [],
        isBanned: userData.isBanned || false,
        isSuspended: userData.isSuspended || false,
        alerts,
        maintenanceMode,
      } as LicenseVerificationResponse);
    }

    const isExpired = isLicenseExpired(licenseData.expiresAt);
    const daysRemaining = getDaysRemaining(licenseData.expiresAt);

    const validation = validateLicense(
      licenseData.plan,
      licenseData.messageCount || 0,
      licenseData.expiresAt,
      userData.isBanned || false,
      userData.isSuspended || false,
    );

    const alertsQuery = query(
      collection(db, "users", userData.id || userRef?.id || "", "warnings"),
      where("isRead", "==", false),
    );

    const alertsSnapshot = await getDocs(alertsQuery);
    const warnings: Warning[] = alertsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Warning));

    const alerts: SecurityAlert[] = [];

    if (isExpired && licenseData.plan !== "Gratuit") {
      alerts.push({
        type: "modal",
        title: "Licence Expirée",
        message: "Votre licence a expiré. Veuillez renouveler votre abonnement.",
        severity: "critical",
        dismissible: false,
      });
    } else if (daysRemaining <= 7 && daysRemaining > 0) {
      alerts.push({
        type: "banner",
        title: "Licence Expires Bientôt",
        message: `Votre licence expire dans ${daysRemaining} jour(s).`,
        severity: "warning",
        dismissible: true,
      });
    }

    if (userData.isBanned) {
      alerts.push({
        type: "modal",
        title: "Compte Banni",
        message: `Votre compte a été banni. Raison: ${userData.banReason || "Non spécifiée"}`,
        severity: "critical",
        dismissible: false,
      });
    }

    if (userData.isSuspended) {
      alerts.push({
        type: "modal",
        title: "Compte Suspendu",
        message: "Votre compte a été temporairement suspendu.",
        severity: "critical",
        dismissible: false,
      });
    }

    const maintenanceMode = await getMaintenanceMode();

    return res.json({
      valid: validation.valid,
      plan: licenseData.plan,
      messageLimit: licenseData.messageLimit || 0,
      messageCount: licenseData.messageCount || 0,
      canSendMessage:
        validation.valid &&
        licenseData.messageCount < licenseData.messageLimit &&
        !isExpired,
      expiresAt: licenseData.expiresAt,
      warnings,
      isBanned: userData.isBanned || false,
      isSuspended: userData.isSuspended || false,
      alerts,
      maintenanceMode,
    } as LicenseVerificationResponse);
  } catch (error) {
    console.error("License verification error:", error);
    return res.status(500).json({
      valid: false,
      error: "License verification failed",
    });
  }
};

export const handleLicenseActivate: RequestHandler = async (req, res) => {
  try {
    const { email, licenseKey, deviceId } = req.body;

    if (!email || !licenseKey || !deviceId) {
      return res.status(400).json({
        error: "Email, license key, and device ID are required",
      });
    }

    const usersQuery = query(
      collection(db, "users"),
      where("email", "==", email),
    );

    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    const licenseKeyClean = licenseKey.replace(/-/g, "").toUpperCase();

    const licenseKeysQuery = query(
      collection(db, "licenseKeys"),
      where("key", "==", licenseKeyClean),
      where("isActive", "==", true),
    );

    const licenseKeysSnapshot = await getDocs(licenseKeysQuery);

    if (licenseKeysSnapshot.empty) {
      return res.status(404).json({
        error: "Invalid or inactive license key",
      });
    }

    const licenseKeyDoc = licenseKeysSnapshot.docs[0];
    const licenseKeyData = licenseKeyDoc.data();

    if (licenseKeyData.usedBy && licenseKeyData.usedBy !== userId) {
      return res.status(403).json({
        error: "This license key is already in use by another account",
      });
    }

    const expiresAt = new Date(licenseKeyData.expiresAt);

    const userLicenseRef = doc(db, "users", userId, "license", "current");
    await updateDoc(userLicenseRef, {
      plan: licenseKeyData.plan,
      licenseKey: licenseKeyClean,
      expiresAt: expiresAt.toISOString(),
      isActive: true,
      messageCount: 0,
      messageLimit: licenseKeyData.messageLimit || 0,
      lastResetDate: new Date().toISOString(),
    }).catch(async () => {
      await setDoc(userLicenseRef, {
        plan: licenseKeyData.plan,
        licenseKey: licenseKeyClean,
        expiresAt: expiresAt.toISOString(),
        isActive: true,
        messageCount: 0,
        messageLimit: licenseKeyData.messageLimit || 0,
        lastResetDate: new Date().toISOString(),
        userId,
      });
    });

    await updateDoc(userDoc.ref, {
      isBanned: false,
      isSuspended: false,
    });

    const maintenanceMode = await getMaintenanceMode();

    return res.json({
      valid: true,
      plan: licenseKeyData.plan,
      messageLimit: licenseKeyData.messageLimit || 0,
      messageCount: 0,
      canSendMessage: true,
      expiresAt: expiresAt.toISOString(),
      warnings: [],
      isBanned: false,
      isSuspended: false,
      alerts: [],
      maintenanceMode,
    } as LicenseVerificationResponse);
  } catch (error) {
    console.error("License activation error:", error);
    return res.status(500).json({
      error: "License activation failed",
    });
  }
};

export const handleIncrementMessageCount: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    const usersQuery = query(
      collection(db, "users"),
      where("email", "==", email),
    );

    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    const licenseRef = doc(db, "users", userId, "license", "current");
    const licenseSnapshot = await getDoc(licenseRef);
    const licenseData = licenseSnapshot.data();

    if (!licenseData) {
      return res.status(404).json({
        error: "License not found",
      });
    }

    const newCount = (licenseData.messageCount || 0) + 1;

    await updateDoc(licenseRef, {
      messageCount: newCount,
    });

    return res.json({
      success: true,
      messageCount: newCount,
      messageLimit: licenseData.messageLimit,
    });
  } catch (error) {
    console.error("Increment message count error:", error);
    return res.status(500).json({
      error: "Failed to increment message count",
    });
  }
};

async function getMaintenanceMode(): Promise<boolean> {
  try {
    const configRef = doc(db, "config", "maintenance");
    const configSnapshot = await getDoc(configRef);
    return configSnapshot.data()?.enabled || false;
  } catch {
    return false;
  }
}

import { setDoc } from "firebase/firestore";
