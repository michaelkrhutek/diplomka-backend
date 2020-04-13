import { InventoryTransactionType } from "./inventory-transaction.model";
import { IPlainMongooseDoc } from "./plain-mongoose-doc.model";
import { Document, Schema } from "mongoose";
import { mongoose } from "../mongoose-instance";
import { IInventoryGroupDoc } from "./inventory-group.model";
import { IFinancialAccountDoc } from "./financial-account.model";
import { IFinancialUnitDoc } from "./financial-unit.model";

export interface INewInventoryTransactionTemplateRequestData {
    description: string;
    inventoryGroupId: string;
    transactionType: string;
    debitAccountId: string;
    creditAccountId: string;
    saleDebitAccountId?: string;
    saleCreditAccountId?: string;
}

export interface IInventoryTransactionTemplateBase {
    description: string;
    transactionType: InventoryTransactionType;
}

interface IReferences {
    financialUnit: IFinancialUnitDoc['_id'];
    inventoryGroup: IInventoryGroupDoc['_id'];
    debitAccount: IFinancialAccountDoc['_id'];
    creditAccount: IFinancialAccountDoc['_id'];
    saleDebitAccount?: IFinancialAccountDoc['_id'];
    saleCreditAccount?: IFinancialAccountDoc['_id'];
}

interface IPopulatedReferences {
    financialUnit: IFinancialUnitDoc['_id'];
    inventoryGroup: IInventoryGroupDoc;
    debitAccount: IFinancialAccountDoc;
    creditAccount: IFinancialAccountDoc;
    saleDebitAccount?: IFinancialAccountDoc;
    saleCreditAccount?: IFinancialAccountDoc;
}

export interface INewInventoryTransactionTemplate extends IInventoryTransactionTemplateBase, IReferences {}
export interface IInventoryTransactionTemplate extends IInventoryTransactionTemplateBase, IReferences, IPlainMongooseDoc {}
export interface IInventoryTransactionTemplateDoc extends IInventoryTransactionTemplateBase, IReferences, Document {}
export interface IInventoryTransactionTemplatePopulatedDoc extends IInventoryTransactionTemplateBase, IPopulatedReferences, Document {}

const InventoryTransactionTemplateSchema = new Schema<IInventoryTransactionTemplateDoc>({
    description: {
        type: String,
        required: true
    },
    transactionType: {
        type: String,
        required: true
    },
    financialUnit: {
        type: Schema.Types.ObjectId,
        ref: 'FinancialUnit',
        required: true
    },
    inventoryGroup: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryGroup',
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
    saleDebitAccount: {
        type: Schema.Types.ObjectId,
        ref: 'FinancialAccount'
    },
    saleCreditAccount: {
        type: Schema.Types.ObjectId,
        ref: 'FinancialAccount'
    }
});

export const InventoryTransactionTemplateModel = mongoose.model<IInventoryTransactionTemplateDoc>(
    'InventoryTransactionTemplate', InventoryTransactionTemplateSchema
);