import { Router, Request, Response } from 'express';
import { createFinancialUnit, deleteFinancialUnit, getAllFinancialUnits, getFinancialUnit, deleteAllTransactions } from '../services/financial-unit.service';

const router: Router = Router();

router.get('/get-all-financial-units', (req: Request, res: Response) => {
    console.error(req.url + ' was reached');
    getAllFinancialUnits().then((financialUnits) => {
        res.send(financialUnits);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

router.get('/get-financial-unit', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.id;
    getFinancialUnit(financialUnitId).then((financialUnit) => {
        res.send(financialUnit);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

router.post('/create-financial-unit', (req: Request, res: Response) => {
    const name: string = req.query.name;
    createFinancialUnit({ name }).then((financialUnit) => {
        res.send(financialUnit);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

router.delete('/delete-financial-unit', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.id;
    deleteFinancialUnit(financialUnitId)
        .then(() => {
            res.send('OK');
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json(err);
        });
});

router.delete('/delete-all-transactions', (req: Request, res: Response) => {
    const financialUnitId: string = req.query.id;
    deleteAllTransactions(financialUnitId)
        .then(() => {
            res.send('OK');
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json(err);
        });
});

export default router;