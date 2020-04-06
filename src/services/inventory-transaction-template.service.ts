import {
    IInventoryTransactionTemplateDoc,
    InventoryTransactionTemplateModel,
    INewInventoryTransactionTemplate,
    IInventoryTransactionTemplatePopulatedDoc,
    IInventoryTransactionTemplate,
} from "../models/inventory-transaction-template.model";
import { IDefaultInventoryTransactionTemplateData } from "../default-data";
import { IFinancialAccountDoc } from "../models/financial-account.model";
import * as financialUnitService from './financial-unit.service';
import * as inventoryGroupService from './inventory-group.service';


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



export const getAllInventoryTransactionTemplatesWithPopulatedRefs = async (
    financialUnitId: string
): Promise<IInventoryTransactionTemplatePopulatedDoc[]> => {
    const inventoryTransactionTemplates: IInventoryTransactionTemplatePopulatedDoc[] = await InventoryTransactionTemplateModel
    .find({ financialUnit: financialUnitId })
    .populate('inventoryGroup')
    .populate('debitAccount')
    .populate('creditAccount')
    .exec().catch((err) => {
        console.error(err);
        throw new Error('Chyba při načítání šablon transakcí');
    });
return inventoryTransactionTemplates; 
}



export const createInventoryTransactionTemplate = async (
    data: INewInventoryTransactionTemplate
): Promise<IInventoryTransactionTemplate> => {
    if (!(await financialUnitService.getIsFinancialUnitExist(data.financialUnit))) {
        throw new Error('Ucetni jednotka s danym ID nenalezena');
    }
    if (!(await inventoryGroupService.getIsInventoryGroupExist(data.inventoryGroup, data.financialUnit))) {
        throw new Error('Skupina zasob s danym ID v dane ucetni jednotce nenalezena');
    }
    const transactionTemplate: IInventoryTransactionTemplateDoc = await new InventoryTransactionTemplateModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření šablony transakce');
        });
    return transactionTemplate;
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
            throw new Error('Chyba při odstraňování šablon');            
        });
    return 'OK';
};



export const deleteInventoryTransactionTemplates = async (id: string): Promise<'OK'> => {
    await InventoryTransactionTemplateModel.findByIdAndDelete(id).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování šablony');            
        });
    return 'OK';
};