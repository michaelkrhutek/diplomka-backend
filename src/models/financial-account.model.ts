import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';

export interface INewFinancialAccountData {
    name: string;
    financialUnitId: string;
}

export interface IFinancialAccount extends INewFinancialAccountData, Document {};

const FinancialAccountSchema = new Schema<IFinancialAccount>({
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

export const FinancialAccountModel = mongoose.model<IFinancialAccount>(
    'FinancialAccount', FinancialAccountSchema
);