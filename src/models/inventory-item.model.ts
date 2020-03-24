import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';
import { IPlainMongooseDoc } from './plain-mongoose-doc.model';

export enum StockDecrementType {
    FIFO = 'fifo',
    LIFO = 'lifo',
    Average = 'average'
}

export interface INewInventoryItemData {
    name: string;
    financialUnitId: string;
    defaultStockDecrementType: StockDecrementType
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
    defaultStockDecrementType: {
        type: String,
        required: true
    }
});

export const InventoryItemModel = mongoose.model<IInventoryItemDoc>(
    'InventoryItem', InventoryItemSchema
);