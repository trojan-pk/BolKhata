"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_controller_1 = require("../controllers/transaction.controller");
const router = (0, express_1.Router)();
router.post('/', transaction_controller_1.createTransaction);
router.get('/customer/:id', transaction_controller_1.getTransactionsByCustomer);
exports.default = router;
