import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';
import { IPlainMongooseDoc } from './plain-mongoose-doc.model';
import { IInventoryGroupDoc } from './inventory-group.model';
import { IFinancialUnitDoc } from './financial-unit.model';

interface IInventoryItemBase {
    name: string;
}

interface IReferences {
    financialUnit: IFinancialUnitDoc['_id'];
    inventoryGroup: IInventoryGroupDoc['_id'];
}

interface IPopulatedReferences {
    financialUnit: IFinancialUnitDoc['_id'];
    inventoryGroup: IInventoryGroupDoc;
}

export interface INewInventoryItem extends IInventoryItemBase, IReferences {}
export interface IInventoryItem extends IInventoryItemBase, IReferences, IPlainMongooseDoc {}
export interface IInventoryItemDoc extends IInventoryItemBase, IReferences, Document {}
export interface IInventoryItemPopulatedDoc extends IInventoryItemBase, IPopulatedReferences, Document {}

const InventoryItemSchema = new Schema<IInventoryItem>({
    name: {
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
});

export const InventoryItemModel = mongoose.model<IInventoryItemDoc>(
    'InventoryItem', InventoryItemSchema
);