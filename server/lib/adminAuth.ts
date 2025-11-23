import { getAdminAuth } from "./firebase-admin";
import { Request } from "express";

export async function verifyAdminToken(req: Request): Promise<{
  isAdmin: boolean;
  uid?: string;
  email?: string;
}> {
  try {
    const adminAuth = await getAdminAuth();
    if (!adminAuth) {
      console.warn("Firebase Admin Auth not initialized");
      return { isAdmin: false };
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { isAdmin: false };
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);

    const customClaims = decodedToken.customClaims || {};
    const isAdmin = customClaims.admin === true;

    return {
      isAdmin,
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch (err) {
    return { isAdmin: false };
  }
}

export async function isAdminUser(uid: string): Promise<boolean> {
  try {
    const adminAuth = await getAdminAuth();
    if (!adminAuth) return false;
    const userRecord = await adminAuth.getUser(uid);
    const customClaims = userRecord.customClaims || {};
    return customClaims.admin === true;
  } catch (err) {
    return false;
  }
}

export async function setAdminRole(uid: string): Promise<void> {
  try {
    const adminAuth = await getAdminAuth();
    if (!adminAuth) throw new Error("Firebase Admin Auth not initialized");
    await adminAuth.setCustomUserClaims(uid, { admin: true });
  } catch (err) {
    console.error("Error setting admin role:", err);
    throw err;
  }
}

export async function removeAdminRole(uid: string): Promise<void> {
  try {
    const adminAuth = await getAdminAuth();
    if (!adminAuth) throw new Error("Firebase Admin Auth not initialized");
    await adminAuth.setCustomUserClaims(uid, { admin: false });
  } catch (err) {
    console.error("Error removing admin role:", err);
    throw err;
  }
}
