"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable. Supabase client will fail to initialize correctly.');
}
// Create a single supabase client for interacting with your database
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl || 'http://placeholder.com', supabaseKey || 'placeholder');
