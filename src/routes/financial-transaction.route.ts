import { Router, Request, Response } from 'express';
import { getAllFinancialTransactions } from '../services/financial-transaction.service';
import { getTrialBalance } from '../services/trial-balance.service';

const router: Router = Router();

router.get('/get-all-financial-transactions', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    getAllFinancialTransactions(financialUnitId).then((financialTransactions) => {
        res.send(financialTransactions);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

router.get('/get-trial-balance', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    const startDate: Date = new Date(req.query.startDate);
    const endDate: Date = new Date(req.query.endDate);
    getTrialBalance(financialUnitId, startDate, endDate)
        .then((trialBalance) => {
            res.send(trialBalance);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json(err);
        });
})

export default router;