import { Router, Request, Response } from 'express';
import * as inventoryTransactionTemplateService from '../services/inventory-transaction-template.service';

const router: Router = Router();

router.get('/get-inventory-transaction-templates', (req: Request, res: Response) => {
    const inventoryGroupId: string = req.query.inventoryGroupId;
    inventoryTransactionTemplateService.getInventoryTransactionTemplatesWithPopulatedRefs(inventoryGroupId).then((transactionTemplates) => {
        res.send(transactionTemplates);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

export default router;