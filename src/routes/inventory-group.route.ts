import { Router, Request, Response } from 'express';
import * as inventoryGroupService from '../services/inventory-group.service';
import * as financialUnitService from '../services/financial-unit.service';
import { StockValuationMethod } from '../models/stock.model';
import { Error } from 'mongoose';
import { parseStockValuationMethod } from '../services/stock.service';

const router: Router = Router();

router.get('/get-all-inventory-groups', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId, req);
        const inventoryGroups = await inventoryGroupService.getAllInventoryGroups(financialUnitId);
        res.send(inventoryGroups);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/create-inventory-group', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId, req);
        const name: string = req.query.name;
        const defaultStockValuationMethod: StockValuationMethod | null = parseStockValuationMethod(req.query.defaultStockValuationMethod);
        if (!defaultStockValuationMethod) {
            throw new Error('Neznáma oceňovací metoda');
        }
        const inventoryGroup = await inventoryGroupService.createInventoryGroup(
            { name, financialUnit: financialUnitId, defaultStockValuationMethod }
        );
        res.send(inventoryGroup);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/update-inventory-group', async (req: Request, res: Response) => {
    try {
        const inventoryGroupId: string = req.query.id;
        const financialUnitId: string | null = await inventoryGroupService.getInventoryGroupFinancialUnitId(inventoryGroupId);
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        const name: string = req.query.name;
        const defaultStockValuationMethod: StockValuationMethod | null = parseStockValuationMethod(req.query.defaultStockValuationMethod);
        if (!defaultStockValuationMethod) {
            throw new Error('Neznáma oceňovací metoda');
        }
        await inventoryGroupService.updateInventoryGroup(inventoryGroupId, { name, financialUnit: null, defaultStockValuationMethod });
        res.send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.delete('/delete-all-inventory-groups', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        await inventoryGroupService.deleteAllInventoryGroups(financialUnitId);
        res.send();
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.delete('/delete-inventory-group', async (req: Request, res: Response) => {
    try {
        const id: string = req.query.id;
        const financialUnitId: string | null = await inventoryGroupService.getInventoryGroupFinancialUnitId(id);
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        await inventoryGroupService.deleteInventoryGroup(id);
        res.send();
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

export default router;