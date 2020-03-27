import {
    IInventoryTransactionTemplateDoc,
    InventoryTransactionTemplateModel,
    INewInventoryTransactionTemplate,
    IInventoryTransactionTemplatePopulatedDoc,
} from "../models/inventory-transaction-template.model";
import { IDefaultInventoryTransactionTemplateData } from "../default-data";
import { IFinancialAccountDoc } from "../models/financial-account.model";



export const getInventoryTransactionTemplatesWithPopulatedRefs = async (
    inventoryGroupId: string
): Promise<IInventoryTransactionTemplatePopulatedDoc[]> => {
    const inventoryTransactionTemplates: IInventoryTransactionTemplatePopulatedDoc[] = await InventoryTransactionTemplateModel
    .find({ inventoryGroup: inventoryGroupId })
    .populate('inventoryGroup')
    .populate('debitAccount')
    .populate('creditAccount')
    .exec().catch((err) => {
        console.error(err);
        throw new Error('Chyba při načítání šablon transakcí');
    });
return inventoryTransactionTemplates; 
}



export const createDefaultInventoryTransactionTemplates = async (
    rawData: IDefaultInventoryTransactionTemplateData[],
    financialUnitId: string,
    inventoryGroupId: string,
    financialAccounts: IFinancialAccountDoc[],
): Promise<IInventoryTransactionTemplateDoc[]> => {
    const data: INewInventoryTransactionTemplate[] = rawData.map(temp => {
        const debitAccountId: string = (financialAccounts.find(acc => acc.code == temp.debitAccountCode) as IFinancialAccountDoc)._id.toString();
        const creditAccountId: string = (financialAccounts.find(acc => acc.code == temp.creditAccountCode) as IFinancialAccountDoc)._id.toString();
        const newTemplateData: INewInventoryTransactionTemplate = {
            description: temp.description,
            transactionType: temp.transactionType,
            financialUnit: financialUnitId,
            inventoryGroup: inventoryGroupId,
            debitAccount: debitAccountId,
            creditAccount: creditAccountId,

        };
        return newTemplateData;
    });
    const inventoryTransactionTemplates: IInventoryTransactionTemplateDoc[] = await InventoryTransactionTemplateModel.insertMany(data);
    return inventoryTransactionTemplates;
}



export const deleteAllInventoryTransactionTemplates = async (financialUnitId: string): Promise<'OK'> => {
    await InventoryTransactionTemplateModel.deleteMany({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování sablon transakci');            
        });
    return 'OK';
};