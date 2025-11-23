import { RequestHandler } from "express";

interface CaptchaVerifyRequest {
  token: string;
}

interface CaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  error_codes?: string[];
  score?: number;
  action?: string;
}

export const handleCaptchaVerify: RequestHandler = async (req, res) => {
  try {
    const { token } = req.body as CaptchaVerifyRequest;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Captcha token is required",
      });
    }

    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error("Cloudflare Turnstile secret key not configured");
      return res.status(500).json({
        success: false,
        error: "Captcha verification service misconfigured",
      });
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
        }),
      },
    );

    if (!response.ok) {
      console.error("Cloudflare API error:", response.statusText);
      return res.status(500).json({
        success: false,
        error: "Failed to verify captcha",
      });
    }

    const data = (await response.json()) as CaptchaVerifyResponse;

    if (!data.success) {
      return res.status(403).json({
        success: false,
        error: "Captcha verification failed",
        error_codes: data.error_codes,
      });
    }

    res.json({
      success: true,
      challenge_ts: data.challenge_ts,
      hostname: data.hostname,
    });
  } catch (error) {
    console.error("Captcha verification error:", error);
    res.status(500).json({
      success: false,
      error: "Captcha verification failed",
    });
  }
};
