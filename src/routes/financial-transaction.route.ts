import { Router, Request, Response } from 'express';
import * as financialUnitService from '../services/financial-unit.service';
import * as financialTransactionService from '../services/financial-transaction.service';
import * as trialBalanceService from '../services/trial-balance.service';
import * as utilitiesService from '../services/utilities.service';
import * as financialPeriodService from '../services/financial-period.service';

const router: Router = Router();

// router.get('/get-all-financial-transactions', async (req: Request, res: Response) => {
//     try {
//         const financialUnitId: string = req.query.financialUnitId;
//         await financialUnitService.testAccessToFinancialUnit(financialUnitId, req);
//         const financialTransactions = await financialTransactionService.getAllFinancialTransactions(financialUnitId);
//         res.send(financialTransactions);
//     } catch(err) {
//         console.error(err);
//         res.status(500).json({ message: err.message });
//     }
// });

// router.get('/get-filtred-financial-transactions', async (req: Request, res: Response) => {
//     try {
//         const financialUnitId: string = req.query.financialUnitId;
//         await financialUnitService.testAccessToFinancialUnit(financialUnitId, req);
//         const accountId: string | null = req.query.accountId;
//         const dateFrom: Date | null = req.query.dateFrom ? utilitiesService.getUTCDate(new Date(req.query.dateFrom)) : null;
//         const dateTo: Date | null = req.query.dateTo ? utilitiesService.getUTCDate(new Date(req.query.dateTo)) : null;
//         const financialTransactions = await financialTransactionService.getFiltredFinancialTransaction(
//             financialUnitId, accountId, dateFrom, dateTo
//         );
//         res.send(financialTransactions);
//     } catch(err) {
//         console.error(err);
//         res.status(500).json({ message: err.message });
//     }
// });

router.get('/get-filtred-financial-transactions-count', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId, req);
        const accountId: string | null = req.query.accountId;
        const dateFrom: Date | null = req.query.dateFrom ? utilitiesService.getUTCDate(new Date(req.query.dateFrom)) : null;
        const dateTo: Date | null = req.query.dateTo ? utilitiesService.getUTCDate(new Date(req.query.dateTo)) : null;
        const count = await financialTransactionService.getFiltredFinancialTransactionCount(
            financialUnitId, accountId, dateFrom, dateTo
        );
        res.json(count);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.get('/get-filtred-paginated-financial-transactions', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId, req);
        const accountId: string | null = req.query.accountId;
        const dateFrom: Date | null = req.query.dateFrom ? utilitiesService.getUTCDate(new Date(req.query.dateFrom)) : null;
        const dateTo: Date | null = req.query.dateTo ? utilitiesService.getUTCDate(new Date(req.query.dateTo)) : null;
        const pageIndex: number = Number(req.query.pageIndex || 1);
        const pageSize: number = Number(req.query.pageSize || 0);
        const financialTransactions = await financialTransactionService.getFiltredPaginatedFinancialTransaction(
            financialUnitId, accountId, dateFrom, dateTo, pageIndex, pageSize
        );
        res.send(financialTransactions);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// router.get('/get-trial-balance', (req: Request, res: Response) => {
//     const financialUnitId: string = req.query.financialUnitId;
//     const startDate: Date = new Date(req.query.startDate);
//     const endDate: Date = new Date(req.query.endDate);
//     trialBalanceService.getTrialBalance(financialUnitId, startDate, endDate)
//         .then((trialBalance) => {
//             res.send(trialBalance);
//         })
//         .catch((err) => {
//             console.error(err);
//             res.status(500).json({ message: err.message });
//         });
// })

router.get('/get-financial-period-trial-balance', async (req: Request, res: Response) => {
    try {
        const financialPeriodId: string = req.query.financialPeriodId;
        const financialUnitId: string | null = await financialPeriodService.getFinancialPeriodFinancialUnitId(financialPeriodId);
        await financialUnitService.testAccessToFinancialUnit(financialUnitId as string, req);
        const trialBalance = await trialBalanceService.getFinancialPeriodTrialBalance(financialPeriodId)
        res.send(trialBalance);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

export default router;