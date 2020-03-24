import {
    IInventoryTransactionDoc,
    InventoryTransactionModel,
    IStockBatch, INewInventoryTransaction,
    InventoryTransactionType,
    IStockQuantityChangeResult,
    IDecrementInventoryTransactionSpecificData,
    INewInventoryTransactionRequestData,
    IIncrementInventoryTransactionSpecificData,
} from "../models/inventory-transaction.model";
import { IInventoryItemDoc, StockDecrementType } from "../models/inventory-item.model";
import * as inventoryItemService from "./inventory-item.service";
import * as financialTransactionService from "./financial-transaction.service";
import * as utilitiesService from './utilities.service';
import { INewFinancialTrasactionData, FinancialTransactionModel } from "../models/financial-transaction.model";



const getLastInventoryTransactionTillEffectiveDate = async (
    inventoryItemId: string,
    effectiveDate: Date
): Promise<IInventoryTransactionDoc<any> | null> => {
    const inventoryTransaction: IInventoryTransactionDoc<any> | null = await InventoryTransactionModel
        .findOne({
            inventoryItemId,
            effectiveDate: { $lte: effectiveDate },
            isActive: true
        })
        .sort({ inventoryItemTransactionIndex: -1 })
        .exec().catch((err) => {
            console.error(err);
            throw ('Chyba při načítaní skladové transakce');
        });
    return inventoryTransaction;
}



const getInventoryTransactionByTransactionIndex = async (
    inventoryItemId: string,
    inventoryItemTransactionIndex: number
): Promise<IInventoryTransactionDoc<any> | null> => {
    const inventoryTransaction: IInventoryTransactionDoc<any> | null = await InventoryTransactionModel
        .findOne({
            inventoryItemId,
            inventoryItemTransactionIndex,
            isActive: true
        })
        .exec().catch((err) => {
            console.error(err);
            throw ('Chyba při načítaní skladové transakce');
        });
    return inventoryTransaction;
}



const getPreviousInventoryTransaction = async (
    inventoryItemId: string,
    effectiveDate: Date,
    currentInventoryItemTransactionIndex: number | null
): Promise<IInventoryTransactionDoc<any> | null> => {
    if (!currentInventoryItemTransactionIndex) {
        return await getLastInventoryTransactionTillEffectiveDate(inventoryItemId, effectiveDate);
    }
    const transaction: IInventoryTransactionDoc<any> | null = await getInventoryTransactionByTransactionIndex(
        inventoryItemId, currentInventoryItemTransactionIndex - 1
    );
    if (!transaction) {
        return null;
    } else if (transaction.effectiveDate > effectiveDate) {
        return await getLastInventoryTransactionTillEffectiveDate(inventoryItemId, effectiveDate);
    } else {
        return transaction;
    }
}



const getFirstInventoryTransactionWithIndexGreaterThanOrEqual = async (
    currentInventoryTransaction: IInventoryTransactionDoc<any>
): Promise<IInventoryTransactionDoc<any> | any> => {
    const inventoryTransaction: IInventoryTransactionDoc<any> | null = await InventoryTransactionModel
        .findOne({
            inventoryItemId: currentInventoryTransaction.inventoryItemId,
            inventoryItemTransactionIndex: { $gte: currentInventoryTransaction.inventoryItemTransactionIndex },
            isActive: true
        })
        .sort({ inventoryItemTransactionIndex: 1 })
        .exec().catch((err) => {
            console.error(err);
            throw (`Chyba při načítaní skladové transakce následující po transakci`);
        });
    return inventoryTransaction;
}



const insertInventoryTransactionToDb = async <SpecificData>(
    data: INewInventoryTransaction<SpecificData>
): Promise<IInventoryTransactionDoc<SpecificData>> => {
    const intentoryTransaction: IInventoryTransactionDoc<SpecificData> = await new InventoryTransactionModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření skladové transakce');
        });
    return intentoryTransaction;
}



const createIncrementInventoryTransaction = async (
    requestData: INewInventoryTransactionRequestData<IIncrementInventoryTransactionSpecificData>,
    previousInventoryTransaction: IInventoryTransactionDoc<any> | null,
    transactionIdForcingDerivation: string | null = null
): Promise<IInventoryTransactionDoc<IIncrementInventoryTransactionSpecificData>> => {
    const inventoryItem: IInventoryItemDoc | null = await inventoryItemService.getInventoryItem(requestData.inventoryItemId);
    if (!inventoryItem) {
        throw new Error(`Skladová položka s ID ${requestData.inventoryItemId} neexistuje`);
    }
    if (!inventoryItem.defaultStockDecrementType) {
        throw new Error(`Nenalezena ocenovaci metod pro vyskladneni`);
    }
    const inventoryItemTransactionIndex: number = previousInventoryTransaction ?
        previousInventoryTransaction.inventoryItemTransactionIndex + 1 :
        1;
    const currentStock: IStockBatch[] = previousInventoryTransaction ?
        previousInventoryTransaction.stock :
        [];
    const newStockBatch: IStockBatch = {
        quantity: requestData.specificData.quantity,
        costPerUnit: requestData.specificData.costPerUnit,
        added: new Date(requestData.effectiveDate),
        transactionIndex: inventoryItemTransactionIndex
    };
    const stock: IStockBatch[] = getSortedStock([...currentStock, newStockBatch], inventoryItem.defaultStockDecrementType);
    const totalTransactionAmount: number = utilitiesService.getRoundedNumber(
        requestData.specificData.quantity * requestData.specificData.costPerUnit, 2
    );
    const newTransactionData: INewInventoryTransaction<IIncrementInventoryTransactionSpecificData> = {
        type: InventoryTransactionType.Increment,
        description: requestData.description,
        inventoryItemId: inventoryItem.id,
        financialUnitId: inventoryItem.financialUnitId,
        debitAccountId: requestData.debitAccountId,
        creditAccountId: requestData.creditAccountId,
        totalTransactionAmount,
        effectiveDate: requestData.effectiveDate,
        inventoryItemTransactionIndex,
        specificData: requestData.specificData,
        stock,
        isDerivedTransaction: !!transactionIdForcingDerivation,
        transactionIdForcingDerivation,
        isActive: false
    };
    const inventoryTransaction: IInventoryTransactionDoc<IIncrementInventoryTransactionSpecificData> = await insertInventoryTransactionToDb(newTransactionData);
    const newFinancialTransactionData: INewFinancialTrasactionData = {
        inventoryTransactionId: inventoryTransaction.id,
        inventoryItemId: inventoryItem.id,
        financialUnitId: inventoryItem.financialUnitId,
        effectiveDate: requestData.effectiveDate,
        debitAccountId: requestData.debitAccountId,
        creditAccountId: requestData.creditAccountId,
        amount: totalTransactionAmount,
        inventoryItemTransactionIndex,
        isDerivedTransaction: !!transactionIdForcingDerivation,
        inventoryTransactionIdForcingDerivation: transactionIdForcingDerivation
    };
    await financialTransactionService.createInactiveFinancialTransaction(newFinancialTransactionData);
    return inventoryTransaction;
}



const getSortedStock = (stock: IStockBatch[], stockDecrementType: StockDecrementType): IStockBatch[] => {
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



const getStockDecrementResult = (
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



const createDecrementInventoryTransaction = async (
    requestData: INewInventoryTransactionRequestData<IDecrementInventoryTransactionSpecificData>,
    previousInventoryTransaction: IInventoryTransactionDoc<any> | null,
    transactionIdForcingDerivation: string | null = null
): Promise<IInventoryTransactionDoc<IDecrementInventoryTransactionSpecificData>> => {
    const inventoryItem: IInventoryItemDoc | null = await inventoryItemService.getInventoryItem(requestData.inventoryItemId);
    if (!inventoryItem) {
        throw new Error(`Skladová položka s ID ${requestData.inventoryItemId} neexistuje`);
    }
    if (!inventoryItem.defaultStockDecrementType) {
        throw new Error(`Nenalezena ocenovaci metod pro vyskladneni`);
    }
    const inventoryItemTransactionIndex: number = previousInventoryTransaction ?
        previousInventoryTransaction.inventoryItemTransactionIndex + 1 :
        1;
    const currentStock: IStockBatch[] = previousInventoryTransaction ?
        previousInventoryTransaction.stock :
        [];
    const stockDecrementResult: IStockQuantityChangeResult = getStockDecrementResult(
        currentStock, requestData.specificData.quantity, inventoryItem.defaultStockDecrementType
    );
    const newInventoryTransactionData: INewInventoryTransaction<IDecrementInventoryTransactionSpecificData> = {
        type: InventoryTransactionType.Decrement,
        description: requestData.description,
        inventoryItemId: inventoryItem.id,
        financialUnitId: inventoryItem.financialUnitId,
        debitAccountId: requestData.debitAccountId,
        creditAccountId: requestData.creditAccountId,
        totalTransactionAmount: stockDecrementResult.changeCost,
        effectiveDate: requestData.effectiveDate,
        inventoryItemTransactionIndex,
        specificData: requestData.specificData,
        stock: stockDecrementResult.stock,
        isDerivedTransaction: !!transactionIdForcingDerivation,
        transactionIdForcingDerivation,
        isActive: false
    };
    const inventoryTransaction: IInventoryTransactionDoc<any> = await insertInventoryTransactionToDb(newInventoryTransactionData);
    const newFinancialTransactionData: INewFinancialTrasactionData = {
        inventoryTransactionId: inventoryTransaction.id,
        inventoryItemId: inventoryItem.id,
        financialUnitId: inventoryItem.financialUnitId,
        debitAccountId: requestData.debitAccountId,
        creditAccountId: requestData.creditAccountId,
        effectiveDate: requestData.effectiveDate,
        amount: stockDecrementResult.changeCost,
        inventoryItemTransactionIndex,
        isDerivedTransaction: !!transactionIdForcingDerivation,
        inventoryTransactionIdForcingDerivation: transactionIdForcingDerivation
    };
    await financialTransactionService.createInactiveFinancialTransaction(newFinancialTransactionData);
    return inventoryTransaction;
}



const getCreateInactiveInventoryTransaction = (
    type: InventoryTransactionType,
    requestData: INewInventoryTransactionRequestData<any>,
    previousTransaction: IInventoryTransactionDoc<any> | null,
    transactionIdForcingDerivation: string | null
): Promise<IInventoryTransactionDoc<any>> => {
    switch (type) {
        case InventoryTransactionType.Increment:
            return createIncrementInventoryTransaction(
                requestData as INewInventoryTransactionRequestData<IIncrementInventoryTransactionSpecificData>,
                previousTransaction,
                transactionIdForcingDerivation
            );
        case InventoryTransactionType.Decrement:
            return createDecrementInventoryTransaction(
                requestData as INewInventoryTransactionRequestData<IDecrementInventoryTransactionSpecificData>,
                previousTransaction,
                transactionIdForcingDerivation
            );
        default:
            throw new Error('Neznámý typ skladové transakce');
    }
}



const createInactiveInventoryTransaction = async (
    type: InventoryTransactionType,
    requestData: INewInventoryTransactionRequestData<any>,
    previousTransaction: IInventoryTransactionDoc<any> | null,
    transactionIdForcingDerivation: string | null
): Promise<IInventoryTransactionDoc<any>> => {
    return await getCreateInactiveInventoryTransaction(
        type, requestData, previousTransaction, transactionIdForcingDerivation
    );
}



const activateCreatedInventoryTransactions = async (
    newInventoryTransactionId: string
): Promise<'OK'> => {
    await Promise.all([
        InventoryTransactionModel.findByIdAndUpdate(newInventoryTransactionId, { isActive: true }).exec(),
        InventoryTransactionModel.updateMany(
            {transactionIdForcingDerivation: newInventoryTransactionId },
            { isActive: 1 }
        ).exec(),
        financialTransactionService.activateCreatedFinancialTransactions(newInventoryTransactionId)
    ]);
    return 'OK';
}



const deleteActiveInventoryTransactionsWithIndexEqualOrLarger = async (
    inventoryItemId: string,
    inventoryItemTransactionIndex: number
): Promise<'OK'> => {
    await Promise.all([
        InventoryTransactionModel.deleteMany({
            inventoryItemId,
            inventoryItemTransactionIndex: { $gte: inventoryItemTransactionIndex },
            isActive: true
        }).exec(),
        financialTransactionService.deleteActiveFinancialTransactionsWithIndexEqualOrLarger(
            inventoryItemId, inventoryItemTransactionIndex
        )
    ]);
    return 'OK';
}



const deleteInactiveInventoryTransaction = async (
    inventoryTransactionId: string
): Promise<'OK'> => {
    await Promise.all([
        InventoryTransactionModel.deleteMany({
            transactionIdForcingDerivation: inventoryTransactionId,
            isActive: false
        }).exec(),
        InventoryTransactionModel.findByIdAndDelete(inventoryTransactionId).where({
            isActive: false
        }).exec(),
        financialTransactionService.deleteInactiveFinancialTransaction(inventoryTransactionId)
    ]);
    return 'OK';
}



const deriveSubsequentInventoryTransactions = async (
    currentInventoryTransaction: IInventoryTransactionDoc<any>,
    inventoryTransactionIdForcingDerivation: string,
    currentIteration: number,
    iterationLimit: number
): Promise<'OK'> => {
    if (currentIteration > iterationLimit) {
        throw new Error('Limit iteraci pro upravu naslednych transakci prekrocen');
        ;
    }
    const subsequentInventoryTransaction: IInventoryTransactionDoc<any> | null = await getFirstInventoryTransactionWithIndexGreaterThanOrEqual(
        currentInventoryTransaction
    );
    if (!subsequentInventoryTransaction) {
        return 'OK';
    }
    const requestData: INewInventoryTransactionRequestData<any> = {
        inventoryItemId: subsequentInventoryTransaction.inventoryItemId,
        description: subsequentInventoryTransaction.description,
        effectiveDate: subsequentInventoryTransaction.effectiveDate,
        debitAccountId: subsequentInventoryTransaction.debitAccountId,
        creditAccountId: subsequentInventoryTransaction.creditAccountId,
        specificData: subsequentInventoryTransaction.specificData
    };
    const derivedSubsequentInventoryTransaction: IInventoryTransactionDoc<any> = await createInactiveInventoryTransaction(
        subsequentInventoryTransaction.type,
        requestData,
        currentInventoryTransaction,
        inventoryTransactionIdForcingDerivation
    );
    return await deriveSubsequentInventoryTransactions(
        derivedSubsequentInventoryTransaction,
        inventoryTransactionIdForcingDerivation,
        currentIteration + 1,
        iterationLimit
    );
}



export const createInventoryTransaction = async (
    type: InventoryTransactionType,
    requestData: INewInventoryTransactionRequestData<any>,
): Promise<IInventoryTransactionDoc<any>> => {
    const previousInventoryTransaction: IInventoryTransactionDoc<any> | null = await getPreviousInventoryTransaction(
        requestData.inventoryItemId, requestData.effectiveDate, requestData.addBeforeTransactionWithIndex || null
    );
    const newInventoryTransaction: IInventoryTransactionDoc<any> = await createInactiveInventoryTransaction(
        type, requestData, previousInventoryTransaction, null
    ).catch((err) => {
        console.error(err);
        deleteInactiveInventoryTransaction(newInventoryTransaction.id);
        throw new Error('Chyba pri vytvareni nove transakce');
    });
    await deriveSubsequentInventoryTransactions(newInventoryTransaction, newInventoryTransaction.id, 1, 10).catch((err) => {
        console.error(err);
        deleteInactiveInventoryTransaction(newInventoryTransaction.id);
        throw new Error('Chyba pri prepocitavani naslednych transakci');
    }).catch((err) => {
        console.error(err);
        deleteInactiveInventoryTransaction(newInventoryTransaction.id);
        throw new Error('Chyba pri odstranovani puvodnich naslednych transakci');
    });
    await deleteActiveInventoryTransactionsWithIndexEqualOrLarger(
        newInventoryTransaction.inventoryItemId,
        newInventoryTransaction.inventoryItemTransactionIndex
    );
    await activateCreatedInventoryTransactions(newInventoryTransaction.id);
    return newInventoryTransaction;
}


export const getAllInventoryTransactions = async (financialUnitId: string): Promise<IInventoryTransactionDoc<any>[]> => {
    const inventoryTransactions: IInventoryTransactionDoc<any>[] = await InventoryTransactionModel.find({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání skladových transakcí');
        });
    return inventoryTransactions;
}



export const deleteAllInventoryTransactions = async (financialUnitId: string): Promise<'OK'> => {
    await InventoryTransactionModel.deleteMany({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování skladových transakcí');
        });
    return 'OK';
};



export const deleteInventoryTransactionAllFinancialTransactions = async (inventoryTransactionId: string): Promise<'OK'> => {
    await FinancialTransactionModel.deleteMany({ inventoryTransactionId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování účetních zápisů');
        });
    return 'OK';
}