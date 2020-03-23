import { FinancialTransactionModel } from "../models/financial-transaction.model";
import { mongoose } from "../mongoose-instance";
import { FinancialAccountModel, IFinancialAccount } from "../models/financial-account.model";
import { Schema } from "mongoose";
import { IAccountTurnover, ITrialBalance, ITrialBalanceAccount } from "../models/trial-balance.model";

const getAccountsTurnovers = (financialUnitId: string, type: 'debit' | 'credit'): Promise<IAccountTurnover[]> => {
    return FinancialTransactionModel.aggregate()
        .match({
            financialUnitId: mongoose.Types.ObjectId(financialUnitId)
        })
        .group({
            _id: type == 'debit' ? '$debitAccountId' : '$creditAccountId',
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

export const getTrialBalance = async (financialUnitId: string): Promise<ITrialBalance> => {
    const accountsTurnovers: IAccountTurnover[] = await Promise.all([
        getAccountsTurnovers(financialUnitId, 'debit'),
        getAccountsTurnovers(financialUnitId, 'credit')
    ]).then(([debitTurnovers, creditTurnovers]) => {
        return [...debitTurnovers, ...creditTurnovers];
    }).catch((err) => {
        console.log(err);
        throw new Error('Chyba při načítání obratové předvahy');
    });
    const trialBalanceAccountsMap: Map<string, ITrialBalanceAccount> = new Map<string, ITrialBalanceAccount>();
    accountsTurnovers.forEach((accountTurnover) => {
        const accountId: string = accountTurnover.account ? accountTurnover.account._id.toString() : 'null';
        const getNewTrialBalanceAccount = (accountTurnover: IAccountTurnover): ITrialBalanceAccount => {
            return {
                id: accountTurnover.account ? accountTurnover.account._id.toString() : 'null',
                name: accountTurnover.account ? accountTurnover.account.name : 'null',
                debitAmount: 0,
                creditAmount: 0
            };
        };
        const trialBalanceAccount: ITrialBalanceAccount = trialBalanceAccountsMap.get(accountId) || getNewTrialBalanceAccount(accountTurnover);
        if (accountTurnover.indicator == 'd') {
            trialBalanceAccount.debitAmount += accountTurnover.total;
        } else {
            trialBalanceAccount.creditAmount += accountTurnover.total;
        }
        trialBalanceAccountsMap.set(accountId, trialBalanceAccount);
    });
    const accounts: ITrialBalanceAccount[] = Array.from(trialBalanceAccountsMap.values());
    return { financialUnitId, accounts };
}