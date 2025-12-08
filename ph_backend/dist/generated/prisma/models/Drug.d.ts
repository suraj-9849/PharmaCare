import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model Drug
 *
 */
export type DrugModel = runtime.Types.Result.DefaultSelection<Prisma.$DrugPayload>;
export type AggregateDrug = {
    _count: DrugCountAggregateOutputType | null;
    _avg: DrugAvgAggregateOutputType | null;
    _sum: DrugSumAggregateOutputType | null;
    _min: DrugMinAggregateOutputType | null;
    _max: DrugMaxAggregateOutputType | null;
};
export type DrugAvgAggregateOutputType = {
    reorderLevel: number | null;
};
export type DrugSumAggregateOutputType = {
    reorderLevel: number | null;
};
export type DrugMinAggregateOutputType = {
    id: string | null;
    brandName: string | null;
    genericName: string | null;
    category: string | null;
    manufacturer: string | null;
    requiresPrescription: boolean | null;
    reorderLevel: number | null;
    sku: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type DrugMaxAggregateOutputType = {
    id: string | null;
    brandName: string | null;
    genericName: string | null;
    category: string | null;
    manufacturer: string | null;
    requiresPrescription: boolean | null;
    reorderLevel: number | null;
    sku: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type DrugCountAggregateOutputType = {
    id: number;
    brandName: number;
    genericName: number;
    category: number;
    manufacturer: number;
    requiresPrescription: number;
    reorderLevel: number;
    sku: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type DrugAvgAggregateInputType = {
    reorderLevel?: true;
};
export type DrugSumAggregateInputType = {
    reorderLevel?: true;
};
export type DrugMinAggregateInputType = {
    id?: true;
    brandName?: true;
    genericName?: true;
    category?: true;
    manufacturer?: true;
    requiresPrescription?: true;
    reorderLevel?: true;
    sku?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type DrugMaxAggregateInputType = {
    id?: true;
    brandName?: true;
    genericName?: true;
    category?: true;
    manufacturer?: true;
    requiresPrescription?: true;
    reorderLevel?: true;
    sku?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type DrugCountAggregateInputType = {
    id?: true;
    brandName?: true;
    genericName?: true;
    category?: true;
    manufacturer?: true;
    requiresPrescription?: true;
    reorderLevel?: true;
    sku?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type DrugAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Drug to aggregate.
     */
    where?: Prisma.DrugWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Drugs to fetch.
     */
    orderBy?: Prisma.DrugOrderByWithRelationInput | Prisma.DrugOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.DrugWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Drugs from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Drugs.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Drugs
    **/
    _count?: true | DrugCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: DrugAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: DrugSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: DrugMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: DrugMaxAggregateInputType;
};
export type GetDrugAggregateType<T extends DrugAggregateArgs> = {
    [P in keyof T & keyof AggregateDrug]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateDrug[P]> : Prisma.GetScalarType<T[P], AggregateDrug[P]>;
};
export type DrugGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DrugWhereInput;
    orderBy?: Prisma.DrugOrderByWithAggregationInput | Prisma.DrugOrderByWithAggregationInput[];
    by: Prisma.DrugScalarFieldEnum[] | Prisma.DrugScalarFieldEnum;
    having?: Prisma.DrugScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: DrugCountAggregateInputType | true;
    _avg?: DrugAvgAggregateInputType;
    _sum?: DrugSumAggregateInputType;
    _min?: DrugMinAggregateInputType;
    _max?: DrugMaxAggregateInputType;
};
export type DrugGroupByOutputType = {
    id: string;
    brandName: string;
    genericName: string;
    category: string;
    manufacturer: string;
    requiresPrescription: boolean;
    reorderLevel: number;
    sku: string;
    createdAt: Date;
    updatedAt: Date;
    _count: DrugCountAggregateOutputType | null;
    _avg: DrugAvgAggregateOutputType | null;
    _sum: DrugSumAggregateOutputType | null;
    _min: DrugMinAggregateOutputType | null;
    _max: DrugMaxAggregateOutputType | null;
};
type GetDrugGroupByPayload<T extends DrugGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<DrugGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof DrugGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], DrugGroupByOutputType[P]> : Prisma.GetScalarType<T[P], DrugGroupByOutputType[P]>;
}>>;
export type DrugWhereInput = {
    AND?: Prisma.DrugWhereInput | Prisma.DrugWhereInput[];
    OR?: Prisma.DrugWhereInput[];
    NOT?: Prisma.DrugWhereInput | Prisma.DrugWhereInput[];
    id?: Prisma.StringFilter<"Drug"> | string;
    brandName?: Prisma.StringFilter<"Drug"> | string;
    genericName?: Prisma.StringFilter<"Drug"> | string;
    category?: Prisma.StringFilter<"Drug"> | string;
    manufacturer?: Prisma.StringFilter<"Drug"> | string;
    requiresPrescription?: Prisma.BoolFilter<"Drug"> | boolean;
    reorderLevel?: Prisma.IntFilter<"Drug"> | number;
    sku?: Prisma.StringFilter<"Drug"> | string;
    createdAt?: Prisma.DateTimeFilter<"Drug"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Drug"> | Date | string;
    inventoryBatches?: Prisma.InventoryBatchListRelationFilter;
    saleItems?: Prisma.SaleItemListRelationFilter;
};
export type DrugOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    brandName?: Prisma.SortOrder;
    genericName?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    manufacturer?: Prisma.SortOrder;
    requiresPrescription?: Prisma.SortOrder;
    reorderLevel?: Prisma.SortOrder;
    sku?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    inventoryBatches?: Prisma.InventoryBatchOrderByRelationAggregateInput;
    saleItems?: Prisma.SaleItemOrderByRelationAggregateInput;
};
export type DrugWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    sku?: string;
    AND?: Prisma.DrugWhereInput | Prisma.DrugWhereInput[];
    OR?: Prisma.DrugWhereInput[];
    NOT?: Prisma.DrugWhereInput | Prisma.DrugWhereInput[];
    brandName?: Prisma.StringFilter<"Drug"> | string;
    genericName?: Prisma.StringFilter<"Drug"> | string;
    category?: Prisma.StringFilter<"Drug"> | string;
    manufacturer?: Prisma.StringFilter<"Drug"> | string;
    requiresPrescription?: Prisma.BoolFilter<"Drug"> | boolean;
    reorderLevel?: Prisma.IntFilter<"Drug"> | number;
    createdAt?: Prisma.DateTimeFilter<"Drug"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Drug"> | Date | string;
    inventoryBatches?: Prisma.InventoryBatchListRelationFilter;
    saleItems?: Prisma.SaleItemListRelationFilter;
}, "id" | "sku">;
export type DrugOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    brandName?: Prisma.SortOrder;
    genericName?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    manufacturer?: Prisma.SortOrder;
    requiresPrescription?: Prisma.SortOrder;
    reorderLevel?: Prisma.SortOrder;
    sku?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.DrugCountOrderByAggregateInput;
    _avg?: Prisma.DrugAvgOrderByAggregateInput;
    _max?: Prisma.DrugMaxOrderByAggregateInput;
    _min?: Prisma.DrugMinOrderByAggregateInput;
    _sum?: Prisma.DrugSumOrderByAggregateInput;
};
export type DrugScalarWhereWithAggregatesInput = {
    AND?: Prisma.DrugScalarWhereWithAggregatesInput | Prisma.DrugScalarWhereWithAggregatesInput[];
    OR?: Prisma.DrugScalarWhereWithAggregatesInput[];
    NOT?: Prisma.DrugScalarWhereWithAggregatesInput | Prisma.DrugScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Drug"> | string;
    brandName?: Prisma.StringWithAggregatesFilter<"Drug"> | string;
    genericName?: Prisma.StringWithAggregatesFilter<"Drug"> | string;
    category?: Prisma.StringWithAggregatesFilter<"Drug"> | string;
    manufacturer?: Prisma.StringWithAggregatesFilter<"Drug"> | string;
    requiresPrescription?: Prisma.BoolWithAggregatesFilter<"Drug"> | boolean;
    reorderLevel?: Prisma.IntWithAggregatesFilter<"Drug"> | number;
    sku?: Prisma.StringWithAggregatesFilter<"Drug"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Drug"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Drug"> | Date | string;
};
export type DrugCreateInput = {
    id?: string;
    brandName: string;
    genericName: string;
    category: string;
    manufacturer: string;
    requiresPrescription?: boolean;
    reorderLevel?: number;
    sku: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    inventoryBatches?: Prisma.InventoryBatchCreateNestedManyWithoutDrugInput;
    saleItems?: Prisma.SaleItemCreateNestedManyWithoutDrugInput;
};
export type DrugUncheckedCreateInput = {
    id?: string;
    brandName: string;
    genericName: string;
    category: string;
    manufacturer: string;
    requiresPrescription?: boolean;
    reorderLevel?: number;
    sku: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    inventoryBatches?: Prisma.InventoryBatchUncheckedCreateNestedManyWithoutDrugInput;
    saleItems?: Prisma.SaleItemUncheckedCreateNestedManyWithoutDrugInput;
};
export type DrugUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    brandName?: Prisma.StringFieldUpdateOperationsInput | string;
    genericName?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    manufacturer?: Prisma.StringFieldUpdateOperationsInput | string;
    requiresPrescription?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    reorderLevel?: Prisma.IntFieldUpdateOperationsInput | number;
    sku?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    inventoryBatches?: Prisma.InventoryBatchUpdateManyWithoutDrugNestedInput;
    saleItems?: Prisma.SaleItemUpdateManyWithoutDrugNestedInput;
};
export type DrugUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    brandName?: Prisma.StringFieldUpdateOperationsInput | string;
    genericName?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    manufacturer?: Prisma.StringFieldUpdateOperationsInput | string;
    requiresPrescription?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    reorderLevel?: Prisma.IntFieldUpdateOperationsInput | number;
    sku?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    inventoryBatches?: Prisma.InventoryBatchUncheckedUpdateManyWithoutDrugNestedInput;
    saleItems?: Prisma.SaleItemUncheckedUpdateManyWithoutDrugNestedInput;
};
export type DrugCreateManyInput = {
    id?: string;
    brandName: string;
    genericName: string;
    category: string;
    manufacturer: string;
    requiresPrescription?: boolean;
    reorderLevel?: number;
    sku: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type DrugUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    brandName?: Prisma.StringFieldUpdateOperationsInput | string;
    genericName?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    manufacturer?: Prisma.StringFieldUpdateOperationsInput | string;
    requiresPrescription?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    reorderLevel?: Prisma.IntFieldUpdateOperationsInput | number;
    sku?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DrugUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    brandName?: Prisma.StringFieldUpdateOperationsInput | string;
    genericName?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    manufacturer?: Prisma.StringFieldUpdateOperationsInput | string;
    requiresPrescription?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    reorderLevel?: Prisma.IntFieldUpdateOperationsInput | number;
    sku?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DrugCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    brandName?: Prisma.SortOrder;
    genericName?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    manufacturer?: Prisma.SortOrder;
    requiresPrescription?: Prisma.SortOrder;
    reorderLevel?: Prisma.SortOrder;
    sku?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type DrugAvgOrderByAggregateInput = {
    reorderLevel?: Prisma.SortOrder;
};
export type DrugMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    brandName?: Prisma.SortOrder;
    genericName?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    manufacturer?: Prisma.SortOrder;
    requiresPrescription?: Prisma.SortOrder;
    reorderLevel?: Prisma.SortOrder;
    sku?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type DrugMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    brandName?: Prisma.SortOrder;
    genericName?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    manufacturer?: Prisma.SortOrder;
    requiresPrescription?: Prisma.SortOrder;
    reorderLevel?: Prisma.SortOrder;
    sku?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type DrugSumOrderByAggregateInput = {
    reorderLevel?: Prisma.SortOrder;
};
export type DrugScalarRelationFilter = {
    is?: Prisma.DrugWhereInput;
    isNot?: Prisma.DrugWhereInput;
};
export type BoolFieldUpdateOperationsInput = {
    set?: boolean;
};
export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type DrugCreateNestedOneWithoutInventoryBatchesInput = {
    create?: Prisma.XOR<Prisma.DrugCreateWithoutInventoryBatchesInput, Prisma.DrugUncheckedCreateWithoutInventoryBatchesInput>;
    connectOrCreate?: Prisma.DrugCreateOrConnectWithoutInventoryBatchesInput;
    connect?: Prisma.DrugWhereUniqueInput;
};
export type DrugUpdateOneRequiredWithoutInventoryBatchesNestedInput = {
    create?: Prisma.XOR<Prisma.DrugCreateWithoutInventoryBatchesInput, Prisma.DrugUncheckedCreateWithoutInventoryBatchesInput>;
    connectOrCreate?: Prisma.DrugCreateOrConnectWithoutInventoryBatchesInput;
    upsert?: Prisma.DrugUpsertWithoutInventoryBatchesInput;
    connect?: Prisma.DrugWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.DrugUpdateToOneWithWhereWithoutInventoryBatchesInput, Prisma.DrugUpdateWithoutInventoryBatchesInput>, Prisma.DrugUncheckedUpdateWithoutInventoryBatchesInput>;
};
export type DrugCreateNestedOneWithoutSaleItemsInput = {
    create?: Prisma.XOR<Prisma.DrugCreateWithoutSaleItemsInput, Prisma.DrugUncheckedCreateWithoutSaleItemsInput>;
    connectOrCreate?: Prisma.DrugCreateOrConnectWithoutSaleItemsInput;
    connect?: Prisma.DrugWhereUniqueInput;
};
export type DrugUpdateOneRequiredWithoutSaleItemsNestedInput = {
    create?: Prisma.XOR<Prisma.DrugCreateWithoutSaleItemsInput, Prisma.DrugUncheckedCreateWithoutSaleItemsInput>;
    connectOrCreate?: Prisma.DrugCreateOrConnectWithoutSaleItemsInput;
    upsert?: Prisma.DrugUpsertWithoutSaleItemsInput;
    connect?: Prisma.DrugWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.DrugUpdateToOneWithWhereWithoutSaleItemsInput, Prisma.DrugUpdateWithoutSaleItemsInput>, Prisma.DrugUncheckedUpdateWithoutSaleItemsInput>;
};
export type DrugCreateWithoutInventoryBatchesInput = {
    id?: string;
    brandName: string;
    genericName: string;
    category: string;
    manufacturer: string;
    requiresPrescription?: boolean;
    reorderLevel?: number;
    sku: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    saleItems?: Prisma.SaleItemCreateNestedManyWithoutDrugInput;
};
export type DrugUncheckedCreateWithoutInventoryBatchesInput = {
    id?: string;
    brandName: string;
    genericName: string;
    category: string;
    manufacturer: string;
    requiresPrescription?: boolean;
    reorderLevel?: number;
    sku: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    saleItems?: Prisma.SaleItemUncheckedCreateNestedManyWithoutDrugInput;
};
export type DrugCreateOrConnectWithoutInventoryBatchesInput = {
    where: Prisma.DrugWhereUniqueInput;
    create: Prisma.XOR<Prisma.DrugCreateWithoutInventoryBatchesInput, Prisma.DrugUncheckedCreateWithoutInventoryBatchesInput>;
};
export type DrugUpsertWithoutInventoryBatchesInput = {
    update: Prisma.XOR<Prisma.DrugUpdateWithoutInventoryBatchesInput, Prisma.DrugUncheckedUpdateWithoutInventoryBatchesInput>;
    create: Prisma.XOR<Prisma.DrugCreateWithoutInventoryBatchesInput, Prisma.DrugUncheckedCreateWithoutInventoryBatchesInput>;
    where?: Prisma.DrugWhereInput;
};
export type DrugUpdateToOneWithWhereWithoutInventoryBatchesInput = {
    where?: Prisma.DrugWhereInput;
    data: Prisma.XOR<Prisma.DrugUpdateWithoutInventoryBatchesInput, Prisma.DrugUncheckedUpdateWithoutInventoryBatchesInput>;
};
export type DrugUpdateWithoutInventoryBatchesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    brandName?: Prisma.StringFieldUpdateOperationsInput | string;
    genericName?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    manufacturer?: Prisma.StringFieldUpdateOperationsInput | string;
    requiresPrescription?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    reorderLevel?: Prisma.IntFieldUpdateOperationsInput | number;
    sku?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    saleItems?: Prisma.SaleItemUpdateManyWithoutDrugNestedInput;
};
export type DrugUncheckedUpdateWithoutInventoryBatchesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    brandName?: Prisma.StringFieldUpdateOperationsInput | string;
    genericName?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    manufacturer?: Prisma.StringFieldUpdateOperationsInput | string;
    requiresPrescription?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    reorderLevel?: Prisma.IntFieldUpdateOperationsInput | number;
    sku?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    saleItems?: Prisma.SaleItemUncheckedUpdateManyWithoutDrugNestedInput;
};
export type DrugCreateWithoutSaleItemsInput = {
    id?: string;
    brandName: string;
    genericName: string;
    category: string;
    manufacturer: string;
    requiresPrescription?: boolean;
    reorderLevel?: number;
    sku: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    inventoryBatches?: Prisma.InventoryBatchCreateNestedManyWithoutDrugInput;
};
export type DrugUncheckedCreateWithoutSaleItemsInput = {
    id?: string;
    brandName: string;
    genericName: string;
    category: string;
    manufacturer: string;
    requiresPrescription?: boolean;
    reorderLevel?: number;
    sku: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    inventoryBatches?: Prisma.InventoryBatchUncheckedCreateNestedManyWithoutDrugInput;
};
export type DrugCreateOrConnectWithoutSaleItemsInput = {
    where: Prisma.DrugWhereUniqueInput;
    create: Prisma.XOR<Prisma.DrugCreateWithoutSaleItemsInput, Prisma.DrugUncheckedCreateWithoutSaleItemsInput>;
};
export type DrugUpsertWithoutSaleItemsInput = {
    update: Prisma.XOR<Prisma.DrugUpdateWithoutSaleItemsInput, Prisma.DrugUncheckedUpdateWithoutSaleItemsInput>;
    create: Prisma.XOR<Prisma.DrugCreateWithoutSaleItemsInput, Prisma.DrugUncheckedCreateWithoutSaleItemsInput>;
    where?: Prisma.DrugWhereInput;
};
export type DrugUpdateToOneWithWhereWithoutSaleItemsInput = {
    where?: Prisma.DrugWhereInput;
    data: Prisma.XOR<Prisma.DrugUpdateWithoutSaleItemsInput, Prisma.DrugUncheckedUpdateWithoutSaleItemsInput>;
};
export type DrugUpdateWithoutSaleItemsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    brandName?: Prisma.StringFieldUpdateOperationsInput | string;
    genericName?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    manufacturer?: Prisma.StringFieldUpdateOperationsInput | string;
    requiresPrescription?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    reorderLevel?: Prisma.IntFieldUpdateOperationsInput | number;
    sku?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    inventoryBatches?: Prisma.InventoryBatchUpdateManyWithoutDrugNestedInput;
};
export type DrugUncheckedUpdateWithoutSaleItemsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    brandName?: Prisma.StringFieldUpdateOperationsInput | string;
    genericName?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    manufacturer?: Prisma.StringFieldUpdateOperationsInput | string;
    requiresPrescription?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    reorderLevel?: Prisma.IntFieldUpdateOperationsInput | number;
    sku?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    inventoryBatches?: Prisma.InventoryBatchUncheckedUpdateManyWithoutDrugNestedInput;
};
/**
 * Count Type DrugCountOutputType
 */
export type DrugCountOutputType = {
    inventoryBatches: number;
    saleItems: number;
};
export type DrugCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    inventoryBatches?: boolean | DrugCountOutputTypeCountInventoryBatchesArgs;
    saleItems?: boolean | DrugCountOutputTypeCountSaleItemsArgs;
};
/**
 * DrugCountOutputType without action
 */
export type DrugCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DrugCountOutputType
     */
    select?: Prisma.DrugCountOutputTypeSelect<ExtArgs> | null;
};
/**
 * DrugCountOutputType without action
 */
export type DrugCountOutputTypeCountInventoryBatchesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.InventoryBatchWhereInput;
};
/**
 * DrugCountOutputType without action
 */
export type DrugCountOutputTypeCountSaleItemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SaleItemWhereInput;
};
export type DrugSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    brandName?: boolean;
    genericName?: boolean;
    category?: boolean;
    manufacturer?: boolean;
    requiresPrescription?: boolean;
    reorderLevel?: boolean;
    sku?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    inventoryBatches?: boolean | Prisma.Drug$inventoryBatchesArgs<ExtArgs>;
    saleItems?: boolean | Prisma.Drug$saleItemsArgs<ExtArgs>;
    _count?: boolean | Prisma.DrugCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["drug"]>;
export type DrugSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    brandName?: boolean;
    genericName?: boolean;
    category?: boolean;
    manufacturer?: boolean;
    requiresPrescription?: boolean;
    reorderLevel?: boolean;
    sku?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["drug"]>;
export type DrugSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    brandName?: boolean;
    genericName?: boolean;
    category?: boolean;
    manufacturer?: boolean;
    requiresPrescription?: boolean;
    reorderLevel?: boolean;
    sku?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["drug"]>;
export type DrugSelectScalar = {
    id?: boolean;
    brandName?: boolean;
    genericName?: boolean;
    category?: boolean;
    manufacturer?: boolean;
    requiresPrescription?: boolean;
    reorderLevel?: boolean;
    sku?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type DrugOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "brandName" | "genericName" | "category" | "manufacturer" | "requiresPrescription" | "reorderLevel" | "sku" | "createdAt" | "updatedAt", ExtArgs["result"]["drug"]>;
export type DrugInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    inventoryBatches?: boolean | Prisma.Drug$inventoryBatchesArgs<ExtArgs>;
    saleItems?: boolean | Prisma.Drug$saleItemsArgs<ExtArgs>;
    _count?: boolean | Prisma.DrugCountOutputTypeDefaultArgs<ExtArgs>;
};
export type DrugIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type DrugIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $DrugPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Drug";
    objects: {
        inventoryBatches: Prisma.$InventoryBatchPayload<ExtArgs>[];
        saleItems: Prisma.$SaleItemPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        brandName: string;
        genericName: string;
        category: string;
        manufacturer: string;
        requiresPrescription: boolean;
        reorderLevel: number;
        sku: string;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["drug"]>;
    composites: {};
};
export type DrugGetPayload<S extends boolean | null | undefined | DrugDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$DrugPayload, S>;
export type DrugCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<DrugFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: DrugCountAggregateInputType | true;
};
export interface DrugDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Drug'];
        meta: {
            name: 'Drug';
        };
    };
    /**
     * Find zero or one Drug that matches the filter.
     * @param {DrugFindUniqueArgs} args - Arguments to find a Drug
     * @example
     * // Get one Drug
     * const drug = await prisma.drug.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DrugFindUniqueArgs>(args: Prisma.SelectSubset<T, DrugFindUniqueArgs<ExtArgs>>): Prisma.Prisma__DrugClient<runtime.Types.Result.GetResult<Prisma.$DrugPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one Drug that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DrugFindUniqueOrThrowArgs} args - Arguments to find a Drug
     * @example
     * // Get one Drug
     * const drug = await prisma.drug.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DrugFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, DrugFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__DrugClient<runtime.Types.Result.GetResult<Prisma.$DrugPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Drug that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DrugFindFirstArgs} args - Arguments to find a Drug
     * @example
     * // Get one Drug
     * const drug = await prisma.drug.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DrugFindFirstArgs>(args?: Prisma.SelectSubset<T, DrugFindFirstArgs<ExtArgs>>): Prisma.Prisma__DrugClient<runtime.Types.Result.GetResult<Prisma.$DrugPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Drug that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DrugFindFirstOrThrowArgs} args - Arguments to find a Drug
     * @example
     * // Get one Drug
     * const drug = await prisma.drug.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DrugFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, DrugFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__DrugClient<runtime.Types.Result.GetResult<Prisma.$DrugPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more Drugs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DrugFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Drugs
     * const drugs = await prisma.drug.findMany()
     *
     * // Get first 10 Drugs
     * const drugs = await prisma.drug.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const drugWithIdOnly = await prisma.drug.findMany({ select: { id: true } })
     *
     */
    findMany<T extends DrugFindManyArgs>(args?: Prisma.SelectSubset<T, DrugFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DrugPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a Drug.
     * @param {DrugCreateArgs} args - Arguments to create a Drug.
     * @example
     * // Create one Drug
     * const Drug = await prisma.drug.create({
     *   data: {
     *     // ... data to create a Drug
     *   }
     * })
     *
     */
    create<T extends DrugCreateArgs>(args: Prisma.SelectSubset<T, DrugCreateArgs<ExtArgs>>): Prisma.Prisma__DrugClient<runtime.Types.Result.GetResult<Prisma.$DrugPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many Drugs.
     * @param {DrugCreateManyArgs} args - Arguments to create many Drugs.
     * @example
     * // Create many Drugs
     * const drug = await prisma.drug.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends DrugCreateManyArgs>(args?: Prisma.SelectSubset<T, DrugCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many Drugs and returns the data saved in the database.
     * @param {DrugCreateManyAndReturnArgs} args - Arguments to create many Drugs.
     * @example
     * // Create many Drugs
     * const drug = await prisma.drug.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Drugs and only return the `id`
     * const drugWithIdOnly = await prisma.drug.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends DrugCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, DrugCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DrugPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a Drug.
     * @param {DrugDeleteArgs} args - Arguments to delete one Drug.
     * @example
     * // Delete one Drug
     * const Drug = await prisma.drug.delete({
     *   where: {
     *     // ... filter to delete one Drug
     *   }
     * })
     *
     */
    delete<T extends DrugDeleteArgs>(args: Prisma.SelectSubset<T, DrugDeleteArgs<ExtArgs>>): Prisma.Prisma__DrugClient<runtime.Types.Result.GetResult<Prisma.$DrugPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one Drug.
     * @param {DrugUpdateArgs} args - Arguments to update one Drug.
     * @example
     * // Update one Drug
     * const drug = await prisma.drug.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends DrugUpdateArgs>(args: Prisma.SelectSubset<T, DrugUpdateArgs<ExtArgs>>): Prisma.Prisma__DrugClient<runtime.Types.Result.GetResult<Prisma.$DrugPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more Drugs.
     * @param {DrugDeleteManyArgs} args - Arguments to filter Drugs to delete.
     * @example
     * // Delete a few Drugs
     * const { count } = await prisma.drug.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends DrugDeleteManyArgs>(args?: Prisma.SelectSubset<T, DrugDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Drugs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DrugUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Drugs
     * const drug = await prisma.drug.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends DrugUpdateManyArgs>(args: Prisma.SelectSubset<T, DrugUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Drugs and returns the data updated in the database.
     * @param {DrugUpdateManyAndReturnArgs} args - Arguments to update many Drugs.
     * @example
     * // Update many Drugs
     * const drug = await prisma.drug.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Drugs and only return the `id`
     * const drugWithIdOnly = await prisma.drug.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends DrugUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, DrugUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DrugPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one Drug.
     * @param {DrugUpsertArgs} args - Arguments to update or create a Drug.
     * @example
     * // Update or create a Drug
     * const drug = await prisma.drug.upsert({
     *   create: {
     *     // ... data to create a Drug
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Drug we want to update
     *   }
     * })
     */
    upsert<T extends DrugUpsertArgs>(args: Prisma.SelectSubset<T, DrugUpsertArgs<ExtArgs>>): Prisma.Prisma__DrugClient<runtime.Types.Result.GetResult<Prisma.$DrugPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of Drugs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DrugCountArgs} args - Arguments to filter Drugs to count.
     * @example
     * // Count the number of Drugs
     * const count = await prisma.drug.count({
     *   where: {
     *     // ... the filter for the Drugs we want to count
     *   }
     * })
    **/
    count<T extends DrugCountArgs>(args?: Prisma.Subset<T, DrugCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], DrugCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a Drug.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DrugAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DrugAggregateArgs>(args: Prisma.Subset<T, DrugAggregateArgs>): Prisma.PrismaPromise<GetDrugAggregateType<T>>;
    /**
     * Group by Drug.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DrugGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<T extends DrugGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: DrugGroupByArgs['orderBy'];
    } : {
        orderBy?: DrugGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, DrugGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDrugGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Drug model
     */
    readonly fields: DrugFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for Drug.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__DrugClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    inventoryBatches<T extends Prisma.Drug$inventoryBatchesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Drug$inventoryBatchesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$InventoryBatchPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    saleItems<T extends Prisma.Drug$saleItemsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Drug$saleItemsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SaleItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
/**
 * Fields of the Drug model
 */
export interface DrugFieldRefs {
    readonly id: Prisma.FieldRef<"Drug", 'String'>;
    readonly brandName: Prisma.FieldRef<"Drug", 'String'>;
    readonly genericName: Prisma.FieldRef<"Drug", 'String'>;
    readonly category: Prisma.FieldRef<"Drug", 'String'>;
    readonly manufacturer: Prisma.FieldRef<"Drug", 'String'>;
    readonly requiresPrescription: Prisma.FieldRef<"Drug", 'Boolean'>;
    readonly reorderLevel: Prisma.FieldRef<"Drug", 'Int'>;
    readonly sku: Prisma.FieldRef<"Drug", 'String'>;
    readonly createdAt: Prisma.FieldRef<"Drug", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Drug", 'DateTime'>;
}
/**
 * Drug findUnique
 */
export type DrugFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Drug
     */
    select?: Prisma.DrugSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Drug
     */
    omit?: Prisma.DrugOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.DrugInclude<ExtArgs> | null;
    /**
     * Filter, which Drug to fetch.
     */
    where: Prisma.DrugWhereUniqueInput;
};
/**
 * Drug findUniqueOrThrow
 */
export type DrugFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Drug
     */
    select?: Prisma.DrugSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Drug
     */
    omit?: Prisma.DrugOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.DrugInclude<ExtArgs> | null;
    /**
     * Filter, which Drug to fetch.
     */
    where: Prisma.DrugWhereUniqueInput;
};
/**
 * Drug findFirst
 */
export type DrugFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Drug
     */
    select?: Prisma.DrugSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Drug
     */
    omit?: Prisma.DrugOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.DrugInclude<ExtArgs> | null;
    /**
     * Filter, which Drug to fetch.
     */
    where?: Prisma.DrugWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Drugs to fetch.
     */
    orderBy?: Prisma.DrugOrderByWithRelationInput | Prisma.DrugOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Drugs.
     */
    cursor?: Prisma.DrugWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Drugs from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Drugs.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Drugs.
     */
    distinct?: Prisma.DrugScalarFieldEnum | Prisma.DrugScalarFieldEnum[];
};
/**
 * Drug findFirstOrThrow
 */
export type DrugFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Drug
     */
    select?: Prisma.DrugSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Drug
     */
    omit?: Prisma.DrugOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.DrugInclude<ExtArgs> | null;
    /**
     * Filter, which Drug to fetch.
     */
    where?: Prisma.DrugWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Drugs to fetch.
     */
    orderBy?: Prisma.DrugOrderByWithRelationInput | Prisma.DrugOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Drugs.
     */
    cursor?: Prisma.DrugWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Drugs from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Drugs.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Drugs.
     */
    distinct?: Prisma.DrugScalarFieldEnum | Prisma.DrugScalarFieldEnum[];
};
/**
 * Drug findMany
 */
export type DrugFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Drug
     */
    select?: Prisma.DrugSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Drug
     */
    omit?: Prisma.DrugOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.DrugInclude<ExtArgs> | null;
    /**
     * Filter, which Drugs to fetch.
     */
    where?: Prisma.DrugWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Drugs to fetch.
     */
    orderBy?: Prisma.DrugOrderByWithRelationInput | Prisma.DrugOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Drugs.
     */
    cursor?: Prisma.DrugWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Drugs from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Drugs.
     */
    skip?: number;
    distinct?: Prisma.DrugScalarFieldEnum | Prisma.DrugScalarFieldEnum[];
};
/**
 * Drug create
 */
export type DrugCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Drug
     */
    select?: Prisma.DrugSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Drug
     */
    omit?: Prisma.DrugOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.DrugInclude<ExtArgs> | null;
    /**
     * The data needed to create a Drug.
     */
    data: Prisma.XOR<Prisma.DrugCreateInput, Prisma.DrugUncheckedCreateInput>;
};
/**
 * Drug createMany
 */
export type DrugCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many Drugs.
     */
    data: Prisma.DrugCreateManyInput | Prisma.DrugCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * Drug createManyAndReturn
 */
export type DrugCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Drug
     */
    select?: Prisma.DrugSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Drug
     */
    omit?: Prisma.DrugOmit<ExtArgs> | null;
    /**
     * The data used to create many Drugs.
     */
    data: Prisma.DrugCreateManyInput | Prisma.DrugCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * Drug update
 */
export type DrugUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Drug
     */
    select?: Prisma.DrugSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Drug
     */
    omit?: Prisma.DrugOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.DrugInclude<ExtArgs> | null;
    /**
     * The data needed to update a Drug.
     */
    data: Prisma.XOR<Prisma.DrugUpdateInput, Prisma.DrugUncheckedUpdateInput>;
    /**
     * Choose, which Drug to update.
     */
    where: Prisma.DrugWhereUniqueInput;
};
/**
 * Drug updateMany
 */
export type DrugUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update Drugs.
     */
    data: Prisma.XOR<Prisma.DrugUpdateManyMutationInput, Prisma.DrugUncheckedUpdateManyInput>;
    /**
     * Filter which Drugs to update
     */
    where?: Prisma.DrugWhereInput;
    /**
     * Limit how many Drugs to update.
     */
    limit?: number;
};
/**
 * Drug updateManyAndReturn
 */
export type DrugUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Drug
     */
    select?: Prisma.DrugSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Drug
     */
    omit?: Prisma.DrugOmit<ExtArgs> | null;
    /**
     * The data used to update Drugs.
     */
    data: Prisma.XOR<Prisma.DrugUpdateManyMutationInput, Prisma.DrugUncheckedUpdateManyInput>;
    /**
     * Filter which Drugs to update
     */
    where?: Prisma.DrugWhereInput;
    /**
     * Limit how many Drugs to update.
     */
    limit?: number;
};
/**
 * Drug upsert
 */
export type DrugUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Drug
     */
    select?: Prisma.DrugSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Drug
     */
    omit?: Prisma.DrugOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.DrugInclude<ExtArgs> | null;
    /**
     * The filter to search for the Drug to update in case it exists.
     */
    where: Prisma.DrugWhereUniqueInput;
    /**
     * In case the Drug found by the `where` argument doesn't exist, create a new Drug with this data.
     */
    create: Prisma.XOR<Prisma.DrugCreateInput, Prisma.DrugUncheckedCreateInput>;
    /**
     * In case the Drug was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.DrugUpdateInput, Prisma.DrugUncheckedUpdateInput>;
};
/**
 * Drug delete
 */
export type DrugDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Drug
     */
    select?: Prisma.DrugSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Drug
     */
    omit?: Prisma.DrugOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.DrugInclude<ExtArgs> | null;
    /**
     * Filter which Drug to delete.
     */
    where: Prisma.DrugWhereUniqueInput;
};
/**
 * Drug deleteMany
 */
export type DrugDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Drugs to delete
     */
    where?: Prisma.DrugWhereInput;
    /**
     * Limit how many Drugs to delete.
     */
    limit?: number;
};
/**
 * Drug.inventoryBatches
 */
export type Drug$inventoryBatchesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBatch
     */
    select?: Prisma.InventoryBatchSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryBatch
     */
    omit?: Prisma.InventoryBatchOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.InventoryBatchInclude<ExtArgs> | null;
    where?: Prisma.InventoryBatchWhereInput;
    orderBy?: Prisma.InventoryBatchOrderByWithRelationInput | Prisma.InventoryBatchOrderByWithRelationInput[];
    cursor?: Prisma.InventoryBatchWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.InventoryBatchScalarFieldEnum | Prisma.InventoryBatchScalarFieldEnum[];
};
/**
 * Drug.saleItems
 */
export type Drug$saleItemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SaleItem
     */
    select?: Prisma.SaleItemSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the SaleItem
     */
    omit?: Prisma.SaleItemOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.SaleItemInclude<ExtArgs> | null;
    where?: Prisma.SaleItemWhereInput;
    orderBy?: Prisma.SaleItemOrderByWithRelationInput | Prisma.SaleItemOrderByWithRelationInput[];
    cursor?: Prisma.SaleItemWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SaleItemScalarFieldEnum | Prisma.SaleItemScalarFieldEnum[];
};
/**
 * Drug without action
 */
export type DrugDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Drug
     */
    select?: Prisma.DrugSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Drug
     */
    omit?: Prisma.DrugOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.DrugInclude<ExtArgs> | null;
};
export {};
//# sourceMappingURL=Drug.d.ts.map