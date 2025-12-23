import prisma from '../config/database';
import { Prisma } from '@prisma/client';

interface CreateCupboardDto {
  name: string;
  description?: string;
  order?: number;
}

interface UpdateCupboardDto {
  name?: string;
  description?: string;
  order?: number;
}

interface CreateShelfDto {
  cupboardId: string;
  name: string;
  capacity: number;
  order?: number;
}

interface UpdateShelfDto {
  name?: string;
  capacity?: number;
  order?: number;
}

interface AssignToShelfDto {
  shelfId: string;
  batchId: string;
  quantity: number;
}

interface MoveItemDto {
  fromShelfId: string;
  toShelfId: string;
  batchId: string;
  quantity: number;
}

class ShelfManagementService {
  // ==================== CUPBOARD OPERATIONS ====================

  /**
   * Get all cupboards with their shelves
   */
  async getAllCupboards() {
    return await prisma.cupboard.findMany({
      include: {
        shelves: {
          orderBy: { order: 'asc' },
          include: {
            shelfItems: {
              include: {
                drug: true,
                batch: true,
              },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Get cupboard by ID
   */
  async getCupboardById(id: string) {
    return await prisma.cupboard.findUnique({
      where: { id },
      include: {
        shelves: {
          orderBy: { order: 'asc' },
          include: {
            shelfItems: {
              include: {
                drug: true,
                batch: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Create new cupboard
   */
  async createCupboard(data: CreateCupboardDto) {
    return await prisma.cupboard.create({
      data: {
        name: data.name,
        description: data.description,
        order: data.order ?? 0,
      },
      include: {
        shelves: true,
      },
    });
  }

  /**
   * Update cupboard
   */
  async updateCupboard(id: string, data: UpdateCupboardDto) {
    return await prisma.cupboard.update({
      where: { id },
      data,
      include: {
        shelves: true,
      },
    });
  }

  /**
   * Delete cupboard (will cascade delete shelves and shelf items)
   */
  async deleteCupboard(id: string) {
    // First, get all shelf items to update batch assigned quantities
    const cupboard = await prisma.cupboard.findUnique({
      where: { id },
      include: {
        shelves: {
          include: {
            shelfItems: true,
          },
        },
      },
    });

    if (!cupboard) {
      throw new Error('Cupboard not found');
    }

    // Collect all shelf items to unassign
    const shelfItems = cupboard.shelves.flatMap((shelf) => shelf.shelfItems);

    // Use transaction to ensure consistency
    return await prisma.$transaction(async (tx) => {
      // Update batch assigned quantities
      for (const item of shelfItems) {
        await tx.inventoryBatch.update({
          where: { id: item.batchId },
          data: {
            assignedQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Delete cupboard (cascades to shelves and shelf items)
      return await tx.cupboard.delete({
        where: { id },
      });
    });
  }

  // ==================== SHELF OPERATIONS ====================

  /**
   * Get shelf by ID with items
   */
  async getShelfById(id: string) {
    return await prisma.shelf.findUnique({
      where: { id },
      include: {
        cupboard: true,
        shelfItems: {
          include: {
            drug: true,
            batch: true,
          },
        },
      },
    });
  }

  /**
   * Create new shelf in cupboard
   */
  async createShelf(data: CreateShelfDto) {
    return await prisma.shelf.create({
      data: {
        cupboardId: data.cupboardId,
        name: data.name,
        capacity: data.capacity,
        order: data.order ?? 0,
      },
      include: {
        cupboard: true,
        shelfItems: true,
      },
    });
  }

  /**
   * Update shelf
   */
  async updateShelf(id: string, data: UpdateShelfDto) {
    return await prisma.shelf.update({
      where: { id },
      data,
      include: {
        cupboard: true,
        shelfItems: true,
      },
    });
  }

  /**
   * Delete shelf (will cascade delete shelf items)
   */
  async deleteShelf(id: string) {
    // Get shelf items to update batch assigned quantities
    const shelf = await prisma.shelf.findUnique({
      where: { id },
      include: {
        shelfItems: true,
      },
    });

    if (!shelf) {
      throw new Error('Shelf not found');
    }

    // Use transaction
    return await prisma.$transaction(async (tx) => {
      // Update batch assigned quantities
      for (const item of shelf.shelfItems) {
        await tx.inventoryBatch.update({
          where: { id: item.batchId },
          data: {
            assignedQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Delete shelf (cascades to shelf items)
      return await tx.shelf.delete({
        where: { id },
      });
    });
  }

  // ==================== SHELF ITEM OPERATIONS ====================

  /**
   * Assign items from batch to shelf
   */
  async assignItemsToShelf(data: AssignToShelfDto) {
    const { shelfId, batchId, quantity } = data;

    // Validate inputs
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Get batch and shelf in parallel
    const [batch, shelf] = await Promise.all([
      prisma.inventoryBatch.findUnique({
        where: { id: batchId },
        include: { drug: true },
      }),
      prisma.shelf.findUnique({
        where: { id: shelfId },
        include: { shelfItems: true },
      }),
    ]);

    if (!batch) {
      throw new Error('Batch not found');
    }

    if (!shelf) {
      throw new Error('Shelf not found');
    }

    // Calculate unassigned quantity
    const unassignedQuantity = batch.quantity - batch.assignedQuantity;

    if (quantity > unassignedQuantity) {
      throw new Error(
        `Only ${unassignedQuantity} units available to assign (requested: ${quantity})`
      );
    }

    // Check shelf capacity
    if (shelf.currentOccupancy + quantity > shelf.capacity) {
      const availableSpace = shelf.capacity - shelf.currentOccupancy;
      throw new Error(
        `Shelf capacity exceeded. Available space: ${availableSpace} units (requested: ${quantity})`
      );
    }

    // Use transaction
    return await prisma.$transaction(async (tx) => {
      // Check if this batch already has items on this shelf
      const existingShelfItem = await tx.shelfItem.findUnique({
        where: {
          shelfId_drugId_batchId: {
            shelfId,
            drugId: batch.drugId,
            batchId,
          },
        },
      });

      let shelfItem;
      if (existingShelfItem) {
        // Update existing shelf item
        shelfItem = await tx.shelfItem.update({
          where: { id: existingShelfItem.id },
          data: {
            quantity: {
              increment: quantity,
            },
          },
          include: {
            drug: true,
            batch: true,
            shelf: {
              include: {
                cupboard: true,
              },
            },
          },
        });
      } else {
        // Create new shelf item
        shelfItem = await tx.shelfItem.create({
          data: {
            shelfId,
            drugId: batch.drugId,
            batchId,
            quantity,
          },
          include: {
            drug: true,
            batch: true,
            shelf: {
              include: {
                cupboard: true,
              },
            },
          },
        });
      }

      // Update batch assigned quantity
      await tx.inventoryBatch.update({
        where: { id: batchId },
        data: {
          assignedQuantity: {
            increment: quantity,
          },
        },
      });

      // Update shelf occupancy
      await tx.shelf.update({
        where: { id: shelfId },
        data: {
          currentOccupancy: {
            increment: quantity,
          },
        },
      });

      return shelfItem;
    });
  }

  /**
   * Remove items from shelf (return to unassigned inventory)
   */
  async removeItemsFromShelf(shelfItemId: string, quantity: number) {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const shelfItem = await prisma.shelfItem.findUnique({
      where: { id: shelfItemId },
      include: {
        shelf: true,
        batch: true,
      },
    });

    if (!shelfItem) {
      throw new Error('Shelf item not found');
    }

    if (quantity > shelfItem.quantity) {
      throw new Error(`Only ${shelfItem.quantity} units on shelf (requested removal: ${quantity})`);
    }

    return await prisma.$transaction(async (tx) => {
      if (quantity === shelfItem.quantity) {
        // Remove entire shelf item
        await tx.shelfItem.delete({
          where: { id: shelfItemId },
        });
      } else {
        // Decrease quantity
        await tx.shelfItem.update({
          where: { id: shelfItemId },
          data: {
            quantity: {
              decrement: quantity,
            },
          },
        });
      }

      // Update batch assigned quantity
      await tx.inventoryBatch.update({
        where: { id: shelfItem.batchId },
        data: {
          assignedQuantity: {
            decrement: quantity,
          },
        },
      });

      // Update shelf occupancy
      await tx.shelf.update({
        where: { id: shelfItem.shelfId },
        data: {
          currentOccupancy: {
            decrement: quantity,
          },
        },
      });

      return { success: true, removedQuantity: quantity };
    });
  }

  /**
   * Move items from one shelf to another
   */
  async moveItemsBetweenShelves(data: MoveItemDto) {
    const { fromShelfId, toShelfId, batchId, quantity } = data;

    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (fromShelfId === toShelfId) {
      throw new Error('Cannot move items to the same shelf');
    }

    // Get source shelf item and target shelf
    const [sourceShelfItem, targetShelf] = await Promise.all([
      prisma.shelfItem.findFirst({
        where: {
          shelfId: fromShelfId,
          batchId,
        },
        include: {
          drug: true,
          batch: true,
        },
      }),
      prisma.shelf.findUnique({
        where: { id: toShelfId },
      }),
    ]);

    if (!sourceShelfItem) {
      throw new Error('Source shelf item not found');
    }

    if (!targetShelf) {
      throw new Error('Target shelf not found');
    }

    if (quantity > sourceShelfItem.quantity) {
      throw new Error(
        `Only ${sourceShelfItem.quantity} units on source shelf (requested: ${quantity})`
      );
    }

    // Check target shelf capacity
    if (targetShelf.currentOccupancy + quantity > targetShelf.capacity) {
      const availableSpace = targetShelf.capacity - targetShelf.currentOccupancy;
      throw new Error(
        `Target shelf capacity exceeded. Available space: ${availableSpace} units (requested: ${quantity})`
      );
    }

    return await prisma.$transaction(async (tx) => {
      // Decrease or remove from source shelf
      if (quantity === sourceShelfItem.quantity) {
        await tx.shelfItem.delete({
          where: { id: sourceShelfItem.id },
        });
      } else {
        await tx.shelfItem.update({
          where: { id: sourceShelfItem.id },
          data: {
            quantity: {
              decrement: quantity,
            },
          },
        });
      }

      // Update source shelf occupancy
      await tx.shelf.update({
        where: { id: fromShelfId },
        data: {
          currentOccupancy: {
            decrement: quantity,
          },
        },
      });

      // Check if batch already exists on target shelf
      const targetShelfItem = await tx.shelfItem.findUnique({
        where: {
          shelfId_drugId_batchId: {
            shelfId: toShelfId,
            drugId: sourceShelfItem.drugId,
            batchId,
          },
        },
      });

      if (targetShelfItem) {
        // Increment existing
        await tx.shelfItem.update({
          where: { id: targetShelfItem.id },
          data: {
            quantity: {
              increment: quantity,
            },
          },
        });
      } else {
        // Create new
        await tx.shelfItem.create({
          data: {
            shelfId: toShelfId,
            drugId: sourceShelfItem.drugId,
            batchId,
            quantity,
          },
        });
      }

      // Update target shelf occupancy
      await tx.shelf.update({
        where: { id: toShelfId },
        data: {
          currentOccupancy: {
            increment: quantity,
          },
        },
      });

      return { success: true, movedQuantity: quantity };
    });
  }

  /**
   * Get unassigned inventory (drugs with available quantity)
   */
  async getUnassignedInventory() {
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        quantity: {
          gt: prisma.inventoryBatch.fields.assignedQuantity,
        },
      },
      include: {
        drug: true,
        supplier: true,
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    // Calculate unassigned quantity for each batch
    return batches.map((batch) => ({
      ...batch,
      unassignedQuantity: batch.quantity - batch.assignedQuantity,
    }));
  }

  /**
   * Search drugs on specific shelf
   */
  async findDrugOnShelves(drugId: string) {
    const shelfItems = await prisma.shelfItem.findMany({
      where: { drugId },
      include: {
        shelf: {
          include: {
            cupboard: true,
          },
        },
        drug: true,
        batch: true,
      },
    });

    return shelfItems;
  }
}

export const shelfManagementService = new ShelfManagementService();
