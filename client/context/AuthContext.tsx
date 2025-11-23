import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export type Plan = "Gratuit" | "Plus" | "Entreprise";

export interface User {
  id: string;
  name: string;
  email: string;
  plan: Plan;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePlan: (plan: Plan) => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!isMounted) return;

        if (firebaseUser) {
          try {
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            if (!isMounted) return;

            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUser({
                id: firebaseUser.uid,
                name: userData.name,
                email: firebaseUser.email || "",
                plan: userData.plan || "Gratuit",
              });
            } else {
              setUser({
                id: firebaseUser.uid,
                name: "",
                email: firebaseUser.email || "",
                plan: "Gratuit",
              });
            }
          } catch (docErr) {
            if (!isMounted) return;
            console.error("Error fetching user document:", docErr);
            setError(docErr instanceof Error ? docErr.message : "Failed to load user profile");
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error in auth state change:", err);
        setError(err instanceof Error ? err.message : "Failed to load user");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      try {
        unsubscribe();
      } catch (err) {
        console.error("Error unsubscribing from auth:", err);
      }
      isMounted = false;
    };
  }, []);

  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), {
        name,
        email,
        plan: "Gratuit",
        createdAt: new Date().toISOString(),
      });

      // Set local user state (onAuthStateChanged will also trigger)
      setUser({
        id: firebaseUser.uid,
        name,
        email,
        plan: "Gratuit",
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Registration failed";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      // Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({
          id: firebaseUser.uid,
          name: userData.name,
          email: firebaseUser.email || "",
          plan: userData.plan || "Gratuit",
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Login failed";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Logout failed";
      setError(errorMsg);
      throw err;
    }
  };

  const updatePlan = async (plan: Plan): Promise<void> => {
    if (!user) return;

    try {
      setError(null);
      // Update user plan in Firestore
      await setDoc(doc(db, "users", user.id), { plan }, { merge: true });

      // Update local state
      setUser({ ...user, plan });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update plan";
      setError(errorMsg);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        register,
        login,
        logout,
        updatePlan,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
