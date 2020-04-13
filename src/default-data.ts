import { InventoryTransactionType } from "./models/inventory-transaction.model";
import { FinancialAccountType } from "./models/financial-account.model";

export interface IDefaultFinancialAccountData {
    code: string;
    name: string;
    type: FinancialAccountType;
};

export const defaultAccounts: IDefaultFinancialAccountData[] = [
    { code: '112', name: 'Materiál', type: FinancialAccountType.Assets },
    { code: '122', name: 'Polotovary', type: FinancialAccountType.Assets },
    { code: '123', name: 'Výrobky', type: FinancialAccountType.Assets },
    { code: '132', name: 'Zboží', type: FinancialAccountType.Assets },
    { code: '311', name: 'Pohledávky z obchodních vztahů', type: FinancialAccountType.Liabilities },
    { code: '321', name: 'Závazky z obchodních vztahů', type: FinancialAccountType.Liabilities },
    { code: '501', name: 'Spotřeba materiálu', type: FinancialAccountType.Expenses },
    { code: '504', name: 'Prodané zboží', type: FinancialAccountType.Expenses },
    { code: '542', name: 'Prodaný materiál', type: FinancialAccountType.Expenses },
    { code: '582', name: 'Změna stavu polotovarů', type: FinancialAccountType.Expenses },
    { code: '583', name: 'Změna stavu výrobků', type: FinancialAccountType.Expenses },
    { code: '549', name: 'Manka a škody z provozní činnosti', type: FinancialAccountType.Expenses },
    { code: '601', name: 'Tržby za výrobky', type: FinancialAccountType.Revenues },
    { code: '604', name: 'Tržby za zboží', type: FinancialAccountType.Revenues },
    { code: '642', name: 'Tržby z prodeje materiálu', type: FinancialAccountType.Revenues },
    { code: '648', name: 'Ostatní provozní výnosy', type: FinancialAccountType.Revenues },
];

export interface IDefaultInventoryTransactionTemplateData {
    description: string,
    transactionType: InventoryTransactionType,
    debitAccountCode: string,
    creditAccountCode: string,
    saleDebitAccountCode?: string,
    saleCreditAccountCode?: string
}

export interface IDefaultInventoryGroupData {
    name: string;
    inventoryTransactionTemplates: IDefaultInventoryTransactionTemplateData[];
}

export const defaultInventoryGroups: IDefaultInventoryGroupData[] = [
    {
        name: 'Materiál',
        inventoryTransactionTemplates: [
            {
                description: 'Naskladnění materiálu',
                transactionType: InventoryTransactionType.Increment,
                debitAccountCode: '112',
                creditAccountCode: '321'
            },
            {
                description: 'Spotřeba materiálu',
                transactionType: InventoryTransactionType.Decrement,
                debitAccountCode: '501',
                creditAccountCode: '112'
            },
            {
                description: 'Prodej materiálu',
                transactionType: InventoryTransactionType.Sale,
                debitAccountCode: '542',
                creditAccountCode: '112',
                saleDebitAccountCode: '311',
                saleCreditAccountCode: '642'
            },
            {
                description: 'Inventurní přebytek',
                transactionType: InventoryTransactionType.Increment,
                debitAccountCode: '112',
                creditAccountCode: '648'
            },
            {
                description: 'Inventurní manko',
                transactionType: InventoryTransactionType.Decrement,
                debitAccountCode: '549',
                creditAccountCode: '112'
            }
        ]
    },
    {
        name: 'Polotovary',
        inventoryTransactionTemplates: [
            {
                description: 'Naskladnění polotovarů',
                transactionType: InventoryTransactionType.Increment,
                debitAccountCode: '122',
                creditAccountCode: '582'
            },
            {
                description: 'Vyskladnění polotovarů',
                transactionType: InventoryTransactionType.Decrement,
                debitAccountCode: '122',
                creditAccountCode: '582'
            },
            {
                description: 'Prodej polotovarů',
                transactionType: InventoryTransactionType.Sale,
                debitAccountCode: '582',
                creditAccountCode: '122',
                saleDebitAccountCode: '311',
                saleCreditAccountCode: '601'
            },
            {
                description: 'Inventurní přebytek',
                transactionType: InventoryTransactionType.Increment,
                debitAccountCode: '122',
                creditAccountCode: '648'
            },
            {
                description: 'Inventurní manko',
                transactionType: InventoryTransactionType.Decrement,
                debitAccountCode: '549',
                creditAccountCode: '122'
            }
        ]
    },
    {
        name: 'Výrobky',
        inventoryTransactionTemplates: [
            {
                description: 'Naskladnění výrobků',
                transactionType: InventoryTransactionType.Increment,
                debitAccountCode: '123',
                creditAccountCode: '583'
            },
            {
                description: 'Vyskladnění výrobků',
                transactionType: InventoryTransactionType.Decrement,
                debitAccountCode: '123',
                creditAccountCode: '583'
            },
            {
                description: 'Prodej výrobků',
                transactionType: InventoryTransactionType.Sale,
                debitAccountCode: '583',
                creditAccountCode: '123',
                saleDebitAccountCode: '311',
                saleCreditAccountCode: '601'
            },
            {
                description: 'Inventurní přebytek',
                transactionType: InventoryTransactionType.Increment,
                debitAccountCode: '123',
                creditAccountCode: '648'
            },
            {
                description: 'Inventurní manko',
                transactionType: InventoryTransactionType.Decrement,
                debitAccountCode: '549',
                creditAccountCode: '123'
            }
        ]
    },
    {
        name: 'Zboží',
        inventoryTransactionTemplates: [
            {
                description: 'Naskladnění zboží',
                transactionType: InventoryTransactionType.Increment,
                debitAccountCode: '132',
                creditAccountCode: '321'
            },
            {
                description: 'Vyskladnění zboží',
                transactionType: InventoryTransactionType.Decrement,
                debitAccountCode: '504',
                creditAccountCode: '132'
            },
            {
                description: 'Prodej zboží',
                transactionType: InventoryTransactionType.Sale,
                debitAccountCode: '504',
                creditAccountCode: '132',
                saleDebitAccountCode: '311',
                saleCreditAccountCode: '604'
            },
            {
                description: 'Inventurní přebytek',
                transactionType: InventoryTransactionType.Increment,
                debitAccountCode: '132',
                creditAccountCode: '648'
            },
            {
                description: 'Inventurní manko',
                transactionType: InventoryTransactionType.Decrement,
                debitAccountCode: '549',
                creditAccountCode: '132'
            }
        ]
    }
];