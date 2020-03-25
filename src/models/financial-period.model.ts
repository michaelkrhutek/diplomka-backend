import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';
import { IPlainMongooseDoc } from './plain-mongoose-doc.model';

export interface INewFinancialPeriodRequestData {
    name?: string;
    financialUnitId: string;
    startDate: Date;
    endDate: Date;
}

export interface INewFinancialPeriodData {
    name?: string;
    periodIndex: number;
    financialUnitId: string;
    startDate: Date;
    endDate: Date;
}

export interface IFinancialPeriod extends INewFinancialPeriodData, IPlainMongooseDoc {};
export interface IFinancialPeriodDoc extends INewFinancialPeriodData, Document {};

const FinancialPeriodSchema = new Schema<IFinancialPeriod>({
    name: {
        type: String,
        default: ''
    },
    periodIndex: {
        type: Number,
        required: true
    },
    financialUnitId: {
        type: Schema.Types.ObjectId,
        ref: 'FinancialUnit',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    }
});

export const FinancialPeriodModel = mongoose.model<IFinancialPeriodDoc>(
    'FinancialPeriod', FinancialPeriodSchema
);