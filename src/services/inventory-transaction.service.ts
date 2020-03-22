import {
    IIncrementInventoryTransactionData,
    IInventoryTransaction,
    InventoryTransactionModel,
    IStockBatch, INewInventoryTransaction,
    InventoryTransactionType,
    IDecrementInventoryTransactionData,
    IStockDecrementResult
} from "../models/inventory-transaction.model";
import { IInventoryItem, StockDecrementType } from "../models/inventory-item.model";
import { getInventoryItem, getInventoryItemStockDecrementType } from "./inventory-item.service";
import { createFinancialTransaction } from "./financial-transaction.service";
import { INewFinancialTrasactionData } from "../models/financial-transaction.model";

const getPreviousInventoryItemTransaction = async (inventoryItemId: string): Promise<IInventoryTransaction | null> => {
    const inventoryTransaction: IInventoryTransaction | null = await InventoryTransactionModel
        .findOne({ inventoryItemId })
        .sort({ _id: -1 })
        .exec().catch((err) => {
            console.error(err);
            throw (`Chyba při načítaní poslední skladové transakce skladové položky s ID ${inventoryItemId}`);     
        });
    return inventoryTransaction;
}

const insertInventoryTransactionToDb = async (data: INewInventoryTransaction): Promise<IInventoryTransaction> => {
    const intentoryTransaction: IInventoryTransaction = await new InventoryTransactionModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření skladové transakce');
        });
    return intentoryTransaction;
}

const createIncrementInventoryTransaction = async (data: IIncrementInventoryTransactionData): Promise<IInventoryTransaction> => {
    const inventoryItem: IInventoryItem | null = await getInventoryItem(data.inventoryItemId);
    if (!inventoryItem) {
        throw new Error(`Skladová položka s ID ${data.inventoryItemId} neexistuje`);
    }
    const previousInventoryTransaction: IInventoryTransaction | null = await getPreviousInventoryItemTransaction(inventoryItem.id);
    const newStockBatch: IStockBatch = { quantity: data.quantity, costPerUnit: data.costPerUnit, added: new Date() };
    const stock: IStockBatch[] = [...(previousInventoryTransaction ? previousInventoryTransaction.stock : []), newStockBatch];
    const newTransactionData: INewInventoryTransaction = {
        inventoryItemId: inventoryItem.id,
        financialUnitId: inventoryItem.financialUnitId,
        type: InventoryTransactionType.Increment,
        data,
        stock
    };
    const inventoryTransaction: IInventoryTransaction = await insertInventoryTransactionToDb(newTransactionData);
    const amount: number = data.quantity * data.costPerUnit;
    const newFinancialTransactionData: INewFinancialTrasactionData = {
        inventoryTransactionId: inventoryTransaction.id,
        inventoryItemId: inventoryItem.id,
        financialUnitId: inventoryItem.id,
        debitAccountId: data.debitAccountId,
        creditAccountId: data.creditAccountId,
        amount
    };
    await createFinancialTransaction(newFinancialTransactionData);
    return inventoryTransaction;
}

const getSortedStock = (stock: IStockBatch[], stockDecrementType: StockDecrementType): IStockBatch[] => {
    if (stockDecrementType == StockDecrementType.FIFO) {
        return stock.sort((a, b) => a.added.getMilliseconds() - b.added.getMilliseconds());
    } else if (stockDecrementType == StockDecrementType.LIFO) {
        return stock.sort((a, b) => b.added.getMilliseconds() - a.added.getMilliseconds());
    } else if (stockDecrementType == StockDecrementType.Average) {
        const quantity: number = stock
            .map((batch) => batch.quantity)
            .reduce((acc, val) => acc + val, 0);
        const totalCost: number = stock
            .map((batch) => batch.quantity)
            .reduce((acc, val) => acc + val, 0);
        const costPerUnit: number = quantity ? totalCost / quantity : 0;
        return [{ quantity, costPerUnit, added: new Date() }];
    } else {
        console.error('Neznámá oceňovací metoda pro vyskladnění');
        throw new Error('Neznámá oceňovací metoda pro vyskladnění');
    }
}

const getStockDecrementResult = (
    unorderedCurrentStock: IStockBatch[],
    quantityToRemove: number,
    stockDecrementType: StockDecrementType
): IStockDecrementResult => {
    const currentStockQuantity: number = unorderedCurrentStock
        .map((stockBatch) => stockBatch.quantity)
        .reduce((acc, val) => acc + val, 0);
    console.log(`${currentStockQuantity} < ${currentStockQuantity} >>> ${currentStockQuantity < currentStockQuantity}`);
    if (currentStockQuantity < currentStockQuantity) {
        console.error('Nedostačné množství pro vyskladnění');
        throw new Error('Nedostačné množství pro vyskladnění');
    }
    console.log('mnozstvi je ok');
    const currentStock: IStockBatch[] = getSortedStock(unorderedCurrentStock, stockDecrementType);
    let quantityToRemoveLeft: number = quantityToRemove;
    let totalCost: number = 0;
    const stock: IStockBatch[] = currentStock.map((batch): IStockBatch => {
        if (quantityToRemoveLeft == 0) {
            return { ...batch };
        } else if (batch.quantity >= quantityToRemoveLeft) {
            quantityToRemoveLeft = quantityToRemoveLeft - batch.quantity;
            return { quantity: 0, costPerUnit: batch.costPerUnit, added: batch.added };
        } else {
            const newBatchQuantity: number = batch.quantity - quantityToRemoveLeft;
            quantityToRemoveLeft = 0;
            return { quantity: newBatchQuantity, costPerUnit: batch.costPerUnit, added: batch.added };
        }
    }).filter((batch) => batch.quantity > 0);
    return { stock, totalCost };
}

const createDecrementInventoryTransaction = async (data: IDecrementInventoryTransactionData): Promise<IInventoryTransaction> => {
    const inventoryItem: IInventoryItem | null = await getInventoryItem(data.inventoryItemId);
    if (!inventoryItem) {
        console.error(`Skladová položka s ID ${data.inventoryItemId} neexistuje`);
        throw new Error(`Skladová položka s ID ${data.inventoryItemId} neexistuje`);
    }
    const stockDecrementType: StockDecrementType = await getInventoryItemStockDecrementType(inventoryItem.id);
    const previousInventoryTransaction: IInventoryTransaction | null = await getPreviousInventoryItemTransaction(inventoryItem.id);
    const currentStock: IStockBatch[] = previousInventoryTransaction ? previousInventoryTransaction.stock : [];
    const stockDecrementResult: IStockDecrementResult = getStockDecrementResult(currentStock, data.quantity, stockDecrementType);
    const newTransactionData: INewInventoryTransaction = {
        inventoryItemId: inventoryItem.id,
        financialUnitId: inventoryItem.financialUnitId,
        type: InventoryTransactionType.Decrement,
        data,
        stock: stockDecrementResult.stock
    };
    const inventoryTransaction: IInventoryTransaction = await insertInventoryTransactionToDb(newTransactionData);
    const newFinancialTransactionData: INewFinancialTrasactionData = {
        inventoryTransactionId: inventoryTransaction.id,
        inventoryItemId: inventoryItem.id,
        financialUnitId: inventoryItem.id,
        debitAccountId: data.debitAccountId,
        creditAccountId: data.creditAccountId,
        amount: stockDecrementResult.totalCost
    };
    await createFinancialTransaction(newFinancialTransactionData);
    return inventoryTransaction;
}

export const createInventoryTransaction = (type: InventoryTransactionType, data: any): Promise<IInventoryTransaction> => {
    switch (type) {
        case InventoryTransactionType.Increment:
            return createIncrementInventoryTransaction(data as IIncrementInventoryTransactionData);
        case InventoryTransactionType.Decrement:
            return createDecrementInventoryTransaction(data as IDecrementInventoryTransactionData);
        default:
            console.error('Neznámý typ skladové transakce');
            throw new Error('Neznámý typ skladové transakce');
    }
}

export const getAllInventoryTransactions = async (financialUnitId: string): Promise<IInventoryTransaction[]> => {
    const inventoryTransactions: IInventoryTransaction[] = await InventoryTransactionModel.find({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání skladových transakcí');
        });
    return inventoryTransactions;
}