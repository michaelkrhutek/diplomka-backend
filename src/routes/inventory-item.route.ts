import { Router, Request, Response } from 'express';
import { createInventoryItem, getAllInventoryItems } from '../services/inventory-item.service';

const router: Router = Router();

router.get('/get-all-inventory-items', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    getAllInventoryItems(financialUnitId)
        .then((inventoryItems) => {
            res.send(inventoryItems);
        })
        .catch((err) => {
            res.status(500).json(err);
        });
});

router.post('/create-inventory-item', (req: Request, res: Response) => {
    const name: string = req.query.name;
    const financialUnitId: string = req.query.financialUnitId;
    createInventoryItem({ name, financialUnitId })
        .then((inventoryItem) => {
            res.send(inventoryItem);
        })
        .catch((err) => {
            res.status(500).json(err);
        });
});

export default router;