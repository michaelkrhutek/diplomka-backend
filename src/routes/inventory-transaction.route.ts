import { Router, Request, Response } from 'express';
import { InventoryTransactionType, INewInventoryTransactionRequestData } from '../models/inventory-transaction.model';
import * as inventoryTransactionService from '../services/inventory-transaction.service';
import * as utilitiesService from '../services/utilities.service';

const router: Router = Router();

router.get('/get-inventory-transactions', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    inventoryTransactionService.getPopulatedInventoryTransactions(financialUnitId)
        .then((inventoryTransactions) => {
            res.send(inventoryTransactions);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json(err);
        });
});

router.get('/get-filtred-inventory-transactions', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    const inventoryItemId: string | null = req.query.inventoryItemId || null;
    const transactionType: InventoryTransactionType | null = req.query.transactionType || null;
    const dateFrom: Date | null = req.query.dateFrom ? utilitiesService.getUTCDate(new Date(req.query.dateFrom)) : null;
    const dateTo: Date | null =  req.query.dateTo ? utilitiesService.getUTCDate(new Date(req.query.dateTo), true) : null;
    inventoryTransactionService.getFiltredInventoryTransactions(
        financialUnitId, inventoryItemId, transactionType, dateFrom, dateTo
    ).then((inventoryTransactions) => {
        res.send(inventoryTransactions);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

router.post('/create-inventory-transaction', (req: Request, res: Response) => {
    const type: InventoryTransactionType = req.query.type;
    const data: INewInventoryTransactionRequestData<any> = req.body;
    data.effectiveDate = new Date(data.effectiveDate);
    inventoryTransactionService.createInventoryTransaction(type, data)
        .then((inventoryTransaction) => {
            res.send(inventoryTransaction);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json(err);
        });
});

router.delete('/delete-inventory-transaction', (req: Request, res: Response) => {
    const id: string = req.query.id;
    inventoryTransactionService.deleteInventoryTransaction(id)
        .then(() => {
            res.send();
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json(err);
        });
});

export default router;