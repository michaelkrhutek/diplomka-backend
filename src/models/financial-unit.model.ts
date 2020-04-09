import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';
import { IPlainMongooseDoc } from './plain-mongoose-doc.model';
import { IUserDoc } from './user.model';

interface IFinancialUnitBase {
    name: string;
}

interface IReferences {
    users: IUserDoc['id'][],
    owner: IUserDoc['id']
}

interface IPopulatedReferences {
    users: IUserDoc[];
    owner: IUserDoc;
}

export interface INewFinancialUnit extends IFinancialUnitBase, IReferences {}
export interface IFinancialUnit extends IFinancialUnitBase, IReferences, IPlainMongooseDoc {}
export interface IFinancialUnitDoc extends IFinancialUnitBase, IReferences, Document {}
export interface IFinancialUnitPopulatedDoc extends IFinancialUnitBase, IPopulatedReferences, Document {}

const FinancialUnitSchema = new Schema<IFinancialUnit>({
    name: {
        type: String,
        required: true
    },
    users: {
        type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

export const FinancialUnitModel = mongoose.model<IFinancialUnitDoc>(
    'FinancialUnit', FinancialUnitSchema
);