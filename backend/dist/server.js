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
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Basic health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'BolKhata API is running' });
});
// Routes
app.use('/auth', auth_routes_1.default);
app.use('/customers', customer_routes_1.default);
app.use('/transactions', transaction_routes_1.default);
app.use('/voice', voice_routes_1.default);
app.use('/dashboard', dashboard_routes_1.default);
// Global Error Handler
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
