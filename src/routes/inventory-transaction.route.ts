import { Router, Request, Response } from 'express';
import { InventoryTransactionType, INewInventoryTransactionRequestData } from '../models/inventory-transaction.model';
import * as inventoryTransactionService from '../services/inventory-transaction.service';
import * as utilitiesService from '../services/utilities.service';
import * as financialUnitService from '../services/financial-unit.service';
import * as inventoryItemService from '../services/inventory-item.service';

const router: Router = Router();

router.get('/get-inventory-transactions', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        const inventoryTransactions = await inventoryTransactionService.getPopulatedInventoryTransactions(financialUnitId);
        res.send(inventoryTransactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.get('/get-filtred-inventory-transactions', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        const inventoryItemId: string | null = req.query.inventoryItemId || null;
        const transactionType: InventoryTransactionType | null = req.query.transactionType || null;
        const dateFrom: Date | null = req.query.dateFrom ? utilitiesService.getUTCDate(new Date(req.query.dateFrom)) : null;
        const dateTo: Date | null =  req.query.dateTo ? utilitiesService.getUTCDate(new Date(req.query.dateTo), true) : null;
        const inventoryTransactions = await inventoryTransactionService.getFiltredInventoryTransactions(
            financialUnitId, inventoryItemId, transactionType, dateFrom, dateTo
        );
        res.send(inventoryTransactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/create-inventory-transaction', async (req: Request, res: Response) => {
    try {
        const type: InventoryTransactionType = req.query.type;
        const data: INewInventoryTransactionRequestData<any> = req.body;
        const creatorId: string | null = req.session ? req.session.userId : null;
        const financialUnitId: string | null = await inventoryItemService.getInventoryItemFinancialUnitId(data.inventoryItemId);
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        data.effectiveDate = new Date(data.effectiveDate);
        const inventoryTransaction = await inventoryTransactionService.createInventoryTransaction(creatorId as string,type, data);
        res.send(inventoryTransaction);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.delete('/delete-inventory-transaction', async (req: Request, res: Response) => {
    try {
        const id: string = req.query.id;
        const financialUnitId: string | null = await inventoryTransactionService.getInventoryTransactionFinancialUnitId(id);
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        await inventoryTransactionService.deleteInventoryTransaction(id);
        res.send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

export default router;