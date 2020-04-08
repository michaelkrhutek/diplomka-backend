import { Router, Request, Response } from 'express';
import * as financialUnitService from '../services/financial-unit.service';

const router: Router = Router();

router.get('/get-all-financial-units', (req: Request, res: Response) => {
    const userId: string | null = req.session ? req.session.userId : null;
    financialUnitService.getAllFinancialUnits(userId as string).then((financialUnits) => {
        res.send(financialUnits);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

router.get('/get-financial-unit', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.id;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId, req);
        const financialUnit = await financialUnitService.getFinancialUnitWithPopulatedRefs(financialUnitId);
        res.send(financialUnit);
    } catch(err) {
        console.error(err);
        res.status(500).json(err);
    }
});

router.post('/create-financial-unit', (req: Request, res: Response) => {
    const name: string = req.query.name;
    const creatorId: string | null = req.session ? req.session.userId : null;
    financialUnitService.createFinancialUnit({ name, users: [creatorId as string] }).then((financialUnit) => {
        res.send(financialUnit);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

router.post('/add-user', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        const newUserId: string = req.query.userId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId, req);
        financialUnitService.addUserToFinancialUnit(financialUnitId, newUserId).then((financialUnit) => {
            res.send(financialUnit);
        })
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

router.delete('/delete-financial-unit', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.id;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId, req);
        await financialUnitService.deleteFinancialUnit(financialUnitId);
        res.send({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

router.delete('/delete-all-transactions', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.id;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId, req);
        await financialUnitService.deleteAllTransactions(financialUnitId);
        res.send({ message: 'OK' });
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

export default router;