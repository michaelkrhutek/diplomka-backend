import { InventoryItemModel, IInventoryItemDoc, INewInventoryItem, IInventoryItemPopulatedDoc } from '../models/inventory-item.model';
import * as financialUnitService from './financial-unit.service';  
import * as inventoryGroupService from './inventory-group.service';
import * as inventoryTransactionService from './inventory-transaction.service';
import { IInventoryTransactionDoc } from '../models/inventory-transaction.model';
import { IStock } from '../models/stock.model';
import { IInventoryItemStock } from '../models/inventory-item-stock.model';


export const getIsInventoryItemExist = async (inventoryItemId: string, financialUnitId: string): Promise<boolean> => {
    return await InventoryItemModel.exists({ _id: inventoryItemId, financialUnit: financialUnitId });
}



export const createInventoryItem = async (data: INewInventoryItem): Promise<IInventoryItemDoc> => {
    if (!(await financialUnitService.getIsFinancialUnitExist(data.financialUnit))) {
        throw new Error('Ucetni jednotka s danym ID nenalezena');
    }
    if (!(await inventoryGroupService.getIsInventoryGroupExist(data.inventoryGroup, data.financialUnit))) {
        throw new Error('Skupina zasob s danym ID v dane ucetni jednotce nenalezena');
    }
    const inventoryItem: IInventoryItemDoc = await new InventoryItemModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření skladové položky');
        });
    return inventoryItem;
}



export const getInventoryItemsWithPopulatedRefs = async (financialUnitId: string): Promise<IInventoryItemPopulatedDoc[]> => {
    const inventoryItems: IInventoryItemPopulatedDoc[] = await InventoryItemModel
        .find({ financialUnit: financialUnitId })
        .populate('inventoryGroup')
        .sort({ effectiveDate: -1 })
        .exec().catch((err) => {
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



export const getInventoryItemStockTillDate = async (inventoryItemId: string, effectiveDate: Date): Promise<IStock> => {
    const inventoryTransaction: IInventoryTransactionDoc<any> | null = await inventoryTransactionService
        .getLastInventoryTransactionTillEffectiveDate(inventoryItemId, effectiveDate);
    if (!inventoryTransaction) {
        const stock: IStock = {
            totalStockQuantity: 0,
            totalStockCost: 0,
            batches: []
        };
        return stock;
    }
    return inventoryTransaction.stock;
}



export const getAllInventoryItemsStocksTillDate = async (financialUnitId: string, effectiveDate: Date): Promise<IInventoryItemStock[]> => {
    const inventoryItems: IInventoryItemPopulatedDoc[] = await getInventoryItemsWithPopulatedRefs(financialUnitId);
    const stocks: IStock[] = await Promise.all(inventoryItems.map(item => getInventoryItemStockTillDate(item.id, effectiveDate)));
    return inventoryItems.map((inventoryItem, i) => {
        const inventoryItemStock: IInventoryItemStock = {
            _id: inventoryItem.id,
            inventoryItem: inventoryItem,
            stock: stocks[i]
        };
        return inventoryItemStock;
    });
}