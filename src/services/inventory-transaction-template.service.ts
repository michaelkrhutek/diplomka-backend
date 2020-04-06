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
import { InventoryTransactionModel } from "../models/inventory-transaction.model";


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



export const deleteAllInventoryTransactionTemplates = async (financialUnitId: string): Promise<void> => {
    await InventoryTransactionTemplateModel.deleteMany({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování šablon');            
        });
};



export const deleteInventoryTransactionTemplate = async (id: string): Promise<void> => {
    await InventoryTransactionTemplateModel.findByIdAndDelete(id).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování šablony');            
        });
};



export const deleteInventoryTransactionTemplatesWithFinancialAccount = async (financialAccountId: string): Promise<void> => {
    await Promise.all([
        InventoryTransactionTemplateModel.deleteMany({ debitAccount: financialAccountId }).exec(),
        InventoryTransactionTemplateModel.deleteMany({ creditAccount: financialAccountId }).exec()
    ]).catch((err) => {
        console.error(err);
        throw new Error('Chyba při odstraňovaní šablon');
    });
}



export const deleteInventoryTransactionTemplatesWithInventoryGroup = async (inventoryGroupId: string): Promise<void> => {
    await InventoryTransactionTemplateModel.deleteMany({ inventoryGroup: inventoryGroupId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňovaní šablon');
        });
}