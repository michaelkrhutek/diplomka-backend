import { InventoryGroupModel, IInventoryGroupDoc, INewInventoryGroupData } from "../models/inventory-group.model";
import { StockDecrementType } from '../models/stock.model';
import * as financialUnitService from './financial-unit.service'; 
import * as inventoryTransactionTemplateService from './inventory-transaction-template.service'; 
import { IDefaultInventoryGroupData } from "../default-data";
import { IFinancialAccountDoc } from "../models/financial-account.model";
import { Schema } from "mongoose";



export const getIsInventoryGroupExist = async (inventoryGroupId: string, financialUnitId: string): Promise<boolean> => {
    return await InventoryGroupModel.exists({ _id: inventoryGroupId, financialUnitId });
}



export const getAllInventoryGroups = async (financialUnitId: string): Promise<IInventoryGroupDoc[]> => {
    const inventoryGroups: IInventoryGroupDoc[] = await InventoryGroupModel.find({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání skladových položek');
        });
    return inventoryGroups;
}



export const getInventoryGroup = async (inventoryGroupId: string): Promise<IInventoryGroupDoc | null> => {
    const inventoryGroup: IInventoryGroupDoc | null = await InventoryGroupModel.findById(inventoryGroupId).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání skladové položky');
        });
    return inventoryGroup;
}



export const createDefaultInventoryGroups = async (
    financialUnitId: string,
    rawData: IDefaultInventoryGroupData[],
    financialAccounts: IFinancialAccountDoc[]
): Promise<IInventoryGroupDoc[]> => {
    const inventoryGroupsPromises: Promise<IInventoryGroupDoc>[] = rawData.map(async (group) => {
        const newGroupData: INewInventoryGroupData = {
            name: group.name,
            financialUnitId,
            defaultStockDecrementType: group.defaultStockDecrementType
        };
        const inventoryGroup: IInventoryGroupDoc = await new InventoryGroupModel(newGroupData).save();
        await inventoryTransactionTemplateService.createDefaultInventoryTransactionTemplates(
            group.inventoryTransactionTemplates,
            financialUnitId,
            inventoryGroup._id.toString(),
            financialAccounts
        );
        return inventoryGroup;
    });
    const inventoryGroups: IInventoryGroupDoc[] = await Promise.all(inventoryGroupsPromises);
    return inventoryGroups;
}



export const createInventoryGroup = async (data: INewInventoryGroupData): Promise<IInventoryGroupDoc> => {
    if (!(await financialUnitService.getIsFinancialUnitExist(data.financialUnitId))) {
        throw new Error('Ucetni jednotka s danym ID neexistuje');
    }
    const inventoryGroup: IInventoryGroupDoc = await new InventoryGroupModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření skladové položky');
        });
    return inventoryGroup;
}



export const deleteAllInventoryGroups = async (financialUnitId: string): Promise<'OK'> => {
    await InventoryGroupModel.deleteMany({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování skladových položek');            
        });
    return 'OK';
};



export const getInventoryGroupStockDecrementType = async (inventoryGroupId: string): Promise<StockDecrementType | null> => {
    const inventoryGroup: IInventoryGroupDoc | null  = await InventoryGroupModel
        .findById(inventoryGroupId)
        .select({ defaultStockDecrementType: 1 })
        .lean();
    return inventoryGroup ? inventoryGroup.defaultStockDecrementType : null;
} 