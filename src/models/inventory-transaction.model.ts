import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';
import { IPlainMongooseDoc } from './plain-mongoose-doc.model';

export interface IStockBatch {
    quantity: number;
    costPerUnit: number;
    added: Date;
    transactionIndex: number;
}

export interface IStockQuantityChangeResult {
    stock: IStockBatch[];
    changeCost: number;
}

export interface IStockMetrics {
    totalCost: number;
    totalQuantity: number;
}

export enum InventoryTransactionType {
    Increment = 'increment',
    Decrement = 'decrement'
}

export interface IIncrementInventoryTransactionSpecificData {
    quantity: number;
    costPerUnit: number;
};

export interface IDecrementInventoryTransactionSpecificData {
    quantity: number;
}

export interface INewInventoryTransactionRequestData<SpecificData> {
    inventoryItemId: string;
    description: string;
    effectiveDate: Date;
    addBeforeTransactionWithIndex?: number;
    debitAccountId: string;
    creditAccountId: string;
    specificData: SpecificData;
}

export interface INewInventoryTransaction<SpecificData> {
    type: InventoryTransactionType;
    inventoryItemId: string;
    description: string;
    effectiveDate: Date;
    debitAccountId: string;
    creditAccountId: string;
    specificData: SpecificData;
    totalTransactionAmount: number;
    stock: IStockBatch[];
    financialUnitId: string;
    inventoryItemTransactionIndex: number;
    isDerivedTransaction: boolean;
    transactionIdForcingDerivation: string | null;
    isActive?: boolean;
}

export interface IInventoryTransaction<SpecificData> extends INewInventoryTransaction<SpecificData>, IPlainMongooseDoc {}
export interface IInventoryTransactionDoc<SpecificData> extends INewInventoryTransaction<SpecificData>, Document {}

const InventoryTransactionSchema = new Schema<IInventoryTransaction<any>>({
    type: {
        type: String,
        required: true
    },
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
    description: {
        type: String,
        required: true
    },
    effectiveDate: {
        type: Date,
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
    totalTransactionAmount: {
        type: Number,
        required: true
    },
    stock: {
        type: [{ quantity: Number, costPerUnit: Number, added: Date, transactionIndex: Number }],
        required: true
    },
    specificData: {
        type: Object,
        required: true
    },
    isDerivedTransaction: {
        type: Boolean,
        required: true,        
    },
    transactionIdForcingDerivation: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryTransaction',
        default: null
    },
    isActive: {
        type: Boolean,
        default: false,
    },
});

export const InventoryTransactionModel = mongoose.model<IInventoryTransactionDoc<any>>(
    'InventoryTransaction', InventoryTransactionSchema
);