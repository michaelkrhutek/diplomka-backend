import express, { NextFunction } from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import session from 'express-session';
import * as https from 'https';
import connectMongo from 'connect-mongo';
import financialUnitRouter from './src/routes/financial-unit.route';
import financialPeriodRouter from './src/routes/financial-period.route';
import financialAccountRouter from './src/routes/financial-account.route';
import financialTransactionRouter from './src/routes/financial-transaction.route';
import inventoryGroupRouter from './src/routes/inventory-group.route';
import inventoryItemRouter from './src/routes/inventory-item.route';
import inventoryTransactionTemplatesRouter from './src/routes/inventory-transaction-template.route';
import inventoryTransactionRouter from './src/routes/inventory-transaction.route';
import userRouter from './src/routes/user.route';
import authRouter from './src/routes/auth.route';
import * as fs from 'fs';
import credentials from './src/credentials.json';
import { ICredentials } from './src/credentials.interface';
import { mongoose } from './src/mongoose-instance';

console.log(process.argv);

type AppMode = 'dev' | 'prod';
const appMode: AppMode = (process.argv[2] as AppMode) || 'dev';
const port = Number(process.argv[3]) || 3000;
console.log(appMode, port);

const app = express();

if (appMode == 'dev') {
    const whiteList: string[] = [
        'http://localhost:4200'
    ];
    const corsOptions: cors.CorsOptions = {
        origin: (origin, callback) => {
            console.log(origin);
            if (whiteList.some((url) => url.includes(origin || 'localhost'))) {
                callback(null, true)
            } else {
                callback(new Error('Not allowed by CORS'))
            }
        },
        credentials: true
    };
    app.use(cors(corsOptions));
}

app.use(bodyParser.json());

const MongoStore = connectMongo(session);
app.use(session({
    secret: (credentials as ICredentials).cookieSecret,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
    },
    resave: false,
    saveUninitialized: false
}));

app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`HTTP request: ${req.url}`);
    console.log(req.query);
    console.log(req.body);
    next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.url.startsWith('/api') && (!req.session || !req.session.userId)) {
        res.status(401).send();
    } else {
        req.session && req.session.touch();
        next();
    }
});

app.use('/auth', authRouter);
app.use('/api/financial-unit', financialUnitRouter);
app.use('/api/financial-period', financialPeriodRouter);
app.use('/api/financial-account', financialAccountRouter);
app.use('/api/financial-transaction', financialTransactionRouter);
app.use('/api/inventory-group', inventoryGroupRouter);
app.use('/api/inventory-item', inventoryItemRouter);
app.use('/api/inventory-transaction-template', inventoryTransactionTemplatesRouter);
app.use('/api/inventory-transaction', inventoryTransactionRouter);
app.use('/api/user', userRouter);

app.get('/', (_req: Request, res: Response, next: NextFunction) => {
    if (appMode == 'dev') {
        res.redirect('http://localhost:4200');
    } else if (appMode == 'prod') {
        console.log(__dirname);
        res.sendFile(__dirname + '/src/client/index.html');
    } else {
        next();
    }
})

app.use(express.static('src/client', { maxAge: 0 }));

if (appMode == 'dev') {
    const cert = fs.readFileSync('./src/localhost.cer');
    const key = fs.readFileSync('./src/localhost.key');
    https.createServer({ cert, key }, app).listen(port);
} else if (appMode == 'prod') {
    app.listen(port, () => console.log('App started'));
}

app.get('*', (_req: Request, res: Response, next: NextFunction) => {
    if (appMode == 'dev') {
        res.redirect('http://localhost:4200');
    } else if (appMode == 'prod') {
        console.log(__dirname);
        res.sendFile(__dirname + '/src/client/index.html');
    } else {
        next();
    }
})