import { Router, Request, Response } from 'express';
import * as inventoryTransactionTemplateService from '../services/inventory-transaction-template.service';
import * as inventoryTransactionTypeService from '../services/inventory-transaction-type.service';
import * as inventoryGroupService from '../services/inventory-group.service';
import * as financialUnitService from '../services/financial-unit.service';
import { INewInventoryTransactionTemplateRequestData, INewInventoryTransactionTemplate } from '../models/inventory-transaction-template.model';
import { InventoryTransactionType } from '../models/inventory-transaction.model';

const router: Router = Router();

router.get('/get-inventory-transaction-templates', async (req: Request, res: Response) => {
    try {
        const inventoryGroupId: string = req.query.inventoryGroupId;
        const financialUnitId: string | null = await inventoryGroupService.getInventoryGroupFinancialUnitId(inventoryGroupId);
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        const transactionTemplates = await inventoryTransactionTemplateService.getInventoryTransactionTemplatesWithPopulatedRefs(inventoryGroupId);
        res.send(transactionTemplates);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message }); 
    }
});

router.get('/get-all-inventory-transaction-templates', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        const transactionTemplates = await inventoryTransactionTemplateService.getAllInventoryTransactionTemplatesWithPopulatedRefs(financialUnitId);
        res.send(transactionTemplates);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message }); 
    }
});

router.post('/create-inventory-transaction-template', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        const requestData: INewInventoryTransactionTemplateRequestData = req.body;
        const data: INewInventoryTransactionTemplate = {
            financialUnit: financialUnitId,
            description: requestData.description,
            inventoryGroup: requestData.inventoryGroupId,
            transactionType: inventoryTransactionTypeService.parseInventoryTransactiontType(requestData.transactionType) as InventoryTransactionType,
            creditAccount: requestData.creditAccountId,
            debitAccount: requestData.debitAccountId
        };
        if (requestData.transactionType == InventoryTransactionType.Sale) {
            data.saleDebitAccount = requestData.saleDebitAccountId || null;
            data.saleCreditAccount = requestData.saleCreditAccountId || null;
        }
        const transactionTemplate = await inventoryTransactionTemplateService.createInventoryTransactionTemplate(data);
        res.send(transactionTemplate);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message }); 
    }
})

router.delete('/delete-all-inventory-transaction-templates', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        await inventoryTransactionTemplateService.deleteAllInventoryTransactionTemplates(financialUnitId);
        res.send();
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.delete('/delete-inventory-transaction-template', async (req: Request, res: Response) => {
    try {
        const id: string = req.query.id;
        const financialUnitId: string | null = await inventoryTransactionTemplateService.getInventoryTransactionTemplateFinancialUnitId(id);
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        await inventoryTransactionTemplateService.deleteInventoryTransactionTemplate(id);
        res.send();
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

export default router;