import { StockDecrementType, IStockBatch, IStockQuantityChangeResult } from "../models/stock.model";
import * as utilitiesService from './utilities.service';



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



export const getSortedStock = (stock: IStockBatch[], stockDecrementType: StockDecrementType): IStockBatch[] => {
    if (stock.length == 0) {
        return [];
    } else if (stockDecrementType == StockDecrementType.FIFO) {
        return stock.sort((a, b) => a.transactionIndex - b.transactionIndex);
    } else if (stockDecrementType == StockDecrementType.LIFO) {
        return stock.sort((a, b) => b.transactionIndex - a.transactionIndex);
    } else if (stockDecrementType == StockDecrementType.Average) {
        const totalStockQuantity: number = stock
            .map(batch => batch.quantity)
            .reduce((acc, val) => acc + val, 0);
        const totalStockCost: number = stock
            .map(batch => batch.quantity * batch.costPerUnit)
            .reduce((acc, val) => acc + val, 0);
        const costPerUnit: number = totalStockQuantity ? totalStockCost / totalStockQuantity : 0;
        return [{ quantity: totalStockQuantity, costPerUnit, added: new Date(), transactionIndex: 0 }];
    } else {
        throw new Error('Neznámá oceňovací metoda pro vyskladnění');
    }
}



export const getStockDecrementResult = (
    unorderedCurrentStock: IStockBatch[],
    quantityToRemove: number,
    stockDecrementType: StockDecrementType
): IStockQuantityChangeResult => {
    const currentStockQuantity: number = unorderedCurrentStock
        .map((stockBatch) => stockBatch.quantity)
        .reduce((acc, val) => acc + val, 0);
    if (currentStockQuantity < quantityToRemove) {
        throw new Error('Nedostačné množství pro vyskladnění');
    }
    const currentStock: IStockBatch[] = getSortedStock(unorderedCurrentStock, stockDecrementType);
    let quantityToRemoveLeft: number = quantityToRemove;
    let changeCost: number = 0;
    const unfiltredStock: IStockBatch[] = currentStock.map((batch): IStockBatch => {
        if (quantityToRemoveLeft == 0) {
            const { quantity, costPerUnit, added } = batch;
            return {
                quantity,
                costPerUnit,
                added,
                transactionIndex: batch.transactionIndex
            };
        } else if (batch.quantity < quantityToRemoveLeft) {
            changeCost += batch.quantity * batch.costPerUnit;
            quantityToRemoveLeft = quantityToRemoveLeft - batch.quantity;
            return {
                quantity: 0,
                costPerUnit: batch.costPerUnit,
                added: batch.added,
                transactionIndex: batch.transactionIndex
            };
        } else {
            const newBatchQuantity: number = batch.quantity - quantityToRemoveLeft;
            changeCost += quantityToRemoveLeft * batch.costPerUnit;
            quantityToRemoveLeft = 0;
            return {
                quantity: newBatchQuantity,
                costPerUnit: batch.costPerUnit,
                added: batch.added,
                transactionIndex: batch.transactionIndex
            };
        }
    })
    const stock: IStockBatch[] = unfiltredStock.filter((batch) => batch.quantity > 0);
    return { stock, changeCost: utilitiesService.getRoundedNumber(changeCost, 2) };
}