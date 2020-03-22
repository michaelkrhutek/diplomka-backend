import { Mongoose } from 'mongoose';
import credentials from './credentials.json';
import { ICredentials } from './credentials.interface';

export const mongoose = new Mongoose();

mongoose.connect((credentials as ICredentials).connectionString, { useUnifiedTopology: true, useNewUrlParser: true })
    .then(() => console.log('Connected'))
    .catch((err) => console.log(err));