"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactionsByCustomer = exports.createTransaction = void 0;
const supabase_service_1 = require("../services/supabase.service");
const USER_ID = '00000000-0000-0000-0000-000000000000'; // mocked
const createTransaction = async (req, res, next) => {
    try {
        const { customer_id, type, amount, description } = req.body;
        // We need to fetch customer to ensure they exist and get current balance
        const { data: customer, error: custError } = await supabase_service_1.supabase
            .from('customers')
            .select('*')
            .eq('id', customer_id)
            .eq('user_id', USER_ID)
            .single();
        if (custError || !customer) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        // Insert transaction
        const { data: transaction, error: txError } = await supabase_service_1.supabase
            .from('transactions')
            .insert({ customer_id, type, amount, description })
            .select()
            .single();
        if (txError)
            throw txError;
        // Update balance
        let newBalance = Number(customer.balance);
        if (type === 'CREDIT' || type === 'gave') {
            newBalance += Number(amount);
        }
        else if (type === 'PAYMENT' || type === 'got') {
            newBalance -= Number(amount);
        }
        const { error: updateError } = await supabase_service_1.supabase
            .from('customers')
            .update({ balance: newBalance })
            .eq('id', customer_id);
        if (updateError)
            throw updateError;
        res.status(201).json({ transaction, newBalance });
    }
    catch (error) {
        next(error);
    }
};
exports.createTransaction = createTransaction;
const getTransactionsByCustomer = async (req, res, next) => {
    try {
        const { data, error } = await supabase_service_1.supabase
            .from('transactions')
            .select('*')
            .eq('customer_id', req.params.id)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        res.json(data);
    }
    catch (error) {
        next(error);
    }
};
exports.getTransactionsByCustomer = getTransactionsByCustomer;
