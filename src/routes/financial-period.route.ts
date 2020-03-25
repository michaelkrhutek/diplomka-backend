import { Router, Request, Response } from 'express';
import { getAllFinancialPeriods, createFinancialPeriod } from '../services/financial-period.service';

const router: Router = Router();

router.get('/get-all-financial-periods', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.financialUnitId;
    getAllFinancialPeriods(financialUnitId).then((financialPeriods) => {
        res.send(financialPeriods);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

router.post('/create-financial-period', (req: Request, res: Response) => {
    const name: string = req.query.name;
    const financialUnitId: string = req.query.financialUnitId;
    const startDate: Date = new Date(req.query.startDate);
    const endDate: Date = new Date(req.query.endDate);
    createFinancialPeriod({ name, financialUnitId, startDate, endDate }).then((financialPeriod) => {
        res.send(financialPeriod);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

export default router;
