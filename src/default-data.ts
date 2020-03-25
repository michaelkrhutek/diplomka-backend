import { StockDecrementType } from "./models/stock.model";
import { InventoryTransactionType } from "./models/inventory-transaction.model";

export interface IDefaultFinancialAccountData {
    code: string;
    name: string;
};

export const defaultAccounts: IDefaultFinancialAccountData[] = [
    { code: '112', name: 'Material' },
    { code: '122', name: 'Polotovary' },
    { code: '123', name: 'Vyrobky' },
    { code: '132', name: 'Zbozi' },
    { code: '321', name: 'Zavazky z obchodnich vztahu' },
    { code: '501', name: 'Spotreba materialu' },
    { code: '504', name: 'Prodane zbozi' },
    { code: '542', name: 'Prodany material' },
    { code: '582', name: 'Zmena stavu polotovaru' },
    { code: '583', name: 'Zmena stavu vyrobku' },
    { code: '549', name: 'Manka a skody z provozni cinnosti' },
    { code: '648', name: 'Ostatni provozni vynosy' },
];

export interface IDefaultInventoryTransactionTemplateData {
    description: string,
    transactionType: InventoryTransactionType,
    debitAccountCode: string,
    creditAccountCode: string
}

export interface IDefaultInventoryGroupData {
    name: string;
    defaultStockDecrementType: StockDecrementType;
    inventoryTransactionTemplates: IDefaultInventoryTransactionTemplateData[];
}

export const defaultInventoryGroups: IDefaultInventoryGroupData[] = [
    {
        name: 'Material',
        defaultStockDecrementType: StockDecrementType.FIFO,
        inventoryTransactionTemplates: [
            {
                description: 'Naskladneni materialu',
                transactionType: InventoryTransactionType.Increment,
                debitAccountCode: '112',
                creditAccountCode: '321'
            },
            {
                description: 'Spotreba materialu',
                transactionType: InventoryTransactionType.Decrement,
                debitAccountCode: '501',
                creditAccountCode: '112'
            },
            {
                description: 'Inventurni prebytek',
                transactionType: InventoryTransactionType.Increment,
                debitAccountCode: '112',
                creditAccountCode: '648'
            },
            {
                description: 'Inventurni manko',
                transactionType: InventoryTransactionType.Decrement,
                debitAccountCode: '549',
                creditAccountCode: '112'
            }
        ]
    },
    {
        name: 'Polotovary',
        defaultStockDecrementType: StockDecrementType.FIFO,
        inventoryTransactionTemplates: [
            {
                description: 'Naskladneni polotovaru',
                transactionType: InventoryTransactionType.Increment,
                debitAccountCode: '122',
                creditAccountCode: '582'
            },
            {
                description: 'Vyskladneni polotovaru',
                transactionType: InventoryTransactionType.Decrement,
                debitAccountCode: '122',
                creditAccountCode: '582'
            },
            {
                description: 'Inventurni prebytek',
                transactionType: InventoryTransactionType.Increment,
                debitAccountCode: '122',
                creditAccountCode: '648'
            },
            {
                description: 'Inventurni manko',
                transactionType: InventoryTransactionType.Decrement,
                debitAccountCode: '549',
                creditAccountCode: '122'
            }
        ]
    },
    {
        name: 'Vyrobky',
        defaultStockDecrementType: StockDecrementType.FIFO,
        inventoryTransactionTemplates: [
            {
                description: 'Naskladneni vyrobku',
                transactionType: InventoryTransactionType.Increment,
                debitAccountCode: '123',
                creditAccountCode: '583'
            },
            {
                description: 'Vyskladneni vyrobku',
                transactionType: InventoryTransactionType.Decrement,
                debitAccountCode: '123',
                creditAccountCode: '583'
            },
            {
                description: 'Inventurni prebytek',
                transactionType: InventoryTransactionType.Increment,
                debitAccountCode: '123',
                creditAccountCode: '648'
            },
            {
                description: 'Inventurni manko',
                transactionType: InventoryTransactionType.Decrement,
                debitAccountCode: '549',
                creditAccountCode: '123'
            }
        ]
    },
    {
        name: 'Zbozi',
        defaultStockDecrementType: StockDecrementType.FIFO,
        inventoryTransactionTemplates: [
            {
                description: 'Naskladneni materialu',
                transactionType: InventoryTransactionType.Increment,
                debitAccountCode: '132',
                creditAccountCode: '321'
            },
            {
                description: 'Spotreba materialu',
                transactionType: InventoryTransactionType.Decrement,
                debitAccountCode: '504',
                creditAccountCode: '132'
            },
            {
                description: 'Inventurni prebytek',
                transactionType: InventoryTransactionType.Increment,
                debitAccountCode: '132',
                creditAccountCode: '648'
            },
            {
                description: 'Inventurni manko',
                transactionType: InventoryTransactionType.Decrement,
                debitAccountCode: '549',
                creditAccountCode: '132'
            }
        ]
    }
];