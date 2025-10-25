import { rateLimit } from "express-rate-limit";

const limit = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  message: { error: "Too many requests, retry in 60 seconds" },
});

export default limit;
