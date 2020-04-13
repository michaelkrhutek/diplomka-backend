import { FinancialUnitModel, IFinancialUnitDoc, INewFinancialUnit, IFinancialUnitPopulatedDoc } from '../models/financial-unit.model';
import * as financialAccountService from './financial-account.service';
import * as financialTransactionService from './financial-transaction.service';
import * as inventoryGroupService  from './inventory-group.service';
import * as inventoryItemService  from './inventory-item.service';
import * as inventoryTransactionTemplateService from './inventory-transaction-template.service';
import * as inventoryTransactionService from './inventory-transaction.service';
import * as financialPeriodService from './financial-period.service';
import * as utilitiesService from './utilities.service';
import { IFinancialAccountDoc } from '../models/financial-account.model';
import { defaultAccounts, defaultInventoryGroups } from '../default-data';
import { Request } from 'express';
import { IUserDoc } from '../models/user.model';
import { StockValuationMethod } from '../models/stock.model';



export const getIsFinancialUnitExist = async (financialUnitId: string): Promise<boolean> => {
    return await FinancialUnitModel.exists({ _id: financialUnitId })
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při ověřování existence účetní jednotky');
        });
}



export const getHasUserAccessToFinancialUnit = async (financialUnitId: string, userId: string): Promise<boolean> => {
    return await FinancialUnitModel.exists({ _id: financialUnitId, users: userId })
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při ověřování práv uživatele k účetní jednotce');
        });
}



export const testAccessToFinancialUnit = async (financialUnitId: string, req: Request): Promise<void> => {
    const userId: string | null = req.session ? req.session.userId : null;
    if (!(await getHasUserAccessToFinancialUnit(financialUnitId, userId as string))) {
        throw new Error('Chybí uživatelská práva k účetní jednotce');
    }
}



export const getHasUserOwnershipToFinancialUnit = async (financialUnitId: string, userId: string): Promise<boolean> => {
    return await FinancialUnitModel.exists({ _id: financialUnitId, owner: userId })
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při ověřování vlastnictví uživatele k účetní jednotce');
        });
}



export const testOwnershipToFinancialUnit = async (financialUnitId: string, req: Request): Promise<void> => {
    const userId: string | null = req.session ? req.session.userId : null;
    if (!(await getHasUserOwnershipToFinancialUnit(financialUnitId, userId as string))) {
        throw new Error('Chybí vlastnická práva k účetní jednotce');
    }
}



export const getAllFinancialUnits = async (userId: string): Promise<IFinancialUnitDoc[]> => {
    const financialUnits: IFinancialUnitDoc[] = await FinancialUnitModel
        .find({ users: userId })
        .exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání účetních jednotek');
        });
    return financialUnits;
}



export const getFinancialUnit = async (financialUnitId: string): Promise<IFinancialUnitDoc | null> => {
    const financialUnit: IFinancialUnitDoc | null = await FinancialUnitModel.findById(financialUnitId).exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání účetní jednotky');
        });
    return financialUnit;
}




export const getFinancialUnitUsers = async (financialUnitId: string): Promise<IUserDoc[]> => {
    const populatedFinancialUnit: IFinancialUnitPopulatedDoc | null = await FinancialUnitModel
        .findById(financialUnitId)
        .populate('users', '-username -password')
        .exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání uživatelů účetní jednotky');
        });
    return populatedFinancialUnit ? populatedFinancialUnit.users : [];
}



const generateDefaultDataInFinancialUnit = async (
    financialUnitId: string,
    stockValuationMethod: StockValuationMethod
): Promise<void> => {
    const startDate: Date = utilitiesService.getUTCDate(new Date());
    startDate.setMonth(0);
    startDate.setDate(1);
    const endDate: Date = utilitiesService.getUTCDate(new Date(), true);
    endDate.setMonth(11);
    endDate.setDate(31);
    await financialPeriodService.createFinancialPeriod({ name: '', financialUnitId, startDate, endDate });
    const financialAccounts: IFinancialAccountDoc[] = await financialAccountService
        .createDefaultFinancialAccounts(financialUnitId, defaultAccounts);
    await inventoryGroupService.createDefaultInventoryGroups(
        financialUnitId, defaultInventoryGroups, financialAccounts, stockValuationMethod
    );
}



export const createFinancialUnit = async (
    data: INewFinancialUnit,
    createDefaultData: boolean,
    stockValuationMethod: StockValuationMethod
): Promise<IFinancialUnitDoc> => {
    const financialUnit: IFinancialUnitDoc = await new FinancialUnitModel(data).save()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při vytváření účetní jednotky');
        });
    if (createDefaultData && stockValuationMethod) {
        await generateDefaultDataInFinancialUnit(financialUnit._id.toString(), stockValuationMethod)
        .catch((err) => {
            console.error(err);
            deleteFinancialUnit(financialUnit._id.toString());
            throw new Error('Chyba při vytváření účetní jednotky');
        });
    }
    return financialUnit;
}



export const getFinancialUnitWithPopulatedRefs = async (financialUnitId: string): Promise<IFinancialUnitDoc | null> => {
    const financialUnit: IFinancialUnitDoc | null = await FinancialUnitModel
        .findById(financialUnitId)
        .populate('users', '-username -password')
        .exec()
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při načítání účetní jednotky');
        });
    return financialUnit;
}



export const deleteFinancialUnit = async (financialUnitId: string): Promise<'OK'> => {
    await FinancialUnitModel.findByIdAndDelete(financialUnitId).exec()
        .then((_res) => {
            financialAccountService.deleteAllFinancialAccounts(financialUnitId);
            financialTransactionService.deleteAllFinancialTransactions(financialUnitId);
            inventoryGroupService.deleteAllInventoryGroups(financialUnitId);
            inventoryItemService.deleteAllInventoryItems(financialUnitId);
            inventoryTransactionTemplateService.deleteAllInventoryTransactionTemplates(financialUnitId);
            inventoryTransactionService.deleteAllInventoryTransactions(financialUnitId);
            financialPeriodService.deleteAllFinancialPeriods(financialUnitId);
        })
        .catch((err) => {
            console.error(err);
            throw new Error('Chyba při odstraňování účetní jednotky');            
        });
    return 'OK';
};



export const deleteAllTransactions = async (financialUnitId: string): Promise<'OK'> => {
    await Promise.all([
        financialTransactionService.deleteAllFinancialTransactions(financialUnitId),
        inventoryTransactionService.deleteAllInventoryTransactions(financialUnitId)
    ]).catch((err) => {
        console.error(err);
        throw new Error('Chyba při odstraňování transakcí účetní jednotky');            
    });
    return 'OK';
};



export const addUserToFinancialUnit = async (
    financialUnitId: string,
    userId: string
): Promise<void> => {
    await FinancialUnitModel.update(
        { _id: financialUnitId }, 
        { $push: { users: userId } },
    )
    .exec()
    .catch((err) => {
        console.error(err);
        throw new Error('Chyba při přidávání uživatelských práv k účetní jednotce');
    });
}



export const removeUserToFinancialUnit = async (
    financialUnitId: string,
    userId: string
): Promise<void> => {
    await FinancialUnitModel.update(
        { _id: financialUnitId }, 
        { $pull: { users: userId } },
    )
    .exec()
    .catch((err) => {
        console.error(err);
        throw new Error('Chyba při odebírání uživatelských práv k účetní jednotce');
    });
}