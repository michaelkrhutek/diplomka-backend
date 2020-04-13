import { FinancialPeriodModel, IFinancialPeriodDoc, INewFinancialPeriod, INewFinancialPeriodRequestData } from '../models/financial-period.model';
import * as financialUnitService from './financial-unit.service';  
import * as utilitiesService from './utilities.service';
import * as inventoryTransactionService from './inventory-transaction.service';
import { InventoryTransactionModel } from '../models/inventory-transaction.model';
import { FinancialTransactionModel } from '../models/financial-transaction.model';



export const getIsFinancialPeriodExistsWithDate = async (financialUnitId: string, date: Date) => {
    return await FinancialPeriodModel.exists({ 
        financialUnit: financialUnitId,
        startDate: { $lte: date},
        endDate: { $gte: date }
    });
}



export const getFinancialPeriod = async (id: string): Promise<IFinancialPeriodDoc | null> => {
    const financialPeriod: IFinancialPeriodDoc | null = await FinancialPeriodModel.findById(id).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání účetního období');
        });
    return financialPeriod;    
}



export const getAllFinancialPeriods = async (financialUnitId: string): Promise<IFinancialPeriodDoc[]> => {
    const financialPeriods: IFinancialPeriodDoc[] = await FinancialPeriodModel.find({ financialUnit: financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání účetního období');
        });
    return financialPeriods;
}



export const getFirstFinancialPeriod = async (financialUnitId: string): Promise<IFinancialPeriodDoc | null> => {
    const firstFinancialPeriod: IFinancialPeriodDoc | null = await FinancialPeriodModel
        .findOne({ financialUnit: financialUnitId })
        .sort({ periodIndex: 1 })
        .exec().catch((err) => {
            console.error(err);
            throw ('Chyba při načítaní účetního období');
        });
    return firstFinancialPeriod;
}



export const getLastFinancialPeriod = async (financialUnitId: string): Promise<IFinancialPeriodDoc | null> => {
    const lastFinancialPeriod: IFinancialPeriodDoc | null = await FinancialPeriodModel
        .findOne({ financialUnit: financialUnitId })
        .sort({ periodIndex: -1 })
        .exec().catch((err) => {
            console.error(err);
            throw ('Chyba při načítaní účetního období');
        });
    return lastFinancialPeriod;
}



export const createFinancialPeriod = async (requestData: INewFinancialPeriodRequestData): Promise<IFinancialPeriodDoc> => {
    if (!(await financialUnitService.getIsFinancialUnitExist(requestData.financialUnitId))) {
        throw new Error('Účetní jednotka s daným ID neexistuje');
    }
    const lastFinancialPeriod: IFinancialPeriodDoc | null = await getLastFinancialPeriod(requestData.financialUnitId);
    const startDate: Date = lastFinancialPeriod ? new Date(lastFinancialPeriod.endDate) : utilitiesService.getUTCDate(requestData.startDate);
    if (lastFinancialPeriod) {
        startDate.setDate(startDate.getDate() + 1);
    }
    const endDate: Date = utilitiesService.getUTCDate(requestData.endDate);
    if (startDate > endDate) {
        throw new Error('Konec účetního období nesmí předcházet jeho začátku');
    }
    const data: INewFinancialPeriod = {
        financialUnit: requestData.financialUnitId,
        periodIndex: lastFinancialPeriod ? lastFinancialPeriod.periodIndex + 1 : 1,
        startDate,
        endDate,
    };
    const financialPeriod: IFinancialPeriodDoc = await new FinancialPeriodModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření finančního obdobi');
        });
    return financialPeriod;
}



export const deleteAllFinancialPeriods = async (financialUnitId: string): Promise<void> => {
    await FinancialPeriodModel.deleteMany({ financialUnit: financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování období');            
        });
    await inventoryTransactionService.deleteAllInventoryTransactions(financialUnitId);
}; 



export const deleteLastFinancialPeriod = async (financialUnitId: string): Promise<void> => {
    const lastFinancialPeriod: IFinancialPeriodDoc | null = await getLastFinancialPeriod(financialUnitId);
    if (!lastFinancialPeriod) {
        return;
    }
    await FinancialPeriodModel.findByIdAndDelete(lastFinancialPeriod._id).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování obdobi');
        });
    await Promise.all([
        InventoryTransactionModel.deleteMany({
            effectiveDate: { $gte: lastFinancialPeriod.startDate, $lte: lastFinancialPeriod.endDate }
        }).exec(),
        FinancialTransactionModel.deleteMany({
            effectiveDate: { $gte: lastFinancialPeriod.startDate, $lte: lastFinancialPeriod.endDate }
        }).exec()
    ]).catch((err) => {
        console.error(err);
        throw new Error('Chyba při odstraňování transakcí a účetních zápisů');
    });
}



export const getFinancialPeriodFinancialUnitId = async (financialPeriodId: string): Promise<string | null> => {
    const financialPeriod: IFinancialPeriodDoc | null = await getFinancialPeriod(financialPeriodId);
    return financialPeriod ? financialPeriod.financialUnit : null;
}