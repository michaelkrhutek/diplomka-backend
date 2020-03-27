import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';
import { IPlainMongooseDoc } from './plain-mongoose-doc.model';
import { IFinancialUnitDoc } from './financial-unit.model';

export interface INewFinancialPeriodRequestData {
    name?: string;
    financialUnitId: string;
    startDate: Date;
    endDate: Date;
}

interface IFinancialPeriodBase {
    name?: string;
    periodIndex: number;
    startDate: Date;
    endDate: Date;
}

interface IReferences {
    financialUnit: IFinancialUnitDoc['_id'];
}

interface IPopulatedReferences {
    financialUnit: IFinancialUnitDoc['_id'];
}

export interface INewFinancialPeriod extends IFinancialPeriodBase, IReferences {}
export interface IFinancialPeriod extends IFinancialPeriodBase, IReferences, IPlainMongooseDoc {}
export interface IFinancialPeriodDoc extends IFinancialPeriodBase, IReferences, Document {}
export interface IFinancialPeriodPopulatedDoc extends IFinancialPeriodBase, IPopulatedReferences, Document {}


const FinancialPeriodSchema = new Schema<IFinancialPeriod>({
    name: {
        type: String
    },
    periodIndex: {
        type: Number,
        required: true
    },
    financialUnit: {
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