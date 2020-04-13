import { Router, Request, Response } from 'express';
import * as financialPeriodService from '../services/financial-period.service';
import * as financialUnitService from '../services/financial-unit.service';

const router: Router = Router();

router.get('/get-all-financial-periods', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId, req);
        const financialPeriods = await financialPeriodService.getAllFinancialPeriods(financialUnitId)
        res.send(financialPeriods);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message }); 
    }
});

router.post('/create-financial-period', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId, req);
        const name: string = req.query.name;
        const startDate: Date = new Date(req.query.startDate);
        const endDate: Date = new Date(req.query.endDate);
        const financialPeriod = await financialPeriodService.createFinancialPeriod({ name, financialUnitId, startDate, endDate });
        res.send(financialPeriod);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message }); 
    }
});

router.delete('/delete-all-financial-periods', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId, req);
        await financialPeriodService.deleteAllFinancialPeriods(financialUnitId)
        res.send();
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message }); 
    }
});

router.delete('/delete-last-financial-period', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId, req);
        await financialPeriodService.deleteLastFinancialPeriod(financialUnitId);
        res.send();
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message }); 
    }
});

export default router;
