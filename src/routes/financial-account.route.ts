import { Router, Request, Response } from 'express';
import * as financialAccountService from '../services/financial-account.service';
import * as financialUnitService from '../services/financial-unit.service';
import { FinancialAccountType } from '../models/financial-account.model';

const router: Router = Router();

router.get('/get-all-financial-accounts', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId, req);
        const financialAccounts = await financialAccountService.getAllFinancialAccounts(financialUnitId);
        res.send(financialAccounts);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/create-financial-account', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId, req);
        const name: string = req.query.name;
        const code: string = req.query.code;
        const type: FinancialAccountType = financialAccountService.parseAccountType(req.query.type);
        const financialAccount = await financialAccountService.createFinancialAccount({ name, code, type, financialUnit: financialUnitId });
        res.send(financialAccount);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/update-financial-account', async (req: Request, res: Response) => {
    try {
        const id: string = req.query.id;
        const financialUnitId: string | null = await financialAccountService.getFinancialAccountFinancialUnitId(id);
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        const name: string = req.query.name;
        const code: string = req.query.code;
        await financialAccountService.updateFinancialAccount(id, { name, code, type: FinancialAccountType.Assets, financialUnit: null });
        res.send();
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.delete('/delete-all-financial-accounts', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        await financialAccountService.deleteAllFinancialAccounts(financialUnitId);
        res.send();
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.delete('/delete-financial-account', async (req: Request, res: Response) => {
    try {
        const id: string = req.query.id;
        const financialUnitId: string | null = await financialAccountService.getFinancialAccountFinancialUnitId(id);
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        await financialAccountService.deleteFinancialAccount(id);
        res.send();
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

export default router;
