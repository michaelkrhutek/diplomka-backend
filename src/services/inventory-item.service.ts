import { InventoryItemModel, IInventoryItemDoc, INewInventoryItemData } from '../models/inventory-item.model';
import * as financialUnitService from './financial-unit.service';  
import * as inventoryGroupService from './inventory-group.service';


export const getIsInventoryItemExist = async (inventoryItemId: string, financialUnitId: string): Promise<boolean> => {
    return await InventoryItemModel.exists({ _id: inventoryItemId, financialUnitId });
}



export const createInventoryItem = async (data: INewInventoryItemData): Promise<IInventoryItemDoc> => {
    if (!(await financialUnitService.getIsFinancialUnitExist(data.financialUnitId))) {
        throw new Error('Ucetni jednotka s danym ID nenalezena');
    }
    if (!(await inventoryGroupService.getIsInventoryGroupExist(data.inventoryGroupId, data.financialUnitId))) {
        throw new Error('Skupina zasob s danym ID v dane ucetni jednotce nenalezena');
    }
    const inventoryItem: IInventoryItemDoc = await new InventoryItemModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření skladové položky');
        });
    return inventoryItem;
}



export const getAllInventoryItems = async (financialUnitId: string): Promise<IInventoryItemDoc[]> => {
    const inventoryItems: IInventoryItemDoc[] = await InventoryItemModel.find({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání skladových položek');
        });
    return inventoryItems;
}



export const getInventoryItem = async (inventoryItemId: string): Promise<IInventoryItemDoc | null> => {
    const inventoryItem: IInventoryItemDoc | null = await InventoryItemModel.findById(inventoryItemId).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání skladové položky');
        });
    return inventoryItem;
}



export const deleteAllInventoryItems = async (financialUnitId: string): Promise<'OK'> => {
    await InventoryItemModel.deleteMany({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování skladových položek');            
        });
    return 'OK';
};