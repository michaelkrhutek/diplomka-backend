import { InventoryItemModel, IInventoryItem, INewInventoryItemData, StockDecrementType } from '../models/inventory-item.model';
import { FinancialTransactionModel } from '../models/financial-transaction.model';

export const createInventoryItem = async (data: INewInventoryItemData): Promise<IInventoryItem> => {
    const inventoryItem: IInventoryItem = await new InventoryItemModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření skladové položky');
        });
    return inventoryItem;
}

export const getAllInventoryItems = async (financialUnitId: string): Promise<IInventoryItem[]> => {
    const inventoryItems: IInventoryItem[] = await InventoryItemModel.find({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání skladových položek');
        });
    return inventoryItems;
}

export const getInventoryItem = async (inventoryItemId: string): Promise<IInventoryItem | null> => {
    const inventoryItem: IInventoryItem | null = await InventoryItemModel.findById(inventoryItemId).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání skladové položky');
        });
    return inventoryItem;
}

export const getInventoryItemStockDecrementType = async (_inventoryItemId: string): Promise<StockDecrementType> => {
    return new Promise((resolve) => {
        resolve(StockDecrementType.FIFO);
    });
} 

export const deleteAllInventoryItems = async (financialUnitId: string): Promise<'OK'> => {
    await InventoryItemModel.deleteMany({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování skladových položek');            
        });
    return 'OK';
};