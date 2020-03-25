import { FinancialTransactionModel, INewFinancialTrasactionData, IFinancialTransactionDoc } from '../models/financial-transaction.model';
import { Error } from 'mongoose';
import * as financialPeriodService from './financial-period.service';
import * as financialAccountService from './financial-account.service';



export const createInactiveFinancialTransaction = async (data: INewFinancialTrasactionData): Promise<IFinancialTransactionDoc> => {
    if (!(await financialPeriodService.getIsFinancialPeriodExistsWithDate(data.financialUnitId, data.effectiveDate))) {
        throw new Error('Ucetni obdobi s danym datem nenalezeno');   
    }
    if (!(await financialAccountService.getIsFinancialAccountExist(data.debitAccountId, data.financialUnitId))) {
        throw new Error('Financni ucet s danym ID nenalezen');   
    }
    if (!(await financialAccountService.getIsFinancialAccountExist(data.creditAccountId, data.financialUnitId))) {
        throw new Error('Financni ucet s danym ID nenalezen');   
    }
    data.isActive = false;
    const financialTransaction: IFinancialTransactionDoc = await new FinancialTransactionModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při ukládání účetního zápisu');
        });
    return financialTransaction;
}



export const activateCreatedFinancialTransactions = async (
    inventoryTransactionId: string
): Promise<'OK'> => {
    await Promise.all([
        FinancialTransactionModel.updateMany(
            { inventoryTransactionId },
            { isActive: true }
        ).exec(),
        FinancialTransactionModel.updateMany(
            { inventoryTransactionIdForcingDerivation: inventoryTransactionId },
            { isActive: true }
        ).exec()
    ]);
    return 'OK';
}



export const deleteActiveFinancialTransactionsWithIndexEqualOrLarger = async (
    inventoryItemId: string,
    inventoryItemTransactionIndex: number
): Promise<'OK'> => {
    await FinancialTransactionModel.deleteMany({
        inventoryItemId,
        inventoryItemTransactionIndex: { $gte: inventoryItemTransactionIndex },
        isActive: true
    }).exec();
    return 'OK';
}



export const deleteInactiveFinancialTransaction = async (
    inventoryTransactionId: string
) : Promise<'OK'> => {
    await Promise.all([
        FinancialTransactionModel.deleteMany({
            inventoryTransactionIdForcingDerivation: inventoryTransactionId,
            isActive: false
        }).exec(),
        FinancialTransactionModel.deleteMany({
            inventoryTransactionId: inventoryTransactionId,
            isActive: false
        }).exec()
    ]);
    return 'OK';
}



export const getAllFinancialTransactions = async (financialUnitId: string): Promise<IFinancialTransactionDoc[]> => {
    const financialTransactions: IFinancialTransactionDoc[] = await FinancialTransactionModel.find({ financialUnitId })
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání účetních zápisů');
        });
    return financialTransactions;
}



export const deleteAllFinancialTransactions = async (financialUnitId: string): Promise<'OK'> => {
    await FinancialTransactionModel.deleteMany({ financialUnitId })
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování účetních zápisů');
        });
    return 'OK';
}