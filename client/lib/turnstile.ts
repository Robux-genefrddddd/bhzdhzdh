export interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  error?: string;
}

export const verifyCaptchaToken = async (
  token: string,
): Promise<TurnstileVerifyResponse> => {
  try {
    const response = await fetch("/api/captcha/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Captcha verification failed",
      };
    }

    return data;
  } catch (error) {
    console.error("Captcha verification error:", error);
    return {
      success: false,
      error: "Unable to verify captcha. Please try again.",
    };
  }
};

export const getSiteKey = (): string => {
  return import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || "";
};
