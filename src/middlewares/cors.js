// @flow

// Middleware to handle OPTIONS requests and to add CORS headers to all other
// requests.

module.exports = (
  req: express$Request,
  res: express$Response,
  next: express$NextFunction
) => {
  // allow cross-domain requests (CORS)
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  // *
  res.header(
    "Access-Control-Allow-Methods",
    req.headers["access-control-request-method"] ||
      "POST, GET, PUT, OPTIONS, DELETE"
  );
  // *
  res.header(
    "Access-Control-Allow-Headers",
    req.headers["access-control-allow-headers"] || "Authorization, Content-Type"
  );
  // *
  res.header("Access-Control-Max-Age", (60 * 60 * 24 * 365).toString());
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method == "OPTIONS") {
    res.sendStatus(200);
    return;
  }

  next();
};
