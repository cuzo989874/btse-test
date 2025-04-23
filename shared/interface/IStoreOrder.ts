import type TSizeChangeStatus from "../type/TCompareStatus";

export default interface IStoreOrder {
  price: number;
  size: number;
  isNew: boolean;
  sizeCompare: TSizeChangeStatus;
}