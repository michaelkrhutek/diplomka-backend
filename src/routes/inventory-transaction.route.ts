import { Router, Request, Response } from 'express';
import { InventoryTransactionType } from '../models/inventory-transaction.model';
import { createInventoryTransaction, getAllInventoryTransactions } from '../services/inventory-transaction.service';

const router: Router = Router();

router.get('/get-all-inventory-transactions', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    getAllInventoryTransactions(financialUnitId)
        .then((inventoryTransactions) => {
            res.send(inventoryTransactions);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json(err);
        });
});

router.post('/create-inventory-transaction', (req: Request, res: Response) => {
    const type: InventoryTransactionType = req.query.type;
    const data: any = req.body;
    createInventoryTransaction(type, data)
        .then((inventoryTransaction) => {
            res.send(inventoryTransaction);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json(err);
        });
});

export default router;