import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';
import { IPlainMongooseDoc } from './plain-mongoose-doc.model';

interface IFinancialUnitBase {
    name: string;
}

interface IReferences {}

interface IPopulatedReferences {}

export interface INewFinancialUnit extends IFinancialUnitBase, IReferences {}
export interface IFinancialUnit extends IFinancialUnitBase, IReferences, IPlainMongooseDoc {}
export interface IFinancialUnitDoc extends IFinancialUnitBase, IReferences, Document {}
export interface IFinancialUnitPopulatedDoc extends IFinancialUnitBase, IPopulatedReferences, Document {}

const FinancialUnitSchema = new Schema<IFinancialUnit>({
    name: {
        type: String,
        required: true
    }
});

export const FinancialUnitModel = mongoose.model<IFinancialUnitDoc>(
    'FinancialUnit', FinancialUnitSchema
);