import { Router, Request, Response } from 'express';
import { getAllFinancialTransactions } from '../services/financial-transaction.service';

const router: Router = Router();

router.get('/get-all-financial-transactions', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    getAllFinancialTransactions(financialUnitId).then((financialTransactions) => {
        res.send(financialTransactions);
    }).catch((err) => {
        res.status(500).json(err);
    });
});

export default router;