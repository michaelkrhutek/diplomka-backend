import { Router, Request, Response } from 'express';
import { getAllFinancialAccounts, createFinancialAccount } from '../services/financial-account.service';

const router: Router = Router();

router.get('/get-all-financial-accounts', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    getAllFinancialAccounts(financialUnitId).then((financialAccounts) => {
        res.send(financialAccounts);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

router.post('/create-financial-account', (req: Request, res: Response) => {
    const name: string = req.query.name;
    const code: string = req.query.code;
    const financialUnitId: string = req.query.financialUnitId;
    createFinancialAccount({ name, code, financialUnit: financialUnitId }).then((financialAccount) => {
        res.send(financialAccount);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

export default router;
