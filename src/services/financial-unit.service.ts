import { FinancialUnitModel, IFinancialUnit, INewFinancialUnitData } from '../models/financial-unit.model';
import { deleteAllFinancialAccounts } from './financial-account.service';
import { deleteAllFinancialTransactions } from './financial-transaction.service';

export const createFinancialUnit = async (data: INewFinancialUnitData): Promise<IFinancialUnit> => {
    const financialUnit: IFinancialUnit = await new FinancialUnitModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření účetní jednotky');
        });
    return financialUnit;
}

export const getAllFinancialUnits = async (): Promise<IFinancialUnit[]> => {
    const financialUnits: IFinancialUnit[] = await FinancialUnitModel.find().exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání účetních jednotek');
        });
    return financialUnits;
}

export const getFinancialUnit = async (financialUnitId: string): Promise<IFinancialUnit | null> => {
    const financialUnit: IFinancialUnit | null = await FinancialUnitModel.findById(financialUnitId).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání účetní jednotky');
        });
    return financialUnit;
}

export const deleteFinancialUnit = async (financialUnitId: string): Promise<'OK'> => {
    await FinancialUnitModel.findByIdAndDelete(financialUnitId).exec()
        .then(() => {
            deleteAllFinancialAccounts(financialUnitId);
            deleteAllFinancialTransactions(financialUnitId);
        })
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování účetní jednotky');            
        });
    return 'OK';
};