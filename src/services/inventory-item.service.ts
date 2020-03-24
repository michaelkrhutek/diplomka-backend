import { InventoryItemModel, IInventoryItemDoc, INewInventoryItemData, StockDecrementType } from '../models/inventory-item.model';



export const parseStockDecrementType = (typeAsString: string): StockDecrementType | null => {
    switch (typeAsString) {
        case StockDecrementType.FIFO:
            return StockDecrementType.FIFO;
        case StockDecrementType.LIFO:
            return StockDecrementType.LIFO;
        case StockDecrementType.Average:
            return StockDecrementType.Average;
        default:
            return null;
    }
}



export const createInventoryItem = async (data: INewInventoryItemData): Promise<IInventoryItemDoc> => {
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



export const getInventoryItemStockDecrementType = async (inventoryItemId: string): Promise<StockDecrementType | null> => {
    const StockDecrementType: StockDecrementType | null  = await InventoryItemModel
        .findById(inventoryItemId)
        .select({ defaultStockDecrementType: 1 })
        .lean();
    return StockDecrementType;
} 



export const deleteAllInventoryItems = async (financialUnitId: string): Promise<'OK'> => {
    await InventoryItemModel.deleteMany({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování skladových položek');            
        });
    return 'OK';
};