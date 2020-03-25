import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';
import { IPlainMongooseDoc } from './plain-mongoose-doc.model';

export interface INewInventoryItemData {
    name: string;
    financialUnitId: string;
    inventoryGroupId: string;
}

export interface IInventoryItem extends INewInventoryItemData, IPlainMongooseDoc {};
export interface IInventoryItemDoc extends INewInventoryItemData, Document {};

const InventoryItemSchema = new Schema<IInventoryItem>({
    name: {
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
});

export const InventoryItemModel = mongoose.model<IInventoryItemDoc>(
    'InventoryItem', InventoryItemSchema
);