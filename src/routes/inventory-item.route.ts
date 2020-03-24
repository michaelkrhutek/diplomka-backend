import { Router, Request, Response } from 'express';
import { createInventoryItem, getAllInventoryItems, parseStockDecrementType } from '../services/inventory-item.service';
import { StockDecrementType } from '../models/inventory-item.model';
import { Error } from 'mongoose';

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
    const defaultStockDecrementType: StockDecrementType | null = parseStockDecrementType(req.query.defaultStockDecrementType);
    if (!defaultStockDecrementType) {
        throw new Error('Neznama ocenovaci metoda pro vyskladneni');
    }
    createInventoryItem({ name, financialUnitId, defaultStockDecrementType }).then((inventoryItem) => {
        res.send(inventoryItem);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

export default router;