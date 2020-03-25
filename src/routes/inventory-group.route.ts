import { Router, Request, Response } from 'express';
import { createInventoryGroup, getAllInventoryGroups } from '../services/inventory-group.service';
import { StockDecrementType } from '../models/stock.model';
import { Error } from 'mongoose';
import { parseStockDecrementType } from '../services/stock.service';

const router: Router = Router();

router.get('/get-all-inventory-groups', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    getAllInventoryGroups(financialUnitId).then((inventoryGroups) => {
        res.send(inventoryGroups);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

router.post('/create-inventory-group', (req: Request, res: Response) => {
    const name: string = req.query.name;
    const financialUnitId: string = req.query.financialUnitId;
    const defaultStockDecrementType: StockDecrementType | null = parseStockDecrementType(req.query.defaultStockDecrementType);
    if (!defaultStockDecrementType) {
        throw new Error('Neznama ocenovaci metoda pro vyskladneni');
    }
    createInventoryGroup({ name, financialUnitId, defaultStockDecrementType }).then((inventoryGroup) => {
        res.send(inventoryGroup);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

export default router;