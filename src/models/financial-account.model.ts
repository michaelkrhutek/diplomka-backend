import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';
import { IPlainMongooseDoc } from './plain-mongoose-doc.model';
import { IFinancialUnitDoc } from './financial-unit.model';

export interface IFinancialAccountBase {
    name: string;
    code: string;
}

interface IReferences {
    financialUnit: IFinancialUnitDoc['_id'];
}

interface IPopulatedReferences {
    financialUnit: IFinancialUnitDoc['_id'];
}

export interface INewFinancialAccount extends IFinancialAccountBase, IReferences {}
export interface IFinancialAccount extends IFinancialAccountBase, IReferences, IPlainMongooseDoc {}
export interface IFinancialAccountDoc extends IFinancialAccountBase, IReferences, Document {}
export interface IFinancialAccountPopulatedDoc extends IFinancialAccountBase, IPopulatedReferences, Document {}

const FinancialAccountSchema = new Schema<IFinancialAccount>({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    financialUnit: {
        type: Schema.Types.ObjectId,
        ref: 'FinancialUnit',
        required: true
    }
});

export const FinancialAccountModel = mongoose.model<IFinancialAccountDoc>(
    'FinancialAccount', FinancialAccountSchema
);