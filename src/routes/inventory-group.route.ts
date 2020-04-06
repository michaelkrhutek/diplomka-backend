import { Router, Request, Response } from 'express';
import * as inventoryGroupService from '../services/inventory-group.service';
import { StockDecrementType } from '../models/stock.model';
import { Error } from 'mongoose';
import { parseStockDecrementType } from '../services/stock.service';

const router: Router = Router();

router.get('/get-all-inventory-groups', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    inventoryGroupService.getAllInventoryGroups(financialUnitId).then((inventoryGroups) => {
        res.send(inventoryGroups);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

router.post('/create-inventory-group', (req: Request, res: Response) => {
    try {
        const name: string = req.query.name;
        const financialUnitId: string = req.query.financialUnitId;
        const defaultStockDecrementType: StockDecrementType | null = parseStockDecrementType(req.query.defaultStockDecrementType);
        if (!defaultStockDecrementType) {
            throw new Error('Neznama ocenovaci metoda pro vyskladneni');
        }
        inventoryGroupService.createInventoryGroup(
            { name, financialUnit: financialUnitId, defaultStockDecrementType }
        ).then((inventoryGroup) => {
            res.send(inventoryGroup);
        });
    } catch(err) {
        console.error(err);
        res.status(500).json(err);
    }
});

router.delete('/delete-all-inventory-groups', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    inventoryGroupService.deleteAllInventoryGroups(financialUnitId).then(() => {
        res.send();
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

router.delete('/delete-inventory-group', (req: Request, res: Response) => {
    const id: string = req.query.id;
    inventoryGroupService.deleteInventoryGroup(id).then(() => {
        res.send();
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

export default router;