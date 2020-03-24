import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';
import { IPlainMongooseDoc } from './plain-mongoose-doc.model';

export interface INewFinancialTrasactionData {
    inventoryItemId: string;
    financialUnitId: string;
    debitAccountId: string;
    creditAccountId: string;
    effectiveDate: Date;
    amount: number;
    inventoryTransactionId: string;
    inventoryItemTransactionIndex: number;
    isDerivedTransaction: boolean;
    inventoryTransactionIdForcingDerivation: string | null;
    isActive?: boolean;
}

export interface IFinancialTransaction extends INewFinancialTrasactionData, IPlainMongooseDoc {};
export interface IFinancialTransactionDoc extends INewFinancialTrasactionData, Document {};

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
    inventoryItemTransactionIndex: {
        type: Number,
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
    },
    isDerivedTransaction: {
        type: Boolean,
        required: true,        
    },
    inventoryTransactionIdForcingDerivation: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryTransaction',
        default: null
    },
    isActive: {
        type: Boolean,
        default: false,
    },
});

export const FinancialTransactionModel = mongoose.model<IFinancialTransactionDoc>(
    'FinancialTransaction', FinancialTransactionSchema
);