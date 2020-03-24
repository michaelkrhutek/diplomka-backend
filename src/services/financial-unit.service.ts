import { FinancialUnitModel, IFinancialUnitDoc, INewFinancialUnitData } from '../models/financial-unit.model';
import * as financialAccountService from './financial-account.service';
import * as financialTransactionService from './financial-transaction.service';
import * as inventoryItemService  from './inventory-item.service';
import * as inventoryTransactionService from './inventory-transaction.service';



export const createFinancialUnit = async (data: INewFinancialUnitData): Promise<IFinancialUnitDoc> => {
    const financialUnit: IFinancialUnitDoc = await new FinancialUnitModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření účetní jednotky');
        });
    return financialUnit;
}



export const getAllFinancialUnits = async (): Promise<IFinancialUnitDoc[]> => {
    const financialUnits: IFinancialUnitDoc[] = await FinancialUnitModel.find().exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání účetních jednotek');
        });
    return financialUnits;
}



export const getFinancialUnit = async (financialUnitId: string): Promise<IFinancialUnitDoc | null> => {
    const financialUnit: IFinancialUnitDoc | null = await FinancialUnitModel.findById(financialUnitId).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání účetní jednotky');
        });
    return financialUnit;
}



export const deleteFinancialUnit = async (financialUnitId: string): Promise<'OK'> => {
    await FinancialUnitModel.findByIdAndDelete(financialUnitId).exec()
        .then((_res) => {
            financialAccountService.deleteAllFinancialAccounts(financialUnitId);
            financialTransactionService.deleteAllFinancialTransactions(financialUnitId);
            inventoryItemService.deleteAllInventoryItems(financialUnitId);
            inventoryTransactionService.deleteAllInventoryTransactions(financialUnitId);
        })
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování účetní jednotky');            
        });
    return 'OK';
};



export const deleteAllTransactions = async (financialUnitId: string): Promise<'OK'> => {
    await Promise.all([
        financialTransactionService.deleteAllFinancialTransactions(financialUnitId),
        inventoryTransactionService.deleteAllInventoryTransactions(financialUnitId)
    ]).catch((err) => {
        console.error(err);
        throw new Error('Chyba při odstraňování transakcí účetní jednotky');            
    });
    return 'OK';
};