import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';
import { IPlainMongooseDoc } from './plain-mongoose-doc.model';
import { IInventoryItemDoc } from './inventory-item.model';
import { IFinancialAccountDoc } from './financial-account.model';
import { IFinancialUnitDoc } from './financial-unit.model';
import { IUserDoc } from './user.model';

interface IFinancialTransactionBase {
    effectiveDate: Date;
    amount: number;
    inventoryTransaction: string;
    inventoryItemTransactionIndex: number;
    isDerivedTransaction: boolean;
    inventoryTransactionForcingDerivation: string | null;
    isActive?: boolean;
    created: Date;
}

interface IReferences {
    financialUnit: IFinancialUnitDoc['_id'];
    inventoryItem: IInventoryItemDoc['_id'];
    debitAccount: IFinancialAccountDoc['_id'];
    creditAccount: IFinancialAccountDoc['_id'];
    creator: IUserDoc['_id'];
}

interface IPopulatedReferences {
    financialUnit: IFinancialUnitDoc['_id'];
    inventroryItem: IInventoryItemDoc,
    debitAccount: IFinancialAccountDoc;
    creditAccount: IFinancialAccountDoc;
    creator: IUserDoc;
}

export interface INewFinancialTransaction extends IFinancialTransactionBase, IReferences {}
export interface IFinancialTransaction extends IFinancialTransactionBase, IReferences, IPlainMongooseDoc {}
export interface IFinancialTransactionDoc extends IFinancialTransactionBase, IReferences, Document {}
export interface IFinancialTransactionPopulatedDoc extends IFinancialTransactionBase, IPopulatedReferences, Document {}

const FinancialTransactionSchema = new Schema<IFinancialTransaction>({
    financialUnit: {
        type: Schema.Types.ObjectId,
        ref: 'FinancialUnit',
        required: true
    },
    inventoryItem: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true
    },
    inventoryTransaction: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryTransaction',
        required: true
    },
    inventoryItemTransactionIndex: {
        type: Number,
        required: true
    },
    debitAccount: {
        type: Schema.Types.ObjectId,
        ref: 'FinancialAccount',
        required: true
    },
    creditAccount: {
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
    inventoryTransactionForcingDerivation: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryTransaction',
        default: null
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    created: {
        type: Date,
        required: true
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

export const FinancialTransactionModel = mongoose.model<IFinancialTransactionDoc>(
    'FinancialTransaction', FinancialTransactionSchema
);