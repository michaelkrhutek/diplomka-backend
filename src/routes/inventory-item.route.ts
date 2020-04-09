import { Router, Request, Response, NextFunction } from 'express';
import * as inventoryItemService from '../services/inventory-item.service';
import * as utilitilesService from '../services/utilities.service'

const router: Router = Router();

router.get('/get-all-inventory-items', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    inventoryItemService.getInventoryItemsWithPopulatedRefs(financialUnitId).then((inventoryItems) => {
        res.send(inventoryItems);
    }).catch((err) => {
        console.error(err);
        res.status(500).json({ message: err.message });
    });
});

router.get('/get-inventory-items-with-stock', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    const effectiveDate: Date = utilitilesService.getUTCDate(new Date(req.query.effectiveDate), true);
    inventoryItemService.getAllInventoryItemsStocksTillDate(financialUnitId, effectiveDate).then((inventoryItems) => {
        res.send(inventoryItems);
    }).catch((err) => {
        console.error(err);
        res.status(500).json({ message: err.message });
    });
});

router.post('/create-inventory-item', async (req: Request, res: Response) => {
    try {
        const name: string = req.query.name;
        const financialUnitId: string = req.query.financialUnitId;
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

router.delete('/delete-all-inventory-items', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    inventoryItemService.deleteAllInventoryItems(financialUnitId).then(() => {
        res.send();
    }).catch((err) => {
        console.error(err);
        res.status(500).json({ message: err.message });
    });
});

router.delete('/delete-inventory-item', (req: Request, res: Response) => {
    const id: string = req.query.id;
    inventoryItemService.deleteInventoryItem(id).then(() => {
        res.send();
    }).catch((err) => {
        console.error(err);
        res.status(500).json({ message: err.message });
    });
});

export default router;