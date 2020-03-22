import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';

export interface IStockBatch {
    quantity: number;
    costPerUnit: number;
    added: Date;
}

export interface IStockDecrementResult {
    stock: IStockBatch[];
    totalCost: number;
}

export enum InventoryTransactionType {
    Increment = 'increment',
    Decrement = 'decrement'
}

export interface IIncrementInventoryTransactionData {
    description: string;
    inventoryItemId: string;
    debitAccountId: string;
    creditAccountId: string;
    quantity: number;
    costPerUnit: number;
}

export interface IDecrementInventoryTransactionData {
    description: string;
    inventoryItemId: string;
    debitAccountId: string;
    creditAccountId: string;
    quantity: number;
}

export interface INewInventoryTransaction {
    inventoryItemId: string;
    financialUnitId: string;
    type: InventoryTransactionType;
    data: any;
    stock: IStockBatch[];
}

export interface IInventoryTransaction extends INewInventoryTransaction, Document {}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>({
    inventoryItemId: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true
    },
    financialUnitId: {
        type: Schema.Types.ObjectId,
        ref: 'FinancialUnit',
        required: true
    },
    type: {
        type: String,
        required: true
    },
    data: {
        type: Object,
        required: true
    },
    stock: {
        type: [{ quantity: Number, costPerUnit: Number, added: Date }],
        required: true
    }
});

export const InventoryTransactionModel = mongoose.model<IInventoryTransaction>(
    'InventoryTransaction', InventoryTransactionSchema
);