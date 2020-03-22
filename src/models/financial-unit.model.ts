import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';

export interface INewFinancialUnitData {
    name: string;
}

export interface IFinancialUnit extends INewFinancialUnitData, Document {};

const FinancialUnitSchema = new Schema<IFinancialUnit>({
    name: {
        type: String,
        required: true
    }
});

export const FinancialUnitModel = mongoose.model<IFinancialUnit>(
    'FinancialUnit', FinancialUnitSchema
);