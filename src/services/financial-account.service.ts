import { FinancialAccountModel, IFinancialAccount, INewFinancialAccountData } from '../models/financial-account.model';

export const createFinancialAccount = async (data: INewFinancialAccountData): Promise<IFinancialAccount> => {
    const financialAccount: IFinancialAccount = await new FinancialAccountModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření finančního účtu');
        });
    return financialAccount;
}

export const getAllFinancialAccounts = async (financialUnitId: string): Promise<IFinancialAccount[]> => {
    const financialAccounts: IFinancialAccount[] = await FinancialAccountModel.find({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání finančních účtů');
        });
    return financialAccounts;
}

export const deleteAllFinancialAccounts = async (financialUnitId: string): Promise<'OK'> => {
    await FinancialAccountModel.deleteMany({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování finančních účtů');            
        });
    return 'OK';
}; 