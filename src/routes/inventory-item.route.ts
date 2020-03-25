import { Router, Request, Response } from 'express';
import { createInventoryItem, getAllInventoryItems } from '../services/inventory-item.service';
import { Error } from 'mongoose';
import { StockDecrementType } from '../models/stock.model';
import { parseStockDecrementType } from '../services/stock.service';

const router: Router = Router();

router.get('/get-all-inventory-items', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    getAllInventoryItems(financialUnitId).then((inventoryItems) => {
        res.send(inventoryItems);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

router.post('/create-inventory-item', (req: Request, res: Response) => {
    const name: string = req.query.name;
    const financialUnitId: string = req.query.financialUnitId;
    const inventoryGroupId: string = req.query.inventoryGroupId;
    createInventoryItem({ name, financialUnitId, inventoryGroupId }).then((inventoryItem) => {
        res.send(inventoryItem);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

export default router;