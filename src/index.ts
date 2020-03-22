import express from 'express';
import { Request, Response } from 'express';
import bodyParser from 'body-parser';

import financialUnitRouter from './routes/financial-unit.route';
import financialAccountRouter from './routes/financial-account.route';
import financialTransactionRouter from './routes/financial-transaction.route';
import inventoryItemRouter from './routes/inventory-item.route';
import inventoryTransactionRouter from './routes/inventory-transaction.route';

const app = express();
const port = 3000

app.use(bodyParser.json());

app.use('/api/financial-unit', financialUnitRouter);
app.use('/api/financial-account', financialAccountRouter);
app.use('/api/financial-transaction', financialTransactionRouter);
app.use('/api/inventory-item', inventoryItemRouter);
app.use('/api/inventory-transaction', inventoryTransactionRouter);

app.get('/', (_req: Request, res: Response) => res.redirect('http://localhost:4200/'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))