import { FinancialAccountModel, IFinancialAccountDoc, INewFinancialAccount } from '../models/financial-account.model';
import * as financialUnitService from './financial-unit.service'; 
import * as inventoryTransactionService from './inventory-transaction.service';
import * as inventoryTransactionTemplateService from './inventory-transaction-template.service'; 
import { IDefaultFinancialAccountData } from '../default-data';
import { InventoryTransactionModel } from '../models/inventory-transaction.model';
import { FinancialTransactionModel } from '../models/financial-transaction.model';



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



export const deleteAllFinancialAccounts = async (financialUnitId: string): Promise<void> => {
    await FinancialAccountModel.deleteMany({ financialUnit: financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování účtů');            
        });
    await Promise.all([
        inventoryTransactionTemplateService.deleteAllInventoryTransactionTemplates(financialUnitId),
        inventoryTransactionService.deleteAllInventoryTransactions(financialUnitId)
    ]);
};



export const deleteFinancialAccount = async (financialAccountId: string): Promise<void> => {
    await FinancialAccountModel.findByIdAndDelete(financialAccountId).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování účtu');            
        });
    await Promise.all([
        inventoryTransactionTemplateService.deleteInventoryTransactionTemplatesWithFinancialAccount(financialAccountId),
        InventoryTransactionModel.deleteMany({ debitAccount: financialAccountId }).exec(),
        InventoryTransactionModel.deleteMany({ creditAccount: financialAccountId }).exec(),
        FinancialTransactionModel.deleteMany({ debitAccount: financialAccountId }).exec(),
        FinancialTransactionModel.deleteMany({ creditAccount: financialAccountId }).exec() 
    ]).catch((err) => {
        console.error(err);
        throw new Error('Chyba při odstraňování transakcí a účetních zápisů');       
    });
}