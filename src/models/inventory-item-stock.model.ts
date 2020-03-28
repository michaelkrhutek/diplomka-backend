import { IInventoryItemPopulatedDoc } from "./inventory-item.model";
import { IStock } from "./stock.model";

export interface IInventoryItemStock {
    _id: IInventoryItemPopulatedDoc['_id'];
    inventoryItem: IInventoryItemPopulatedDoc;
    stock: IStock;
}