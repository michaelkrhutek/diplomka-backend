import { FinancialTransactionModel, INewFinancialTrasactionData, IFinancialTransactionDoc } from '../models/financial-transaction.model';
import { Error } from 'mongoose';



export const createActiveFinancialTransaction = async (data: INewFinancialTrasactionData): Promise<IFinancialTransactionDoc> => {
    data.isActive = true;
    const financialTransaction: IFinancialTransactionDoc = await new FinancialTransactionModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při ukládání účetního zápisu');
        });
    return financialTransaction;
}



export const createInactiveFinancialTransaction = async (data: INewFinancialTrasactionData): Promise<IFinancialTransactionDoc> => {
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