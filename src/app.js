const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const rateLimit  = require("express-rate-limit");
const blogRoutes = require('./routes/blog.routes');
const contactRoutes = require('./routes/contact.routes');


const app = express();

app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests, please try again later." },
}));
app.use(cors({
  origin: [process.env.CLIENT_URL, process.env.ADMIN_URL],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use("/api/auth",     require("./routes/auth.routes"));
app.use("/api/users",    require("./routes/user.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/admin",    require("./routes/admin.routes"));
app.use("/api/content",  require("./routes/content.routes"));
app.use('/api/blogs', blogRoutes);
app.use('/api/contact', contactRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running 🚀" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error("🔥", err.message);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || "Internal Server Error" });
});

module.exports = app;
