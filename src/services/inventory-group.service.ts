import { InventoryGroupModel, IInventoryGroupDoc, INewInventoryGroup } from "../models/inventory-group.model";
import { StockDecrementType } from '../models/stock.model';
import * as financialUnitService from './financial-unit.service'; 
import * as inventoryTransactionTemplateService from './inventory-transaction-template.service'; 
import * as inventoryItemService from './inventory-item.service';
import * as inventoryTransactionService from './inventory-transaction.service';
import { IDefaultInventoryGroupData } from "../default-data";
import { IFinancialAccountDoc } from "../models/financial-account.model";
import { InventoryItemModel, IInventoryItemDoc } from "../models/inventory-item.model";



export const getIsInventoryGroupExist = async (inventoryGroupId: string, financialUnitId: string): Promise<boolean> => {
    return await InventoryGroupModel.exists({ _id: inventoryGroupId, financialUnit: financialUnitId });
}



const getIsInventoryGroupNameExist = async (name: string, financialUnitId: string): Promise<boolean> => {
    return await InventoryGroupModel.exists({ name, financialUnit: financialUnitId });
}



export const getAllInventoryGroups = async (financialUnitId: string): Promise<IInventoryGroupDoc[]> => {
    const inventoryGroups: IInventoryGroupDoc[] = await InventoryGroupModel.find({ financialUnit: financialUnitId }).exec()
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
    financialAccounts: IFinancialAccountDoc[],
    stockDecrementType: StockDecrementType
): Promise<IInventoryGroupDoc[]> => {
    const inventoryGroupsPromises: Promise<IInventoryGroupDoc>[] = rawData.map(async (group) => {
        const newGroupData: INewInventoryGroup = {
            name: group.name,
            financialUnit: financialUnitId,
            defaultStockDecrementType: stockDecrementType
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



export const createInventoryGroup = async (data: INewInventoryGroup): Promise<IInventoryGroupDoc> => {
    if (!(await financialUnitService.getIsFinancialUnitExist(data.financialUnit))) {
        throw new Error('Účetní jednotka nenalezena');
    }
    if (await getIsInventoryGroupNameExist(data.name, data.financialUnit)) {
        throw new Error('Název skupiny už existuje');
    }
    const inventoryGroup: IInventoryGroupDoc = await new InventoryGroupModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření skupiny');
        });
    return inventoryGroup;
}



export const updateInventoryGroup = async (id: string, data: INewInventoryGroup): Promise<void> => {
    const originalInventoryGroup: IInventoryGroupDoc | null = await getInventoryGroup(id);
    if (!originalInventoryGroup) {
        throw new Error('Skupina nenalezena');
    }
    if (data.name != originalInventoryGroup?.name && await getIsInventoryGroupNameExist(data.name, originalInventoryGroup.financialUnit)) {
        throw new Error('Název skupiny už existuje');
    }
    await InventoryGroupModel.findByIdAndUpdate(id, {
        name: data.name,
        defaultStockDecrementType: data.defaultStockDecrementType
    }).exec().catch((err) => {
        console.error(err);
        throw new Error('Chyba při úpravě skupiny');
    });
    if (data.defaultStockDecrementType != originalInventoryGroup.defaultStockDecrementType) {
        const inventoryItems: IInventoryItemDoc[] = await inventoryItemService.getInventoryGroupInventoryItems(id);
        const promises: Promise<any>[] = inventoryItems.map((item) => {
            return inventoryTransactionService.recalculateInventoryTransactions(item.id).catch((err) => {
                console.error(err);
                return null;
            });
        });
        await Promise.all(promises).catch((err) => {
            console.error(err);
            return null;
        });
    }
}



export const deleteAllInventoryGroups = async (financialUnitId: string): Promise<void> => {
    await InventoryGroupModel.deleteMany({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování skupin');            
        });
    await Promise.all([
        inventoryTransactionTemplateService.deleteAllInventoryTransactionTemplates(financialUnitId),
        inventoryItemService.deleteAllInventoryItems(financialUnitId)
    ]);
};



export const deleteInventoryGroup = async (id: string): Promise<void> => {
    await InventoryGroupModel.findByIdAndDelete(id).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování skupiny');            
        });
    const items = await InventoryItemModel.find({ inventoryGroup: id });
    Promise.all([
        inventoryTransactionTemplateService.deleteInventoryTransactionTemplatesWithInventoryGroup(id),
        ...items.map(item => inventoryItemService.deleteInventoryItem(item._id))
    ]);
}



export const getInventoryGroupStockDecrementType = async (inventoryGroupId: string): Promise<StockDecrementType | null> => {
    const inventoryGroup: IInventoryGroupDoc | null  = await InventoryGroupModel
        .findById(inventoryGroupId)
        .select({ defaultStockDecrementType: 1 });
    return inventoryGroup ? inventoryGroup.defaultStockDecrementType : null;
}