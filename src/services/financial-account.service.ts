import { FinancialAccountModel, IFinancialAccountDoc, INewFinancialAccount } from '../models/financial-account.model';
import * as financialUnitService from './financial-unit.service';  
import { IDefaultFinancialAccountData } from '../default-data';



export const getIsFinancialAccountExist = async (financialAccountId: string, financialUnitId: string): Promise<boolean> => {
    return await FinancialAccountModel.exists({ _id: financialAccountId, financialUnit: financialUnitId });
}



export const createDefaultFinancialAccounts = async (
    financialUnitId: string,
    rawData: IDefaultFinancialAccountData[]
): Promise<IFinancialAccountDoc[]> => {
    const data: INewFinancialAccount[] = rawData.map((acc => {
        const newAccountData: INewFinancialAccount = {
            name: acc.name,
            code: acc.code,
            financialUnit: financialUnitId
        };
        return newAccountData;
    }));
    const financialAccounts: IFinancialAccountDoc[] = await FinancialAccountModel.insertMany(data);
    return financialAccounts;
}



export const createFinancialAccount = async (data: INewFinancialAccount): Promise<IFinancialAccountDoc> => {
    if (!(await financialUnitService.getIsFinancialUnitExist(data.financialUnit))) {
        throw new Error('Ucetni jednotka s danym ID neexistuje');
    }
    const financialAccount: IFinancialAccountDoc = await new FinancialAccountModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření finančního účtu');
        });
    return financialAccount;
}



export const getAllFinancialAccounts = async (financialUnitId: string): Promise<IFinancialAccountDoc[]> => {
    const financialAccounts: IFinancialAccountDoc[] = await FinancialAccountModel
        .find({ financialUnit: financialUnitId })
        .sort({ code: 1 })
        .exec().catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání finančních účtů');
        });
    return financialAccounts;
}



export const deleteAllFinancialAccounts = async (financialUnitId: string): Promise<'OK'> => {
    await FinancialAccountModel.deleteMany({ financialUnit: financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování finančních účtů');            
        });
    return 'OK';
}; 