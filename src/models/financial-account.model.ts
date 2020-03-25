import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';
import { IPlainMongooseDoc } from './plain-mongoose-doc.model';

export interface INewFinancialAccountData {
    name: string;
    code: string;
    financialUnitId: string;
}

export interface IFinancialAccount extends INewFinancialAccountData, IPlainMongooseDoc {};
export interface IFinancialAccountDoc extends INewFinancialAccountData, Document {};

const FinancialAccountSchema = new Schema<IFinancialAccount>({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    financialUnitId: {
        type: Schema.Types.ObjectId,
        ref: 'FinancialUnit',
        required: true
    }
});

export const FinancialAccountModel = mongoose.model<IFinancialAccountDoc>(
    'FinancialAccount', FinancialAccountSchema
);