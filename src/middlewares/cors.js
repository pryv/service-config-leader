/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
// Middleware to handle OPTIONS requests and to add CORS headers to all other
// requests.
module.exports = (req, res, next) => {
  // allow cross-domain requests (CORS)
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  // *
  res.header(
    'Access-Control-Allow-Methods',
    req.headers['access-control-request-method'] ||
      'POST, GET, PUT, OPTIONS, DELETE'
  );
  // *
  res.header(
    'Access-Control-Allow-Headers',
    req.headers['access-control-allow-headers'] || 'Authorization, Content-Type'
  );
  // *
  res.header('Access-Control-Max-Age', (60 * 60 * 24 * 365).toString());
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
};
