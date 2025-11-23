export interface HcaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  error?: string;
}

export const verifyCaptchaToken = async (
  token: string,
): Promise<HcaptchaVerifyResponse> => {
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
  const siteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

  if (!siteKey) {
    console.warn(
      "[hCaptcha] Warning: VITE_HCAPTCHA_SITE_KEY environment variable is not set. " +
        "hCaptcha widget will not render. Make sure your .env file includes VITE_HCAPTCHA_SITE_KEY."
    );
  }

  return siteKey || "";
};
