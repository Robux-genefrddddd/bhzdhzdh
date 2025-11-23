import { useState, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import Turnstile from "react-turnstile";
import { getSiteKey, verifyCaptchaToken } from "@/lib/turnstile";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<any>(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const stars = useMemo(() => {
    return Array.from({ length: 100 }, () => ({
      width: Math.random() * 3 + 1,
      height: Math.random() * 3 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      opacity: Math.random() * 0.7 + 0.3,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
    }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!captchaToken) {
      setError("Please complete the captcha verification");
      return;
    }

    try {
      setIsLoading(true);

      const captchaVerification = await verifyCaptchaToken(captchaToken);
      if (!captchaVerification.success) {
        setError(captchaVerification.error || "Captcha verification failed");
        if (captchaRef.current) {
          captchaRef.current.reset();
        }
        setCaptchaToken("");
        return;
      }

      await register(formData.name, formData.email, formData.password);
      navigate("/");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Registration failed";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Starfield Background */}
      <div className="absolute inset-0 overflow-hidden">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: star.width + "px",
              height: star.height + "px",
              left: star.left + "%",
              top: star.top + "%",
              opacity: star.opacity,
              animation: `shootingStar ${star.duration}s infinite`,
              animationDelay: star.delay + "s",
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card Container */}
        <div
          className="rounded-2xl p-8 border overflow-hidden relative"
          style={{
            backgroundColor: "#0A0A0A",
            borderColor: "#1A1A1A",
            boxShadow: "0 0 40px rgba(255, 255, 255, 0.03)",
            animation:
              "slideUp 0.6s ease-out cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {/* Blue Wave Background Animation */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background:
                "linear-gradient(180deg, rgba(10, 132, 255, 0.15) 0%, rgba(10, 132, 255, 0.05) 50%, transparent 100%)",
              animation: "blueWave 4s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />

          {/* Animated border glow */}
          <div
            className="absolute inset-0 rounded-2xl opacity-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(10, 132, 255, 0.3), transparent)",
              animation: "borderGlow 3s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />

          <div className="relative z-10">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1
                className="text-3xl font-bold mb-2"
                style={{
                  color: "#FFFFFF",
                  animation: "fadeInDown 0.6s ease-out 0.1s both",
                }}
              >
                Créer mon compte
              </h1>
              <p
                className="text-sm"
                style={{
                  color: "#888888",
                  animation: "fadeInDown 0.6s ease-out 0.2s both",
                }}
              >
                Rejoignez-nous pour commencer
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div
                style={{
                  animation: "fadeInUp 0.6s ease-out 0.3s both",
                }}
              >
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#FFFFFF" }}
                >
                  Nom
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Votre nom complet"
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none transition-all duration-300"
                  style={{
                    backgroundColor: "#1A1A1A",
                    borderColor: "#2A2A2A",
                    color: "#FFFFFF",
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLElement).style.borderColor = "#0A84FF";
                    (e.target as HTMLElement).style.boxShadow =
                      "0 0 20px rgba(10, 132, 255, 0.2)";
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLElement).style.borderColor = "#2A2A2A";
                    (e.target as HTMLElement).style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Email Field */}
              <div
                style={{
                  animation: "fadeInUp 0.6s ease-out 0.4s both",
                }}
              >
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#FFFFFF" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none transition-all duration-300"
                  style={{
                    backgroundColor: "#1A1A1A",
                    borderColor: "#2A2A2A",
                    color: "#FFFFFF",
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLElement).style.borderColor = "#0A84FF";
                    (e.target as HTMLElement).style.boxShadow =
                      "0 0 20px rgba(10, 132, 255, 0.2)";
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLElement).style.borderColor = "#2A2A2A";
                    (e.target as HTMLElement).style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Password Field */}
              <div
                style={{
                  animation: "fadeInUp 0.6s ease-out 0.5s both",
                }}
              >
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#FFFFFF" }}
                >
                  Mot de passe
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Au moins 6 caractères"
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none transition-all duration-300"
                  style={{
                    backgroundColor: "#1A1A1A",
                    borderColor: "#2A2A2A",
                    color: "#FFFFFF",
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLElement).style.borderColor = "#0A84FF";
                    (e.target as HTMLElement).style.boxShadow =
                      "0 0 20px rgba(10, 132, 255, 0.2)";
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLElement).style.borderColor = "#2A2A2A";
                    (e.target as HTMLElement).style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="p-3 rounded-lg text-sm text-center"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    color: "#EF4444",
                    animation: "shake 0.5s ease-in-out",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Cloudflare Turnstile */}
              <div
                className="flex justify-center"
                style={{
                  animation: "fadeInUp 0.6s ease-out 0.55s both",
                }}
              >
                <Turnstile
                  ref={captchaRef}
                  sitekey={getSiteKey()}
                  onVerify={(token) => setCaptchaToken(token)}
                  onError={() => {
                    setError("Captcha verification failed. Please try again.");
                    setCaptchaToken("");
                  }}
                  onExpire={() => setCaptchaToken("")}
                  theme="dark"
                  language="fr"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg font-semibold transition-all duration-200 text-white mt-6 relative overflow-hidden group disabled:opacity-50"
                style={{
                  backgroundColor: "#0A84FF",
                  boxShadow: "0 0 20px rgba(10, 132, 255, 0.4)",
                  animation: "fadeInUp 0.6s ease-out 0.6s both",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 0 30px rgba(10, 132, 255, 0.6)";
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "#0070DD";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 0 20px rgba(10, 132, 255, 0.4)";
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "#0A84FF";
                  }
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span
                      className="inline-block w-4 h-4 rounded-full border-2 border-transparent"
                      style={{
                        borderTopColor: "#FFFFFF",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    Création en cours...
                  </span>
                ) : (
                  "Créer mon compte"
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <div
              className="text-center mt-6 text-sm"
              style={{
                color: "#888888",
                animation: "fadeInUp 0.6s ease-out 0.7s both",
              }}
            >
              Déjà un compte ?{" "}
              <a
                href="/login"
                className="font-semibold transition-colors duration-200"
                style={{
                  color: "#0A84FF",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#0070DD";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#0A84FF";
                }}
              >
                Se connecter
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shootingStar {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(100px);
            opacity: 0;
          }
        }

        @keyframes blueWave {
          0% {
            background: linear-gradient(180deg, rgba(10, 132, 255, 0.05) 0%, rgba(10, 132, 255, 0.02) 50%, transparent 100%);
          }
          50% {
            background: linear-gradient(180deg, rgba(10, 132, 255, 0.25) 0%, rgba(10, 132, 255, 0.1) 50%, transparent 100%);
          }
          100% {
            background: linear-gradient(180deg, rgba(10, 132, 255, 0.05) 0%, rgba(10, 132, 255, 0.02) 50%, transparent 100%);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes borderGlow {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(5px);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
