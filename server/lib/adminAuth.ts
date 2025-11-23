import { getAuth } from "firebase-admin/auth";
import { Request } from "express";

export async function verifyAdminToken(req: Request): Promise<{
  isAdmin: boolean;
  uid?: string;
  email?: string;
}> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { isAdmin: false };
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);
    
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
    const userRecord = await getAuth().getUser(uid);
    const customClaims = userRecord.customClaims || {};
    return customClaims.admin === true;
  } catch (err) {
    return false;
  }
}

export async function setAdminRole(uid: string): Promise<void> {
  try {
    await getAuth().setCustomUserClaims(uid, { admin: true });
  } catch (err) {
    console.error("Error setting admin role:", err);
    throw err;
  }
}

export async function removeAdminRole(uid: string): Promise<void> {
  try {
    await getAuth().setCustomUserClaims(uid, { admin: false });
  } catch (err) {
    console.error("Error removing admin role:", err);
    throw err;
  }
}
