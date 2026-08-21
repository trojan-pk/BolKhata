"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardInfo = void 0;
const supabase_service_1 = require("../services/supabase.service");
const USER_ID = '00000000-0000-0000-0000-000000000000'; // mocked
const getDashboardInfo = async (req, res, next) => {
    try {
        const { data: customers, error } = await supabase_service_1.supabase
            .from('customers')
            .select('balance')
            .eq('user_id', USER_ID);
        if (error)
            throw error;
        let totalUdhaar = 0;
        customers?.forEach(c => {
            if (Number(c.balance) > 0) {
                totalUdhaar += Number(c.balance);
            }
        });
        res.json({
            totalUdhaar,
            dueToday: 0 // Mocked for now
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardInfo = getDashboardInfo;
