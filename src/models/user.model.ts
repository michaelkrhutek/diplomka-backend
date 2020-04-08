import { mongoose } from '../mongoose-instance';
import { Document, Schema } from 'mongoose';
import { IPlainMongooseDoc } from './plain-mongoose-doc.model';

interface IUserBase {
    displayName: string;
    displayNameLowerCased: string;
    username: string;
    password: string;
}

interface IReferences {}

interface IPopulatedReferences {}

export interface INewUser extends IUserBase, IReferences {}
export interface IUser extends IUserBase, IReferences, IPlainMongooseDoc {}
export interface IUserDoc extends IUserBase, IReferences, Document {}
export interface IUserPopulatedDoc extends IUserBase, IPopulatedReferences, Document {}

const UserSchema = new Schema<IUser>({
    displayName: {
        type: String,
        required: true
    },
    displayNameLowerCased: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

export const UserModel = mongoose.model<IUserDoc>(
    'User', UserSchema
);