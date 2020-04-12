import { Mongoose } from 'mongoose';
import credentials from './credentials.json';
import { ICredentials } from './credentials.interface';

type DbMode = 'cloud' | 'local';
const dbMode: DbMode = (process.argv[4] as DbMode) == 'local' ? 'local' : 'cloud';
const localDbPort: number = Number(process.argv[5]) || 27017;
const localDbConnectionString: string = `mongodb://localhost:${localDbPort}/diplomka`;
console.log(dbMode, dbMode, localDbPort);

export const mongoose = new Mongoose();

mongoose.connect(
    dbMode == 'cloud' ? (credentials as ICredentials).connectionString : localDbConnectionString,
    {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useFindAndModify: false
    }
).then(() => {
    console.log(`Connected to ${dbMode} db`);
}).catch((err) => {
    console.error(err);
});