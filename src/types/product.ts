import { Ecomment } from "./comment";

export interface ProductInfo {
    name: string;
    price: number;
    description: string;
    image: string;
    Sales: number;
    comments:Ecomment[];
}