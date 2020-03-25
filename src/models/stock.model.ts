export enum StockDecrementType {
    FIFO = 'fifo',
    LIFO = 'lifo',
    Average = 'average'
}

export interface IStockBatch {
    quantity: number;
    costPerUnit: number;
    added: Date;
    transactionIndex: number;
}

export interface IStockQuantityChangeResult {
    stock: IStockBatch[];
    changeCost: number;
}