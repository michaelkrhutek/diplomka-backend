import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';
import { IPlainMongooseDoc } from './plain-mongoose-doc.model';

export interface INewFinancialUnitData {
    name: string;
}

export interface IFinancialUnit extends INewFinancialUnitData, IPlainMongooseDoc {};
export interface IFinancialUnitDoc extends INewFinancialUnitData, Document {};

const FinancialUnitSchema = new Schema<IFinancialUnit>({
    name: {
        type: String,
        required: true
    }
});

export const FinancialUnitModel = mongoose.model<IFinancialUnitDoc>(
    'FinancialUnit', FinancialUnitSchema
);