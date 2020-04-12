import {
    IInventoryTransactionDoc,
    InventoryTransactionModel,
    INewInventoryTransaction,
    InventoryTransactionType,
    IDecrementInventoryTransactionSpecificData,
    INewInventoryTransactionRequestData,
    IIncrementInventoryTransactionSpecificData,
    IInventoryTransactionPopulatedDoc,
} from "../models/inventory-transaction.model";
import { IInventoryItemDoc } from "../models/inventory-item.model";
import * as inventoryItemService from "./inventory-item.service";
import * as financialTransactionService from "./financial-transaction.service";
import * as financialPeriodService from "./financial-period.service";
import * as inventoryGroupService from './inventory-group.service';
import * as stockService from './stock.service';
import * as utilitiesService from './utilities.service';
import { INewFinancialTransaction, FinancialTransactionModel } from "../models/financial-transaction.model";
import { IStockBatch, StockDecrementType, IStockQuantityChangeResult, IStock } from "../models/stock.model";
import { Error } from "mongoose";



let lockedInventoryItemIds: string[] = [];



const getIsInventoryItemAvailable = (inventoryItemId: string): boolean => {
    console.log(inventoryItemId, lockedInventoryItemIds);
    return !lockedInventoryItemIds.includes(inventoryItemId);
}



const lockInventoryItem = (inventoryItemId: string): void => {
    lockedInventoryItemIds = [...lockedInventoryItemIds, inventoryItemId];
    console.log(lockedInventoryItemIds);
}



const unlockInventoryItem = (inventoryItemId: string): void => {
    lockedInventoryItemIds = lockedInventoryItemIds.filter(id => id != inventoryItemId);
    console.log(inventoryItemId, lockedInventoryItemIds);
}



const verifyInventoryItemAvailability = async (
    inventoryItemId: string,
    iterationCount: number = 0
): Promise<void> => {
    if (iterationCount >= 10) {
        throw new Error('Položka je nedostupná');
    }
    const isAvailable: boolean = await new Promise((resolve) => {
        const isAvailable: boolean = getIsInventoryItemAvailable(inventoryItemId);
        isAvailable && resolve(true);
        setTimeout(() => resolve(false), 2000);
    });
    if (isAvailable) {
        return;
    } else {
        await verifyInventoryItemAvailability(inventoryItemId, iterationCount + 1)
    }
} 



export const getLastInventoryTransactionTillEffectiveDate = async (
    inventoryItemId: string,
    effectiveDate: Date
): Promise<IInventoryTransactionDoc<any> | null> => {
    const inventoryTransaction: IInventoryTransactionDoc<any> | null = await InventoryTransactionModel
        .findOne({
            inventoryItem: inventoryItemId,
            effectiveDate: { $lte: effectiveDate },
            isActive: true
        })
        .sort({ inventoryItemTransactionIndex: -1 })
        .exec().catch((err) => {
            console.error(err);
            throw ('Chyba při načítaní transakce');
        });
    return inventoryTransaction;
}



const getInventoryTransactionByTransactionIndex = async (
    inventoryItemId: string,
    inventoryItemTransactionIndex: number
): Promise<IInventoryTransactionDoc<any> | null> => {
    const inventoryTransaction: IInventoryTransactionDoc<any> | null = await InventoryTransactionModel
        .findOne({
            inventoryItem: inventoryItemId,
            inventoryItemTransactionIndex,
            isActive: true
        })
        .exec().catch((err) => {
            console.error(err);
            throw ('Chyba při načítaní transakce');
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
    inventoryItemId: string, transactionIndex: number
): Promise<IInventoryTransactionDoc<any> | null> => {
    const inventoryTransaction: IInventoryTransactionDoc<any> | null = await InventoryTransactionModel
        .findOne({
            inventoryItem: inventoryItemId,
            inventoryItemTransactionIndex: { $gte: transactionIndex },
            isActive: true
        })
        .sort({ inventoryItemTransactionIndex: 1 })
        .exec().catch((err) => {
            console.error(err);
            throw (`Chyba při načítaní predchozí transakce`);
        });
    return inventoryTransaction;
}



const getLastInventoryTransactionWithIndexLowerThanOrEqual = async (
    inventoryItemId: string, transactionIndex: number
): Promise<IInventoryTransactionDoc<any> | any> => {
    const inventoryTransaction: IInventoryTransactionDoc<any> | null = await InventoryTransactionModel
        .findOne({
            inventoryItem: inventoryItemId,
            inventoryItemTransactionIndex: { $lte: transactionIndex },
            isActive: true
        })
        .sort({ inventoryItemTransactionIndex: -1 })
        .exec().catch((err) => {
            console.error(err);
            throw (`Chyba při načítaní následné transakce`);
        });
    return inventoryTransaction;
}



const insertInventoryTransactionToDb = async <SpecificData>(
    data: INewInventoryTransaction<SpecificData>
): Promise<IInventoryTransactionDoc<SpecificData>> => {
    const intentoryTransaction: IInventoryTransactionDoc<SpecificData> = await new InventoryTransactionModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření transakce');
        });
    return intentoryTransaction;
}



const createIncrementInventoryTransaction = async (
    creatorId: string,
    created: Date,
    requestData: INewInventoryTransactionRequestData<IIncrementInventoryTransactionSpecificData>,
    previousInventoryTransaction: IInventoryTransactionDoc<any> | null,
    transactionIdForcingDerivation: string | null = null
): Promise<IInventoryTransactionDoc<IIncrementInventoryTransactionSpecificData>> => {
    const inventoryItem: IInventoryItemDoc | null = await inventoryItemService.getInventoryItem(requestData.inventoryItemId);
    if (!inventoryItem) {
        throw new Error(`Položka nenalezena`);
    }
    if (!(await financialPeriodService.getIsFinancialPeriodExistsWithDate(inventoryItem.financialUnit, requestData.effectiveDate))) {
        throw new Error('Účetní období s daným datem nenalezeno');
    }
    const stockDecrementType: StockDecrementType | null = await inventoryGroupService.getInventoryGroupStockDecrementType(
        inventoryItem.inventoryGroup
    );
    if (!stockDecrementType) {
        throw new Error(`Oceňovací metoda nenalazena`);
    }
    const effectiveDate: Date = utilitiesService.getUTCDate(requestData.effectiveDate);
    const inventoryItemTransactionIndex: number = previousInventoryTransaction ?
        previousInventoryTransaction.inventoryItemTransactionIndex + 1 :
        1;
    const currentStock: IStock = previousInventoryTransaction ?
        previousInventoryTransaction.stockAfterTransaction :
        { totalStockQuantity: 0, totalStockCost: 0, batches: [] };
    const newStockBatch: IStockBatch = {
        quantity: requestData.specificData.quantity,
        costPerUnit: requestData.specificData.costPerUnit,
        added: new Date(effectiveDate),
        transactionIndex: inventoryItemTransactionIndex
    };
    const stock: IStock = stockService.getStockIncrementResult(
        currentStock, newStockBatch, stockDecrementType
    ).stock;
    const totalTransactionAmount: number = utilitiesService.getRoundedNumber(
        requestData.specificData.quantity * requestData.specificData.costPerUnit, 2
    );
    const newTransactionData: INewInventoryTransaction<IIncrementInventoryTransactionSpecificData> = {
        type: InventoryTransactionType.Increment,
        description: requestData.description,
        inventoryItem: inventoryItem.id,
        financialUnit: inventoryItem.financialUnit,
        debitAccount: requestData.debitAccountId,
        creditAccount: requestData.creditAccountId,
        totalTransactionAmount,
        effectiveDate,
        inventoryItemTransactionIndex,
        specificData: requestData.specificData,
        stockBeforeTransaction: currentStock,
        stockAfterTransaction: stock,
        stockDecrementTypeApplied: stockDecrementType,
        isDerivedTransaction: !!transactionIdForcingDerivation,
        transactionForcingDerivation: transactionIdForcingDerivation,
        isActive: false,
        created,
        creator: creatorId
    };
    const inventoryTransaction: IInventoryTransactionDoc<IIncrementInventoryTransactionSpecificData> = await insertInventoryTransactionToDb(newTransactionData);
    const newFinancialTransactionData: INewFinancialTransaction = {
        inventoryTransaction: inventoryTransaction.id,
        inventoryItem: inventoryItem.id,
        financialUnit: inventoryItem.financialUnit,
        effectiveDate,
        debitAccount: requestData.debitAccountId,
        creditAccount: requestData.creditAccountId,
        amount: totalTransactionAmount,
        inventoryItemTransactionIndex,
        isDerivedTransaction: !!transactionIdForcingDerivation,
        inventoryTransactionForcingDerivation: transactionIdForcingDerivation,
        created,
        creator: creatorId
    };
    await financialTransactionService.createInactiveFinancialTransaction(newFinancialTransactionData);
    return inventoryTransaction;
}



const createDecrementInventoryTransaction = async (
    creatorId: string,
    created: Date,
    requestData: INewInventoryTransactionRequestData<IDecrementInventoryTransactionSpecificData>,
    previousInventoryTransaction: IInventoryTransactionDoc<any> | null,
    transactionIdForcingDerivation: string | null = null
): Promise<IInventoryTransactionDoc<IDecrementInventoryTransactionSpecificData>> => {
    const inventoryItem: IInventoryItemDoc | null = await inventoryItemService.getInventoryItem(requestData.inventoryItemId);
    if (!inventoryItem) {
        throw new Error(`Položka nenalezena`);
    }
    if (!(await financialPeriodService.getIsFinancialPeriodExistsWithDate(inventoryItem.financialUnit, requestData.effectiveDate))) {
        throw new Error('Účetní období s daným datem nenalezeno');
    }
    const stockDecrementType: StockDecrementType | null = await inventoryGroupService.getInventoryGroupStockDecrementType(
        inventoryItem.inventoryGroup
    );
    if (!stockDecrementType) {
        throw new Error(`Oceňovací metoda nenalezena`);
    }
    const effectiveDate: Date = utilitiesService.getUTCDate(requestData.effectiveDate);
    const inventoryItemTransactionIndex: number = previousInventoryTransaction ?
        previousInventoryTransaction.inventoryItemTransactionIndex + 1 :
        1;
    const currentStock: IStock = previousInventoryTransaction ?
        previousInventoryTransaction.stockAfterTransaction :
        { totalStockQuantity: 0, totalStockCost: 0, batches: [] };
    const stockDecrementResult: IStockQuantityChangeResult = stockService.getStockDecrementResult(
        currentStock, requestData.specificData.quantity, stockDecrementType
    );
    const newInventoryTransactionData: INewInventoryTransaction<IDecrementInventoryTransactionSpecificData> = {
        type: InventoryTransactionType.Decrement,
        description: requestData.description,
        inventoryItem: inventoryItem.id,
        financialUnit: inventoryItem.financialUnit,
        debitAccount: requestData.debitAccountId,
        creditAccount: requestData.creditAccountId,
        totalTransactionAmount: stockDecrementResult.changeCost,
        effectiveDate,
        inventoryItemTransactionIndex,
        specificData: requestData.specificData,
        stockBeforeTransaction: currentStock,
        stockAfterTransaction: stockDecrementResult.stock,
        stockDecrementTypeApplied: stockDecrementType,
        isDerivedTransaction: !!transactionIdForcingDerivation,
        transactionForcingDerivation: transactionIdForcingDerivation,
        isActive: false,
        created,
        creator: creatorId
    };
    const inventoryTransaction: IInventoryTransactionDoc<any> = await insertInventoryTransactionToDb(newInventoryTransactionData);
    const newFinancialTransactionData: INewFinancialTransaction = {
        inventoryTransaction: inventoryTransaction.id,
        inventoryItem: inventoryItem.id,
        financialUnit: inventoryItem.financialUnit,
        debitAccount: requestData.debitAccountId,
        creditAccount: requestData.creditAccountId,
        effectiveDate,
        amount: stockDecrementResult.changeCost,
        inventoryItemTransactionIndex,
        isDerivedTransaction: !!transactionIdForcingDerivation,
        inventoryTransactionForcingDerivation: transactionIdForcingDerivation,
        created,
        creator: creatorId
    };
    await financialTransactionService.createInactiveFinancialTransaction(newFinancialTransactionData);
    return inventoryTransaction;
}



const createInactiveInventoryTransaction = async (
    creatorId: string,
    created: Date,
    type: InventoryTransactionType,
    requestData: INewInventoryTransactionRequestData<any>,
    previousTransaction: IInventoryTransactionDoc<any> | null,
    transactionIdForcingDerivation: string | null
): Promise<IInventoryTransactionDoc<any>> => {
    switch (type) {
        case InventoryTransactionType.Increment:
            return await createIncrementInventoryTransaction(
                creatorId,
                created,
                requestData as INewInventoryTransactionRequestData<IIncrementInventoryTransactionSpecificData>,
                previousTransaction,
                transactionIdForcingDerivation
            );
        case InventoryTransactionType.Decrement:
            return await createDecrementInventoryTransaction(
                creatorId,
                created,
                requestData as INewInventoryTransactionRequestData<IDecrementInventoryTransactionSpecificData>,
                previousTransaction,
                transactionIdForcingDerivation
            );
        default:
            throw new Error('Neznámý typ skladové transakce');
    }
}



const activateCreatedInventoryTransactions = async (
    newInventoryTransactionId: string
): Promise<'OK'> => {
    await Promise.all([
        InventoryTransactionModel.findByIdAndUpdate(
            newInventoryTransactionId, 
            { isActive: true }
        ).exec(),
        InventoryTransactionModel.updateMany(
            { transactionForcingDerivation: newInventoryTransactionId },
            { isActive: true }
        ).exec(),
        financialTransactionService.activateCreatedFinancialTransactions(newInventoryTransactionId)
    ]);
    return 'OK';
}



const deleteActiveInventoryTransactionsWithIndexEqualOrLarger = async (
    inventoryItem: string,
    inventoryItemTransactionIndex: number
): Promise<'OK'> => {
    await Promise.all([
        InventoryTransactionModel.deleteMany({
            inventoryItem,
            inventoryItemTransactionIndex: { $gte: inventoryItemTransactionIndex },
            isActive: true
        }).exec(),
        financialTransactionService.deleteActiveFinancialTransactionsWithIndexEqualOrLarger(
            inventoryItem, inventoryItemTransactionIndex
        )
    ]);
    return 'OK';
}



const deleteInactiveInventoryTransaction = async (
    inventoryTransactionId: string
): Promise<'OK'> => {
    await Promise.all([
        InventoryTransactionModel.deleteMany({
            transactionForcingDerivation: inventoryTransactionId,
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
    inventoryItemId: string,
    currentInventoryTransaction: IInventoryTransactionDoc<any> | null,
    subsequentTransactionIndex: number,
    inventoryTransactionIdForcingDerivation: string,
    currentIteration: number,
    iterationLimit: number
): Promise<void> => {
    if (currentIteration > iterationLimit) {
        throw new Error('Limit počtu iterací pro přepočet následných transakcí překročen');
    }
    const subsequentInventoryTransaction: IInventoryTransactionDoc<any> | null = await getFirstInventoryTransactionWithIndexGreaterThanOrEqual(
        inventoryItemId, currentInventoryTransaction ? subsequentTransactionIndex : 0
    );
    if (!subsequentInventoryTransaction) {
        return;
    }
    const requestData: INewInventoryTransactionRequestData<any> = {
        inventoryItemId: subsequentInventoryTransaction.inventoryItem,
        description: subsequentInventoryTransaction.description,
        effectiveDate: subsequentInventoryTransaction.effectiveDate,
        debitAccountId: subsequentInventoryTransaction.debitAccount,
        creditAccountId: subsequentInventoryTransaction.creditAccount,
        specificData: subsequentInventoryTransaction.specificData
    };
    const derivedSubsequentInventoryTransaction: IInventoryTransactionDoc<any> = await createInactiveInventoryTransaction(
        subsequentInventoryTransaction.creator,
        subsequentInventoryTransaction.created,
        subsequentInventoryTransaction.type,
        requestData,
        currentInventoryTransaction,
        inventoryTransactionIdForcingDerivation
    );
    return await deriveSubsequentInventoryTransactions(
        inventoryItemId,
        derivedSubsequentInventoryTransaction,
        derivedSubsequentInventoryTransaction.inventoryItemTransactionIndex + 1,
        inventoryTransactionIdForcingDerivation,
        currentIteration + 1,
        iterationLimit
    );
}



const deriveSubsequentInventoryTransactionsDuringDelete = async (
    inventoryItemId: string,
    currentInventoryTransaction: IInventoryTransactionDoc<any> | null,
    subsequentTransactionIndex: number,
    inventoryTransactionIdForcingDerivation: string,
    currentIteration: number,
    iterationLimit: number
): Promise<void> => {
    if (currentIteration > iterationLimit) {
        throw new Error('Limit počtu iterací pro přepočet následných transakcí překročen');
    }
    const subsequentInventoryTransaction: IInventoryTransactionDoc<any> | null = await getFirstInventoryTransactionWithIndexGreaterThanOrEqual(
        inventoryItemId, subsequentTransactionIndex
    );
    if (!subsequentInventoryTransaction) {
        return;
    }
    const requestData: INewInventoryTransactionRequestData<any> = {
        inventoryItemId: subsequentInventoryTransaction.inventoryItem,
        description: subsequentInventoryTransaction.description,
        effectiveDate: subsequentInventoryTransaction.effectiveDate,
        debitAccountId: subsequentInventoryTransaction.debitAccount,
        creditAccountId: subsequentInventoryTransaction.creditAccount,
        specificData: subsequentInventoryTransaction.specificData
    };
    const derivedSubsequentInventoryTransaction: IInventoryTransactionDoc<any> = await createInactiveInventoryTransaction(
        subsequentInventoryTransaction.creator,
        subsequentInventoryTransaction.created,
        subsequentInventoryTransaction.type,
        requestData,
        currentInventoryTransaction,
        inventoryTransactionIdForcingDerivation
    );
    return await deriveSubsequentInventoryTransactionsDuringDelete(
        inventoryItemId,
        derivedSubsequentInventoryTransaction,
        subsequentInventoryTransaction.inventoryItemTransactionIndex + 1,
        inventoryTransactionIdForcingDerivation,
        currentIteration + 1,
        iterationLimit
    );
}



export const createInventoryTransaction = async (
    creatorId: string,
    type: InventoryTransactionType,
    requestData: INewInventoryTransactionRequestData<any>,
): Promise<IInventoryTransactionDoc<any>> => {
    // Locking inventory item to prevent other transaction
    await verifyInventoryItemAvailability(requestData.inventoryItemId);
    lockInventoryItem(requestData.inventoryItemId);
    // Creating transaction
    const previousInventoryTransaction: IInventoryTransactionDoc<any> | null = await getPreviousInventoryTransaction(
        requestData.inventoryItemId, requestData.effectiveDate, requestData.addBeforeTransactionWithIndex || null
    );
    const newInventoryTransaction: IInventoryTransactionDoc<any> = await createInactiveInventoryTransaction(
        creatorId, new Date(), type, requestData, previousInventoryTransaction, null
    ).catch((err) => {
        console.error(err);
        unlockInventoryItem(requestData.inventoryItemId);
        throw err;
    });
    await deriveSubsequentInventoryTransactions(
        requestData.inventoryItemId, newInventoryTransaction, newInventoryTransaction.inventoryItemTransactionIndex, newInventoryTransaction.id, 1, 50
    ).catch((err) => {
        console.error(err);
        deleteInactiveInventoryTransaction(newInventoryTransaction.id);
        unlockInventoryItem(requestData.inventoryItemId);
        throw err;
    })
    await deleteActiveInventoryTransactionsWithIndexEqualOrLarger(
        newInventoryTransaction.inventoryItem,
        newInventoryTransaction.inventoryItemTransactionIndex
    ).catch((err) => {
        console.error(err);
        deleteInactiveInventoryTransaction(newInventoryTransaction.id);
        unlockInventoryItem(requestData.inventoryItemId);
        throw err;
    });
    await activateCreatedInventoryTransactions(newInventoryTransaction.id);
    // Unlocking inventory item
    unlockInventoryItem(requestData.inventoryItemId);
    return newInventoryTransaction;
}



export const getAllInventoryTransactions = async (financialUnitId: string): Promise<IInventoryTransactionDoc<any>[]> => {
    const inventoryTransactions: IInventoryTransactionDoc<any>[] = await InventoryTransactionModel.find({ financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání transakcí');
        });
    return inventoryTransactions;
}



export const getFiltredInventoryTransactions = async (
    financialUnitId: string,
    inventoryItemId: string | null,
    transactionType: InventoryTransactionType | null,
    dateFrom: Date | null,
    dateTo: Date | null,
): Promise<IInventoryTransactionPopulatedDoc<any>[]> => {
    const inventoryTransactions: IInventoryTransactionPopulatedDoc<any>[] = await InventoryTransactionModel
        .find({
            financialUnit: financialUnitId,
            inventoryItem:  inventoryItemId || { $exists: true },
            type: transactionType || { $exists: true },
            effectiveDate: { $gte: dateFrom as Date, $lte: dateTo as Date },
            isActive: true
        })
        .populate('inventoryItem')
        .populate('creator', '-username -password')
        .sort({ effectiveDate: 1 })
        .exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání transakcí');
        });
    return inventoryTransactions;
}



export const getFiltredInventoryTransactionsTotalCount = async (
    financialUnitId: string,
    inventoryItemId: string | null,
    transactionType: InventoryTransactionType | null,
    dateFrom: Date | null,
    dateTo: Date | null
): Promise<number> => {
    const inventoryTransactionsTotalCount: number = await InventoryTransactionModel
        .countDocuments({
            financialUnit: financialUnitId,
            inventoryItem:  inventoryItemId || { $exists: true },
            type: transactionType || { $exists: true },
            effectiveDate: { $gte: dateFrom as Date, $lte: dateTo as Date },
            isActive: true
        })
        .exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání transakcí');
        });
    return inventoryTransactionsTotalCount;
}



export const getFiltredPaginatedInventoryTransactions = async (
    financialUnitId: string,
    inventoryItemId: string | null,
    transactionType: InventoryTransactionType | null,
    dateFrom: Date | null,
    dateTo: Date | null,
    pageIndex: number,
    pageSize: number
): Promise<IInventoryTransactionPopulatedDoc<any>[]> => {
    console.log(pageIndex, pageSize);
    const inventoryTransactions: IInventoryTransactionPopulatedDoc<any>[] = await InventoryTransactionModel
        .find({
            financialUnit: financialUnitId,
            inventoryItem:  inventoryItemId || { $exists: true },
            type: transactionType || { $exists: true },
            effectiveDate: { $gte: dateFrom as Date, $lte: dateTo as Date },
            isActive: true
        })
        .skip((pageIndex - 1) * pageSize)
        .limit(pageSize)
        .populate('inventoryItem')
        .populate('creator', '-username -password')
        .sort({ effectiveDate: 1 })
        .exec().catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání transakcí');
        });
    return inventoryTransactions;
}



export const getPopulatedInventoryTransactions = async (financialUnit: string): Promise<IInventoryTransactionPopulatedDoc<any>[]> => {
    const inventoryTransactions: IInventoryTransactionPopulatedDoc<any>[] = await InventoryTransactionModel
        .find({ financialUnit })
        .populate('inventoryItem')
        .populate('creator', '-username -password')
        .sort({ effectiveDate: 1 })
        .exec().catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání transakcí');
        });
    return inventoryTransactions;
}



export const getInventoryTransaction = async (inventoryTransactionId: string): Promise<IInventoryTransactionDoc<any> | null> => {
    const inventoryTransaction: IInventoryTransactionDoc<any> | null = await InventoryTransactionModel
        .findById(inventoryTransactionId).exec();
    return inventoryTransaction;
}



export const deleteInventoryTransaction = async (inventoryTransactionId: string): Promise<void> => {
    const transactionToDelete: IInventoryTransactionDoc<any> | null = await getInventoryTransaction(inventoryTransactionId);
    if (!transactionToDelete) {
        return;
    }
    const inventoryItemId: string = transactionToDelete.inventoryItem;
    // Locking inventory item to prevent other transaction
    await verifyInventoryItemAvailability(inventoryItemId);
    lockInventoryItem(inventoryItemId);
    // Deleting a transaction
    const previousTransaction: IInventoryTransactionDoc<any> | null = await getLastInventoryTransactionWithIndexLowerThanOrEqual(
        inventoryItemId, transactionToDelete.inventoryItemTransactionIndex - 1
    );
    await deriveSubsequentInventoryTransactionsDuringDelete(
        inventoryItemId, previousTransaction, transactionToDelete.inventoryItemTransactionIndex + 1 , transactionToDelete.id, 1, 10
    ).catch((err) => {
        console.error(err);
        deleteInactiveInventoryTransaction(transactionToDelete.id);
        unlockInventoryItem(inventoryItemId);
        throw new Error('Chyba při přepočítávání následných transakcí');
    });
    await deleteActiveInventoryTransactionsWithIndexEqualOrLarger(
        inventoryItemId, transactionToDelete.inventoryItemTransactionIndex
    ).catch((err) => {
        console.error(err);
        deleteInactiveInventoryTransaction(transactionToDelete.id);
        unlockInventoryItem(inventoryItemId);
        throw new Error('Chyba při odstraňování původních transakcí');
    });
    await activateCreatedInventoryTransactions(transactionToDelete.id);
    // Unlocking inventory item
    unlockInventoryItem(inventoryItemId);
}



export const deleteAllInventoryTransactions = async (financialUnitId: string): Promise<'OK'> => {
    await InventoryTransactionModel.deleteMany({ financialUnit: financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování transakcí');
        });
    await financialTransactionService.deleteAllFinancialTransactions(financialUnitId);
    return 'OK';
};



export const deleteInventoryTransactionAllFinancialTransactions = async (inventoryTransactionId: string): Promise<'OK'> => {
    await FinancialTransactionModel.deleteMany({ inventoryTransaction: inventoryTransactionId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování účetních zápisů');
        });
    return 'OK';
}



export const recalculateInventoryTransactions = async (inventoryItemId: string): Promise<void> => {
    // Locking inventory item to prevent other transaction
    await verifyInventoryItemAvailability(inventoryItemId);
    lockInventoryItem(inventoryItemId);
    // Recalculating transactions
    await deriveSubsequentInventoryTransactions(inventoryItemId, null, 1, inventoryItemId, 1, 100)
        .catch((err) => {
            console.error(err);
            deleteInactiveInventoryTransaction(inventoryItemId);
            unlockInventoryItem(inventoryItemId);
            throw new Error('Chyba při přepočítávání transakcí');
        });
    await deleteActiveInventoryTransactionsWithIndexEqualOrLarger(inventoryItemId, 1)
        .catch((err) => {
            console.error(err);
            deleteInactiveInventoryTransaction(inventoryItemId);
            unlockInventoryItem(inventoryItemId);
            throw new Error('Chyba při přepočítávání transakcí');
        });
    await activateCreatedInventoryTransactions(inventoryItemId);
    // Unlocking inventory item
    unlockInventoryItem(inventoryItemId);
}



export const getInventoryTransactionFinancialUnitId = async (inventoryTransactionId: string): Promise<string | null> => {
    const inventoryTransaction: IInventoryTransactionDoc<any> | null = await getInventoryTransaction(inventoryTransactionId);
    return inventoryTransaction ? inventoryTransaction.financialUnit : null;
}