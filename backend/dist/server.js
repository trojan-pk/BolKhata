"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const voice_routes_1 = __importDefault(require("./routes/voice.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3000;
// Security & CORS Middleware
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.use(express_1.default.json({ limit: '15mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '15mb' }));
// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        app: 'BolKhata API',
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'BolKhata Voice Ledger API is running',
        version: '2.0.0',
    });
});
// App Routes
app.use('/auth', auth_routes_1.default);
app.use('/customers', customer_routes_1.default);
app.use('/transactions', transaction_routes_1.default);
app.use('/voice', voice_routes_1.default);
app.use('/dashboard', dashboard_routes_1.default);
// Global Error Handler
app.use(errorHandler_1.errorHandler);
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [BolKhata Backend] Running on http://0.0.0.0:${PORT} (Ready for Mobile & Web)`);
});
// Graceful Shutdown
const handleGracefulShutdown = (signal) => {
    console.log(`\n🛑 [BolKhata Backend] ${signal} signal received. Closing HTTP server gracefully...`);
    server.close(() => {
        console.log('✅ [BolKhata Backend] HTTP server closed cleanly.');
        process.exit(0);
    });
};
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
