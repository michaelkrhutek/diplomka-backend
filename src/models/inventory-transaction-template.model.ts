import { InventoryTransactionType } from "./inventory-transaction.model";
import { IPlainMongooseDoc } from "./plain-mongoose-doc.model";
import { Document, Schema } from "mongoose";
import { mongoose } from "../mongoose-instance";

export interface INewInventoryTransactionTemplateData {
    description: string;
    transactionType: InventoryTransactionType;
    financialUnitId: string;
    inventoryGroupId: string;
    debitAccountId: string;
    creditAccountId: string;
}

export interface IInventoryTransactionTemplate extends INewInventoryTransactionTemplateData, IPlainMongooseDoc { }
export interface IInventoryTransactionTemplateDoc extends INewInventoryTransactionTemplateData, Document { }

const InventoryTransactionTemplateSchema = new Schema<IInventoryTransactionTemplateDoc>({
    description: {
        type: String,
        required: true
    },
    transactionType: {
        type: String,
        required: true
    },
    financialUnitId: {
        type: Schema.Types.ObjectId,
        ref: 'FinancialUnit',
        required: true
    },
    inventoryGroupId: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryGroup',
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
    }
});

export const InventoryTransactionTemplateModel = mongoose.model<IInventoryTransactionTemplateDoc>(
    'InventoryTransactionTemplate', InventoryTransactionTemplateSchema
);