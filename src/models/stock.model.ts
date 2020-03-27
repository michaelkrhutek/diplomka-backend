export enum StockDecrementType {
    FIFO = 'fifo',
    LIFO = 'lifo',
    Average = 'average'
}

export interface IStock {
    totalStockQuantity: number;
    totalStockCost: number;
    batches: IStockBatch[];
}

export interface IStockBatch {
    quantity: number;
    costPerUnit: number;
    added: Date;
    transactionIndex: number;
}

export interface IStockQuantityChangeResult {
    stock: IStock;
    changeCost: number;
}