import { InventoryItemModel, IInventoryItemDoc, INewInventoryItem, IInventoryItemPopulatedDoc } from '../models/inventory-item.model';
import * as financialUnitService from './financial-unit.service';  
import * as inventoryGroupService from './inventory-group.service';
import * as inventoryTransactionService from './inventory-transaction.service';
import { IInventoryTransactionDoc, InventoryTransactionModel } from '../models/inventory-transaction.model';
import { IStock } from '../models/stock.model';
import { IInventoryItemStock } from '../models/inventory-item-stock.model';
import { FinancialTransactionModel } from '../models/financial-transaction.model';



export const getIsInventoryItemExist = async (inventoryItemId: string, financialUnitId: string): Promise<boolean> => {
    return await InventoryItemModel.exists({ _id: inventoryItemId, financialUnit: financialUnitId });

}



const getIsInventoryItemNameExist = async (name: string, financialUnitId: string): Promise<boolean> => {
    return await InventoryItemModel.exists({ name, financialUnit: financialUnitId });
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



export const getInventoryGroupInventoryItems = async (inventoryGroupId: string): Promise<IInventoryItemDoc[]> => {
    const inventoryItems: IInventoryItemPopulatedDoc[] = await InventoryItemModel
        .find({ inventoryGroup: inventoryGroupId })
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



export const createInventoryItem = async (data: INewInventoryItem): Promise<IInventoryItemDoc> => {
    if (!(await financialUnitService.getIsFinancialUnitExist(data.financialUnit))) {
        throw new Error('Učetní jednotka nenalezena');
    }
    if (!(await inventoryGroupService.getIsInventoryGroupExist(data.inventoryGroup, data.financialUnit))) {
        throw new Error('Skupina zásob nenalezena');
    }
    if (await getIsInventoryItemNameExist(data.name, data.financialUnit)) {
        throw new Error('Název položky už existuje');
    }
    const inventoryItem: IInventoryItemDoc = await new InventoryItemModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření položky');
        });
    return inventoryItem;
}



export const updateInventoryItem = async (id: string, data: INewInventoryItem): Promise<void> => {
    const originalInventoryItem: IInventoryItemDoc | null = await getInventoryItem(id);
    if (!originalInventoryItem) {
        throw new Error('Položka nenalezena');
    }
    if (data.name != originalInventoryItem?.name && await getIsInventoryItemNameExist(data.name, originalInventoryItem.financialUnit)) {
        throw new Error('Název položky už existuje');
    }
    if (!(await inventoryGroupService.getIsInventoryGroupExist(data.inventoryGroup, originalInventoryItem.financialUnit))) {
        throw new Error('Skupina zásob nenalezena');
    }
    await InventoryItemModel.findByIdAndUpdate(id, {
        name: data.name,
        inventoryGroup: data.inventoryGroup
    }).exec().catch((err) => {
        console.error(err);
        throw new Error('Chyba při úpravě položky');
    });
    if (originalInventoryItem.inventoryGroup != data.inventoryGroup) {
        await inventoryTransactionService.recalculateInventoryTransactions(id);
    };
}



export const deleteAllInventoryItems = async (financialUnitId: string): Promise<void> => {
    await InventoryItemModel.deleteMany({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování položek');            
        });
    await inventoryTransactionService.deleteAllInventoryTransactions(financialUnitId);
};



export const deleteInventoryItem = async (id: string): Promise<void> => {
    await InventoryItemModel.findByIdAndDelete(id).exec()
    await Promise.all([
        InventoryTransactionModel.deleteMany({ inventoryItem: id }).exec(),
        FinancialTransactionModel.deleteMany({ inventoryItem: id }).exec()
    ]).catch((err) => {
        console.error(err);
        throw new Error('Chyba při odstraňování transakcí a účetních zápisů');
    });
}



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
    return inventoryTransaction.stockAfterTransaction;
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



export const getInventoryItemFinancialUnitId = async (inventoryItemId: string): Promise<string | null> => {
    const inventoryItem: IInventoryItemDoc | null = await getInventoryItem(inventoryItemId);
    return inventoryItem ? inventoryItem.financialUnit : null;
}