const logger = (req, res, next) => {
  const start = Date.now();

  console.log("📥 Incoming Request:", {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
  });

  res.on("finish", () => {
    console.log("📤 Response:", {
      status: res.statusCode,
      time: `${Date.now() - start}ms`,
    });
  });

  next();
};

module.exports = logger;