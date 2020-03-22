import { Router, Request, Response } from 'express';
import { getAllFinancialAccounts, createFinancialAccount } from '../services/financial-account.service';

const router: Router = Router();

router.get('/get-all-financial-accounts', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    getAllFinancialAccounts(financialUnitId).then((financialAccounts) => {
        res.send(financialAccounts);
    }).catch((err) => {
        res.status(500).json(err);
    });
});

router.post('/create-financial-account', (req: Request, res: Response) => {
    const name: string = req.query.name;
    const financialUnitId: string = req.query.financialUnitId;
    createFinancialAccount({ name, financialUnitId }).then((financialAccount) => {
        res.send(financialAccount);
    }).catch((err) => {
        res.status(500).json(err);
    });
});

export default router;
