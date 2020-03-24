import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';

export interface INewFinancialTrasactionData {
    inventoryTransactionId: string;
    inventoryItemId: string;
    financialUnitId: string;
    debitAccountId: string;
    creditAccountId: string;
    effectiveDate: Date;
    amount: number;
}

export interface IFinancialTransaction extends INewFinancialTrasactionData, Document {};

const FinancialTransactionSchema = new Schema<IFinancialTransaction>({
    financialUnitId: {
        type: Schema.Types.ObjectId,
        ref: 'FinancialUnit',
        required: true
    },
    inventoryItemId: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true
    },
    inventoryTransactionId: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryTransaction',
        required: true
    },
    debitAccountId: {
        type: Schema.Types.ObjectId,
        ref: 'FinancialAccount',
        required: true
    },
    creditAccountId: {
        type: Schema.Types.ObjectId,
        ref: 'FinancialAccount',
        required: true
    },
    effectiveDate: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
});

export const FinancialTransactionModel = mongoose.model<IFinancialTransaction>(
    'FinancialTransaction', FinancialTransactionSchema
);