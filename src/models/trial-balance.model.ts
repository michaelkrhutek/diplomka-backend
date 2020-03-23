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
    creditAmount: number;
}

export interface ITrialBalance {
    financialUnitId: string;
    accounts: ITrialBalanceAccount[];
}