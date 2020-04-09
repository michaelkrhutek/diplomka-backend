import { InventoryTransactionType } from "./models/inventory-transaction.model";

export interface IDefaultFinancialAccountData {
    code: string;
    name: string;
};

export const defaultAccounts: IDefaultFinancialAccountData[] = [
    { code: '112', name: 'Materiál' },
    { code: '122', name: 'Polotovary' },
    { code: '123', name: 'Výrobky' },
    { code: '132', name: 'Zboží' },
    { code: '321', name: 'Závazky z obchodních vztahů' },
    { code: '501', name: 'Spotřeba materiálu' },
    { code: '504', name: 'Prodané zboží' },
    { code: '542', name: 'Prodaný materiál' },
    { code: '582', name: 'Změna stavu polotovarů' },
    { code: '583', name: 'Změna stavu výrobků' },
    { code: '549', name: 'Manka a škody z provozní činnosti' },
    { code: '648', name: 'Ostatní provozní výnosy' },
];

export interface IDefaultInventoryTransactionTemplateData {
    description: string,
    transactionType: InventoryTransactionType,
    debitAccountCode: string,
    creditAccountCode: string
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