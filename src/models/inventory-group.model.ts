import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';
import { IPlainMongooseDoc } from './plain-mongoose-doc.model';
import { StockDecrementType } from './stock.model';

export interface INewInventoryGroupData {
    name: string;
    financialUnitId: string;
    defaultStockDecrementType: StockDecrementType
}

export interface IInventoryGroup extends INewInventoryGroupData, IPlainMongooseDoc {};
export interface IInventoryGroupDoc extends INewInventoryGroupData, Document {};

const InventoryGroupSchema = new Schema<IInventoryGroup>({
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

export const InventoryGroupModel = mongoose.model<IInventoryGroupDoc>(
    'InventoryGroup', InventoryGroupSchema
);