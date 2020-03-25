import { FinancialPeriodModel, IFinancialPeriodDoc, INewFinancialPeriodData, INewFinancialPeriodRequestData } from '../models/financial-period.model';
import * as financialUnitService from './financial-unit.service';  



export const getIsFinancialPeriodExistsWithDate = async (financialUnitId: string, date: Date) => {
    return await FinancialPeriodModel.exists({ financialUnitId, startDate: { $lte: date}, endDate: { $gte: date } });
}



export const getAllFinancialPeriods = async (financialUnitId: string): Promise<IFinancialPeriodDoc[]> => {
    const financialPeriods: IFinancialPeriodDoc[] = await FinancialPeriodModel.find({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání finančních obdobi');
        });
    return financialPeriods;
}



export const getFirstFinancialPeriod = async (financialUnitId: string): Promise<IFinancialPeriodDoc | null> => {
    const firstFinancialPeriod: IFinancialPeriodDoc | null = await FinancialPeriodModel
        .findOne({ financialUnitId })
        .sort({ periodIndex: 1 })
        .exec().catch((err) => {
            console.error(err);
            throw ('Chyba při načítaní financni periody');
        });
    return firstFinancialPeriod;
}



export const getLastFinancialPeriod = async (financialUnitId: string): Promise<IFinancialPeriodDoc | null> => {
    const lastFinancialPeriod: IFinancialPeriodDoc | null = await FinancialPeriodModel
        .findOne({ financialUnitId })
        .sort({ periodIndex: -1 })
        .exec().catch((err) => {
            console.error(err);
            throw ('Chyba při načítaní financni periody');
        });
    return lastFinancialPeriod;
}



export const createFinancialPeriod = async (requestData: INewFinancialPeriodRequestData): Promise<IFinancialPeriodDoc> => {
    if (!(await financialUnitService.getIsFinancialUnitExist(requestData.financialUnitId))) {
        throw new Error('Ucetni jednotka s danym ID neexistuje');
    }
    const lastFinancialPeriod: IFinancialPeriodDoc | null = await getLastFinancialPeriod(requestData.financialUnitId);
    const startDate: Date = lastFinancialPeriod ? new Date(lastFinancialPeriod.endDate) : requestData.startDate;
    if (lastFinancialPeriod) {
        startDate.setDate(startDate.getDate() + 1);
    }
    if (requestData.endDate < startDate) {
        throw new Error('Konec ucetniho obdobi nesmi predchazet jeho pocatek');
    }
    const data: INewFinancialPeriodData = {
        financialUnitId: requestData.financialUnitId,
        periodIndex: lastFinancialPeriod ? lastFinancialPeriod.periodIndex + 1 : 1,
        startDate,
        endDate: requestData.endDate,
    };
    const financialPeriod: IFinancialPeriodDoc = await new FinancialPeriodModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření finančního obdobi');
        });
    return financialPeriod;
}



export const deleteAllFinancialPeriods = async (financialUnitId: string): Promise<'OK'> => {
    await FinancialPeriodModel.deleteMany({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování finančních obdobi');            
        });
    return 'OK';
}; 