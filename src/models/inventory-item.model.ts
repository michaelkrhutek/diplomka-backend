import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';

export enum StockDecrementType {
    FIFO = 'fifo',
    LIFO = 'lifo',
    Average = 'average'
}

export interface INewInventoryItemData {
    name: string;
    financialUnitId: string;
}

export interface IInventoryItem extends INewInventoryItemData, Document {};

const InventoryItemSchema = new Schema<IInventoryItem>({
    name: {
        type: String,
        required: true
    },
    financialUnitId: {
        type: Schema.Types.ObjectId,
        ref: 'FinancialUnit',
        required: true
    }
});

export const InventoryItemModel = mongoose.model<IInventoryItem>(
    'InventoryItem', InventoryItemSchema
);