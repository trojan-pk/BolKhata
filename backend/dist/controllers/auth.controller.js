"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.login = exports.signup = void 0;
const signup = async (req, res, next) => {
    try {
        // TODO: Implement signup using Supabase Auth
        res.status(501).json({ error: 'Not Implemented' });
    }
    catch (error) {
        next(error);
    }
};
exports.signup = signup;
const login = async (req, res, next) => {
    try {
        // TODO: Implement login using Supabase Auth
        res.status(501).json({ error: 'Not Implemented' });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const me = async (req, res, next) => {
    try {
        // TODO: Return current user based on auth middleware
        res.status(501).json({ error: 'Not Implemented' });
    }
    catch (error) {
        next(error);
    }
};
exports.me = me;
