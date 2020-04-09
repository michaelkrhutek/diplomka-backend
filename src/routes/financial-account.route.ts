import { Router, Request, Response } from 'express';
import * as financialAccountService from '../services/financial-account.service';

const router: Router = Router();

router.get('/get-all-financial-accounts', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    financialAccountService.getAllFinancialAccounts(financialUnitId).then((financialAccounts) => {
        res.send(financialAccounts);
    }).catch((err) => {
        console.error(err);
        res.status(500).json({ message: err.message });
    });
});

router.post('/create-financial-account', (req: Request, res: Response) => {
    const name: string = req.query.name;
    const code: string = req.query.code;
    const financialUnitId: string = req.query.financialUnitId;
    financialAccountService.createFinancialAccount({ name, code, financialUnit: financialUnitId }).then((financialAccount) => {
        res.send(financialAccount);
    }).catch((err) => {
        console.error(err);
        res.status(500).json({ message: err.message });
    });
});



router.post('/update-financial-account', async (req: Request, res: Response) => {
    try {
        const id: string = req.query.id;
        const name: string = req.query.name;
        const code: string = req.query.code;
        await financialAccountService.updateFinancialAccount(id, { name, code, financialUnit: null });
        res.send();
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});



router.delete('/delete-all-financial-accounts', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    financialAccountService.deleteAllFinancialAccounts(financialUnitId).then(() => {
        res.send();
    }).catch((err) => {
        console.error(err);
        res.status(500).json({ message: err.message });
    });
});

router.delete('/delete-financial-account', (req: Request, res: Response) => {
    const id: string = req.query.id;
    financialAccountService.deleteFinancialAccount(id).then(() => {
        res.send();
    }).catch((err) => {
        console.error(err);
        res.status(500).json({ message: err.message });
    });
});

export default router;
