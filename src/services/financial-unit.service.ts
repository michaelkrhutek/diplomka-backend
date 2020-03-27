import { FinancialUnitModel, IFinancialUnitDoc, INewFinancialUnit } from '../models/financial-unit.model';
import * as financialAccountService from './financial-account.service';
import * as financialTransactionService from './financial-transaction.service';
import * as inventoryGroupService  from './inventory-group.service';
import * as inventoryItemService  from './inventory-item.service';
import * as inventoryTransactionTemplateService from './inventory-transaction-template.service';
import * as inventoryTransactionService from './inventory-transaction.service';
import * as financialPeriodService from './financial-period.service';
import { IFinancialAccountDoc } from '../models/financial-account.model';
import { defaultAccounts, defaultInventoryGroups } from '../default-data';



export const getIsFinancialUnitExist = async (financialUnitId: string): Promise<boolean> => {
    return await FinancialUnitModel.exists({ _id: financialUnitId });
}



const generateDefaultDataInFinancialUnit = async (financialUnitId: string): Promise<void> => {
    const startDate: Date = new Date();
    startDate.setDate(1);
    startDate.setMonth(0);
    const endDate: Date = new Date();
    endDate.setDate(31);
    endDate.setMonth(11);
    await financialPeriodService.createFinancialPeriod({ name: 'Ucetni obdobi 1', financialUnitId, startDate, endDate });
    const financialAccounts: IFinancialAccountDoc[] = await financialAccountService
        .createDefaultFinancialAccounts(financialUnitId, defaultAccounts);
    await inventoryGroupService.createDefaultInventoryGroups(financialUnitId, defaultInventoryGroups, financialAccounts);
}



export const createFinancialUnit = async (data: INewFinancialUnit): Promise<IFinancialUnitDoc> => {
    const financialUnit: IFinancialUnitDoc = await new FinancialUnitModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření účetní jednotky');
        });
    await generateDefaultDataInFinancialUnit(financialUnit._id.toString())
        .catch((err) => {
            console.error(err);
            deleteFinancialUnit(financialUnit._id.toString());
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
            inventoryGroupService.deleteAllInventoryGroups(financialUnitId);
            inventoryItemService.deleteAllInventoryItems(financialUnitId);
            inventoryTransactionTemplateService.deleteAllInventoryTransactionTemplates(financialUnitId);
            inventoryTransactionService.deleteAllInventoryTransactions(financialUnitId);
            financialPeriodService.deleteAllFinancialPeriods(financialUnitId);
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