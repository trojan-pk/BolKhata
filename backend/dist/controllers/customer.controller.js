"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.updateCustomer = exports.getCustomerById = exports.createCustomer = exports.getCustomers = void 0;
const supabase_service_1 = require("../services/supabase.service");
const USER_ID = '00000000-0000-0000-0000-000000000000'; // mocked for hackathon
const getCustomers = async (req, res, next) => {
    try {
        const { data, error } = await supabase_service_1.supabase
            .from('customers')
            .select('*')
            .eq('user_id', USER_ID);
        if (error)
            throw error;
        res.json(data);
    }
    catch (error) {
        next(error);
    }
};
exports.getCustomers = getCustomers;
const createCustomer = async (req, res, next) => {
    try {
        const { name, phone } = req.body;
        const { data, error } = await supabase_service_1.supabase
            .from('customers')
            .insert({ user_id: USER_ID, name, phone, balance: 0 })
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
};
exports.createCustomer = createCustomer;
const getCustomerById = async (req, res, next) => {
    try {
        const { data, error } = await supabase_service_1.supabase
            .from('customers')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', USER_ID)
            .single();
        if (error)
            throw error;
        res.json(data);
    }
    catch (error) {
        next(error);
    }
};
exports.getCustomerById = getCustomerById;
const updateCustomer = async (req, res, next) => {
    try {
        const { name, phone } = req.body;
        const { data, error } = await supabase_service_1.supabase
            .from('customers')
            .update({ name, phone })
            .eq('id', req.params.id)
            .eq('user_id', USER_ID)
            .select()
            .single();
        if (error)
            throw error;
        res.json(data);
    }
    catch (error) {
        next(error);
    }
};
exports.updateCustomer = updateCustomer;
const deleteCustomer = async (req, res, next) => {
    try {
        const { error } = await supabase_service_1.supabase
            .from('customers')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', USER_ID);
        if (error)
            throw error;
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCustomer = deleteCustomer;
