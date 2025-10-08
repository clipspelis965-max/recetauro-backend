module.exports = (req, res) => {
  res.status(200).json({
    ok: true,
    msg: "Recetauro API",
    routes: ["/api/hello", "/api/test-openai", "/api/chat"]
  });
};