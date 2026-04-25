// server/responseHelpers.js
import { config } from "./config.js";

export function ok(res, result = {}, meta = {}, statusCode = 200) {
  return res.status(statusCode).json({
    status: "ok",
    mode: config.mode,
    result,
    meta: {
      version: config.version,
      env: config.env,
      freeLimit: config.freeLimitPerMonth,
      ...meta,
    },
  });
}

export function fail(res, errorMessage, meta = {}, statusCode = 500) {
  return res.status(statusCode).json({
    status: "error",
    mode: config.mode,
    result: null,
    meta: {
      version: config.version,
      env: config.env,
      error: errorMessage,
      ...meta,
    },
  });
}