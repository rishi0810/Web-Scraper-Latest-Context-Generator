import { rateLimit } from "express-rate-limit";

const limit = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  message: { error: "Too many requests, retry in 60 seconds" },
  skip: (req) => {
    const apiKey = req.headers["x-api-key"];
    const rateLimitKey = process.env.RATE_LIMIT_KEY;
    return !!rateLimitKey && apiKey === rateLimitKey;
  },
});

export default limit;
