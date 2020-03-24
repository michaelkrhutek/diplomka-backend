import { IFinancialAccount } from "./financial-account.model";

export interface IAccountTurnover {
    accountId: string;
    account: IFinancialAccount | null;
    indicator: 'd' | 'c';
    count: number;
    total: number;
}

export interface ITrialBalanceAccount {
    id: string;
    name: string;
    debitAmount: number;
    debitEntriesCount: number;
    creditAmount: number;
    creditEntriesCount: number;
}

export interface ITrialBalance {
    financialUnitId: string;
    startDate: Date;
    endDate: Date;
    totalDebitAmount: number;
    totalDebitEntries: number;
    totalCreditAmount: number;
    totalCreditEntries: number;
    accounts: ITrialBalanceAccount[];
}