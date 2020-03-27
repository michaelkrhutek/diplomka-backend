import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';
import { IPlainMongooseDoc } from './plain-mongoose-doc.model';
import { StockDecrementType } from './stock.model';
import { IFinancialUnitDoc } from './financial-unit.model';

interface IInventoryGroupBase {
    name: string;
    defaultStockDecrementType: StockDecrementType
}

interface IReferences {
    financialUnit: IFinancialUnitDoc['_id'];
}

interface IPopulatedReferences {
    financialUnit: IFinancialUnitDoc['_id'];
}

export interface INewInventoryGroup extends IInventoryGroupBase, IReferences {}
export interface IInventoryGroup extends IInventoryGroupBase, IReferences, IPlainMongooseDoc {}
export interface IInventoryGroupDoc extends IInventoryGroupBase, IReferences, Document {}
export interface IInventoryGroupPopulatedDoc extends IInventoryGroupBase, IPopulatedReferences, Document {}

const InventoryGroupSchema = new Schema<IInventoryGroup>({
    name: {
        type: String,
        required: true
    },
    financialUnit: {
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