import { Router, Request, Response } from 'express';
import * as userService from '../services/user.service';
import * as financialUnitService from '../services/financial-unit.service';

const router: Router = Router();

router.get('/search-users', (req: Request, res: Response) => {
    const filterText: string = req.query.filterText || '';
    userService.getUsers(filterText).then((users) => {
        res.send(users);
    }).catch((err) => {
        console.error(err);
        res.status(500).json(err);
    });
});

router.get('/get-financial-unit-users', async (req: Request, res: Response) => {
    try {
        const financialUnitId: string = req.query.financialUnitId;
        await financialUnitService.testAccessToFinancialUnit(financialUnitId, req);
        const users = await financialUnitService.getFinancialUnitUsers(financialUnitId);
        res.send(users);
    } catch(err) {
        console.error(err);
        res.status(500).json(err);
    }
});

export default router;
