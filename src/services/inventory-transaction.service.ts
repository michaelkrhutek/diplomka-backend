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



export const getLastInventoryTransactionTillEffectiveDate = async (
    inventoryItemId: string,
    effectiveDate: Date
): Promise<IInventoryTransactionDoc<any> | null> => {
    const transactions = await InventoryTransactionModel
    .find({
        inventoryItem: inventoryItemId,
        effectiveDate: { $lte: effectiveDate },
        isActive: true
    })
    .sort({ inventoryItemTransactionIndex: -1 })
    .exec().catch((err) => {
        console.error(err);
        throw ('Chyba při načítaní skladové transakce');
    });
    const inventoryTransaction: IInventoryTransactionDoc<any> | null = await InventoryTransactionModel
        .findOne({
            inventoryItem: inventoryItemId,
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
            inventoryItem: inventoryItemId,
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
    inventoryItemId: string, transactionIndex: number
): Promise<IInventoryTransactionDoc<any> | any> => {
    const inventoryTransaction: IInventoryTransactionDoc<any> | null = await InventoryTransactionModel
        .findOne({
            inventoryItem: inventoryItemId,
            inventoryItemTransactionIndex: { $gte: transactionIndex },
            isActive: true
        })
        .sort({ inventoryItemTransactionIndex: 1 })
        .exec().catch((err) => {
            console.error(err);
            throw (`Chyba při načítaní skladové transakce následující po transakci`);
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
    if (!(await financialPeriodService.getIsFinancialPeriodExistsWithDate(inventoryItem.financialUnit, requestData.effectiveDate))) {
        throw new Error('Ucetni obdobi s danym datumem nenalezeno');
    }
    const stockDecrementType: StockDecrementType | null = await inventoryGroupService.getInventoryGroupStockDecrementType(
        inventoryItem.inventoryGroup
    );
    if (!stockDecrementType) {
        throw new Error(`Nenalezena ocenovaci metod pro vyskladneni`);
    }
    const effectiveDate: Date = utilitiesService.getUTCDate(requestData.effectiveDate);
    const inventoryItemTransactionIndex: number = previousInventoryTransaction ?
        previousInventoryTransaction.inventoryItemTransactionIndex + 1 :
        1;
    const currentStock: IStock = previousInventoryTransaction ?
        previousInventoryTransaction.stock :
        { totalStockQuantity: 0, totalStockCost: 0, batches: [] };
    const newStockBatch: IStockBatch = {
        quantity: requestData.specificData.quantity,
        costPerUnit: requestData.specificData.costPerUnit,
        added: new Date(effectiveDate),
        transactionIndex: inventoryItemTransactionIndex
    };
    const stock: IStock = stockService.getStockIncrementResult(currentStock, newStockBatch).stock;
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
        stock,
        isDerivedTransaction: !!transactionIdForcingDerivation,
        transactionForcingDerivation: transactionIdForcingDerivation,
        isActive: false
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
        inventoryTransactionForcingDerivation: transactionIdForcingDerivation
    };
    await financialTransactionService.createInactiveFinancialTransaction(newFinancialTransactionData);
    return inventoryTransaction;
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
    if (!(await financialPeriodService.getIsFinancialPeriodExistsWithDate(inventoryItem.financialUnit, requestData.effectiveDate))) {
        throw new Error('Ucetni obdobi s danym datumem nenalezeno');
    }
    const stockDecrementType: StockDecrementType | null = await inventoryGroupService.getInventoryGroupStockDecrementType(
        inventoryItem.inventoryGroup
    );
    if (!stockDecrementType) {
        throw new Error(`Nenalezena ocenovaci metoda`);
    }
    const effectiveDate: Date = utilitiesService.getUTCDate(requestData.effectiveDate);
    const inventoryItemTransactionIndex: number = previousInventoryTransaction ?
        previousInventoryTransaction.inventoryItemTransactionIndex + 1 :
        1;
    const currentStock: IStock = previousInventoryTransaction ?
        previousInventoryTransaction.stock :
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
        stock: stockDecrementResult.stock,
        isDerivedTransaction: !!transactionIdForcingDerivation,
        transactionForcingDerivation: transactionIdForcingDerivation,
        isActive: false
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
        inventoryTransactionForcingDerivation: transactionIdForcingDerivation
    };
    await financialTransactionService.createInactiveFinancialTransaction(newFinancialTransactionData);
    return inventoryTransaction;
}



const createInactiveInventoryTransaction = async (
    type: InventoryTransactionType,
    requestData: INewInventoryTransactionRequestData<any>,
    previousTransaction: IInventoryTransactionDoc<any> | null,
    transactionIdForcingDerivation: string | null
): Promise<IInventoryTransactionDoc<any>> => {
    switch (type) {
        case InventoryTransactionType.Increment:
            return await createIncrementInventoryTransaction(
                requestData as INewInventoryTransactionRequestData<IIncrementInventoryTransactionSpecificData>,
                previousTransaction,
                transactionIdForcingDerivation
            );
        case InventoryTransactionType.Decrement:
            return await createDecrementInventoryTransaction(
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
        currentInventoryTransaction.inventoryItem, currentInventoryTransaction.inventoryItemTransactionIndex
    );
    if (!subsequentInventoryTransaction) {
        return 'OK';
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



const deriveSubsequentInventoryTransactionsDuringDelete = async (
    inventoryItemId: string,
    currentInventoryTransaction: IInventoryTransactionDoc<any> | null,
    subsequentTransactionIndex: number,
    inventoryTransactionIdForcingDerivation: string,
    currentIteration: number,
    iterationLimit: number
): Promise<void> => {
    if (currentIteration > iterationLimit) {
        throw new Error('Limit iteraci pro upravu naslednych transakci prekrocen');
        ;
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
        throw new Error('Chyba pri vytvareni nove transakce');
    });
    await deriveSubsequentInventoryTransactions(
        newInventoryTransaction, newInventoryTransaction.id, 1, 10
    ).catch((err) => {
        console.error(err);
        deleteInactiveInventoryTransaction(newInventoryTransaction.id);
        throw new Error('Chyba pri prepocitavani naslednych transakci');
    })
    await deleteActiveInventoryTransactionsWithIndexEqualOrLarger(
        newInventoryTransaction.inventoryItem,
        newInventoryTransaction.inventoryItemTransactionIndex
    ).catch((err) => {
        console.error(err);
        deleteInactiveInventoryTransaction(newInventoryTransaction.id);
        throw new Error('Chyba pri odstranovani puvodnich naslednych transakci');
    });
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
            effectiveDate: { $gte: dateFrom as Date, $lte: dateTo as Date }
        })
        .populate('inventoryItem')
        .sort({ effectiveDate: 1 })
        .exec().catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání skladových transakcí');
        });
    return inventoryTransactions;
}



export const getPopulatedInventoryTransactions = async (financialUnit: string): Promise<IInventoryTransactionPopulatedDoc<any>[]> => {
    const inventoryTransactions: IInventoryTransactionPopulatedDoc<any>[] = await InventoryTransactionModel
        .find({ financialUnit })
        .populate('inventoryItem')
        .sort({ effectiveDate: 1 })
        .exec().catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání skladových transakcí');
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
    const previousTransaction: IInventoryTransactionDoc<any> | null = await getLastInventoryTransactionWithIndexLowerThanOrEqual(
        inventoryItemId, transactionToDelete.inventoryItemTransactionIndex - 1
    );
    await deriveSubsequentInventoryTransactionsDuringDelete(
        inventoryItemId, previousTransaction, transactionToDelete.inventoryItemTransactionIndex + 1 , transactionToDelete.id, 1, 10
    ).catch((err) => {
        console.error(err);
        deleteInactiveInventoryTransaction(transactionToDelete.id);
        throw new Error('Chyba pri prepocitavani naslednych transakci');
    });
    await deleteActiveInventoryTransactionsWithIndexEqualOrLarger(
        inventoryItemId, transactionToDelete.inventoryItemTransactionIndex
    ).catch((err) => {
        console.error(err);
        deleteInactiveInventoryTransaction(transactionToDelete.id);
        throw new Error('Chyba pri odstranovani puvodnich naslednych transakci');
    });
    await activateCreatedInventoryTransactions(transactionToDelete.id);
}



export const deleteAllInventoryTransactions = async (financialUnitId: string): Promise<'OK'> => {
    await InventoryTransactionModel.deleteMany({ financialUnit: financialUnitId }).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování skladových transakcí');
        });
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