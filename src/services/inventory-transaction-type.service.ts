import { InventoryTransactionType } from "../models/inventory-transaction.model";

export const parseInventoryTransactiontType = (typeAsString: string): InventoryTransactionType | null => {
    switch (typeAsString) {
        case InventoryTransactionType.Increment.toString():
            return InventoryTransactionType.Increment;
        case InventoryTransactionType.Decrement.toString():
            return InventoryTransactionType.Decrement;
        default:
            return null;
    }
}