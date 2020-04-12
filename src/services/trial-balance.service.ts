import { FinancialTransactionModel } from "../models/financial-transaction.model";
import { mongoose } from "../mongoose-instance";
import { FinancialAccountModel, IFinancialAccount } from "../models/financial-account.model";
import { Schema } from "mongoose";
import { IAccountTurnover, ITrialBalance, ITrialBalanceAccount } from "../models/trial-balance.model";
import * as utilitiesService from './utilities.service';
import * as financialPeriodService from './financial-period.service';
import { IFinancialPeriodDoc } from "../models/financial-period.model";

const getAccountsTurnovers = (
    financialUnitId: string,
    type: 'debit' | 'credit',
    startDate: Date,
    endDate: Date
): Promise<IAccountTurnover[]> => {
    return FinancialTransactionModel.aggregate()
        .match({
            financialUnit: mongoose.Types.ObjectId(financialUnitId),
            effectiveDate: { $gte: startDate, $lte: endDate }
        })
        .group({
            _id: type == 'debit' ? '$debitAccount' : '$creditAccount',
            count: { $sum: 1 },
            total: { $sum: '$amount' }
        })
        .lookup({
            from: FinancialAccountModel.collection.name,
            localField: '_id',
            foreignField: '_id',
            as: 'accounts'
        })
        .then((turnovers: { _id: Schema.Types.ObjectId, count: number, accounts: IFinancialAccount[], total: number }[]) => {
            console.log(turnovers);
            const accountsTurnovers = turnovers.map(t => {
                const accountTurnover: any = {
                    accountId: t._id.toString(),
                    account: t.accounts.length > 0 ? t.accounts[0] : null,
                    indicator: type == 'debit' ? 'd' : 'c',
                    count: t.count,
                    total: t.total
                };
                return accountTurnover;
            });
            return accountsTurnovers;
        });
};



export const getFinancialPeriodTrialBalance = async (
    financialPeriodId: string
): Promise<ITrialBalance> => {
    const financialPeriod: IFinancialPeriodDoc | null = await financialPeriodService.getFinancialPeriod(financialPeriodId);
    if (!financialPeriod) {
        throw new Error('Účetní období nenalezeno');   
    }
    return await getTrialBalance(financialPeriod.financialUnit, financialPeriod.startDate, financialPeriod.endDate);
}



export const getTrialBalance = async (
    financialUnitId: string,
    startDate: Date,
    endDate: Date
): Promise<ITrialBalance> => {
    const startDateUTC: Date = utilitiesService.getUTCDate(startDate);
    const endDateUTC: Date = utilitiesService.getUTCDate(endDate);
    const accountsTurnovers: IAccountTurnover[] = await Promise.all([
        getAccountsTurnovers(financialUnitId, 'debit', startDateUTC, endDateUTC),
        getAccountsTurnovers(financialUnitId, 'credit', startDateUTC, endDateUTC)
    ]).then(([debitTurnovers, creditTurnovers]) => {
        return [...debitTurnovers, ...creditTurnovers];
    }).catch((err) => {
        console.log(err);
        throw new Error('Chyba při načítání obratové předvahy');
    });
    const trialBalanceAccountsMap: Map<string, ITrialBalanceAccount> = new Map<string, ITrialBalanceAccount>();
    let totalDebitAmount: number = 0;
    let totalDebitEntries: number = 0;
    let totalCreditAmount: number = 0;
    let totalCreditEntries: number = 0;
    accountsTurnovers.forEach((accountTurnover) => {
        const accountId: string = accountTurnover.account ? accountTurnover.account._id.toString() : 'null';
        const getNewTrialBalanceAccount = (accountTurnover: IAccountTurnover): ITrialBalanceAccount => {
            return {
                _id: accountTurnover.account ? accountTurnover.account._id.toString() : 'null',
                account: accountTurnover.account,
                debitAmount: 0,
                debitEntriesCount: 0,
                creditAmount: 0,
                creditEntriesCount: 0
            };
        };
        const trialBalanceAccount: ITrialBalanceAccount = trialBalanceAccountsMap.get(accountId) || getNewTrialBalanceAccount(accountTurnover);
        if (accountTurnover.indicator == 'd') {
            trialBalanceAccount.debitAmount += accountTurnover.total;
            trialBalanceAccount.debitEntriesCount += accountTurnover.count
            totalDebitAmount += accountTurnover.total;
            totalDebitEntries += accountTurnover.count;
        } else {
            trialBalanceAccount.creditAmount += accountTurnover.total;
            trialBalanceAccount.creditEntriesCount += accountTurnover.count
            totalCreditAmount += accountTurnover.total;
            totalCreditEntries += accountTurnover.count;
        }
        trialBalanceAccountsMap.set(accountId, trialBalanceAccount);
    });
    const accounts: ITrialBalanceAccount[] = Array.from(trialBalanceAccountsMap.values());
    return {
        financialUnitId,
        startDate,
        endDate,
        totalDebitAmount,
        totalDebitEntries,
        totalCreditAmount,
        totalCreditEntries,
        accounts
    };
}