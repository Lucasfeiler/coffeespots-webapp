import rateLimit from 'express-rate-limit';

function limiter(windowMs, max, message) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
  });
}

export const authLimiter = limiter(15 * 60 * 1000, 20, 'Too many attempts. Please try again in a few minutes.');

export const forgotPasswordLimiter = limiter(60 * 60 * 1000, 5, 'Too many password reset requests. Please try again later.');

export const writeLimiter = limiter(60 * 60 * 1000, 30, 'Too many submissions. Please try again later.');
