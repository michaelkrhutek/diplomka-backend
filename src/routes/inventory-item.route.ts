import { Router, Request, Response } from 'express';
import * as inventoryItemService from '../services/inventory-item.service';
import * as utilitilesService from '../services/utilities.service';
import * as financialUnitService from '../services/financial-unit.service';

const router: Router = Router();

router.get('/get-all-inventory-items', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        const inventoryItems = await inventoryItemService.getInventoryItemsWithPopulatedRefs(financialUnitId);
        res.send(inventoryItems);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.get('/get-inventory-items-with-stock', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        const effectiveDate: Date = utilitilesService.getUTCDate(new Date(req.query.effectiveDate), true);
        const inventoryItems = await inventoryItemService.getAllInventoryItemsStocksTillDate(financialUnitId, effectiveDate);
        res.send(inventoryItems);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/create-inventory-item', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        const name: string = req.query.name;
        const inventoryGroupId: string = req.query.inventoryGroupId;
        const inventoryItem = await inventoryItemService.createInventoryItem(
            { name, financialUnit: financialUnitId, inventoryGroup: inventoryGroupId }
        );
        res.json(inventoryItem);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/update-inventory-item', async (req: Request, res: Response) => {
    try {
        const id: string = req.query.id;
        const financialUnitId: string | null = await inventoryItemService.getInventoryItemFinancialUnitId(id);
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        const name: string = req.query.name;
        const inventoryGroupId: string = req.query.inventoryGroupId;
        await inventoryItemService.updateInventoryItem(
            id, { name, financialUnit: null, inventoryGroup: inventoryGroupId }
        );
        res.send();
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.delete('/delete-all-inventory-items', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        await inventoryItemService.deleteAllInventoryItems(financialUnitId);
        res.send();
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.delete('/delete-inventory-item', async (req: Request, res: Response) => {
    try {
        const id: string = req.query.id;
        const financialUnitId: string | null = await inventoryItemService.getInventoryItemFinancialUnitId(id);
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        await inventoryItemService.deleteInventoryItem(id);
        res.send();
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

export default router;