#!/usr/bin/env python3
import re

# Read the file
with open('page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Define replacement mappings (order matters!)
replacements = [
    # Interface and type names
    ('interface Cupboard', 'interface Shelf'),
    ('interface Shelf {', 'interface Rack {'),
    ('interface ShelfItem', 'interface RackItem'),
    ('Cupboard[]', 'Shelf[]'),
    ('Shelf[]', 'Rack[]'),
    ('ShelfItem', 'RackItem'),

    # State variables
    ('cupboards', 'shelves'),
    ('setCupboards', 'setShelves'),
    ('selectedCupboardId', 'selectedShelfId'),
    ('setSelectedCupboardId', 'setSelectedShelfId'),
    ('selectedCupboard', 'selectedShelf'),
    ('cupboardsRes', 'shelvesRes'),

    # Cupboard-related
    ('showCupboardDialog', 'showShelfDialog'),
    ('setShowCupboardDialog', 'setShowShelfDialog'),
    ('showDeleteCupboardDialog', 'showDeleteShelfDialog'),
    ('setShowDeleteCupboardDialog', 'setShowDeleteShelfDialog'),
    ('cupboardToDelete', 'shelfToDelete'),
    ('setCupboardToDelete', 'setShelfToDelete'),
    ('cupboardName', 'shelfName'),
    ('setCupboardName', 'setShelfName'),
    ('cupboardDescription', 'shelfDescription'),
    ('setCupboardDescription', 'setShelfDescription'),
    ('createCupboard', 'createShelf'),
    ('deleteCupboard', 'deleteShelf'),

    # Shelf -> Rack mappings
    ('showShelfDialog', 'showRackDialog'),
    ('setShowShelfDialog', 'setShowRackDialog'),
    ('showDeleteShelfDialog', 'showDeleteRackDialog'),
    ('setShowDeleteShelfDialog', 'setShowDeleteRackDialog'),
    ('shelfToDelete', 'rackToDelete'),
    ('setShelfToDelete', 'setRackToDelete'),
    ('shelfName', 'rackName'),
    ('setShelfName', 'setRackName'),
    ('shelfCapacity', 'rackCapacity'),
    ('setShelfCapacity', 'setRackCapacity'),
    ('createShelf', 'createRack'),
    ('deleteShelf', 'deleteRack'),
    ('selectedShelfItem', 'selectedRackItem'),
    ('setSelectedShelfItem', 'setSelectedRackItem'),
    ('draggedShelf', 'draggedRack'),
    ('setDraggedShelf', 'setDraggedRack'),
    ('handleShelfDragStart', 'handleRackDragStart'),
    ('handleShelfDragOver', 'handleRackDragOver'),
    ('handleShelfDragLeave', 'handleRackDragLeave'),
    ('handleShelfDrop', 'handleRackDrop'),
    ('dragOverShelfId', 'dragOverRackId'),
    ('setDragOverShelfId', 'setDragOverRackId'),
    ('targetShelfId', 'targetRackId'),
    ('setTargetShelfId', 'setTargetRackId'),

    # Properties and fields
    ('cupboardId', 'shelfId'),
    ('shelf.id', 'rack.id'),
    ('shelf.name', 'rack.name'),
    ('shelf.capacity', 'rack.capacity'),
    ('shelf.currentOccupancy', 'rack.currentOccupancy'),
    ('shelf.order', 'rack.order'),
    ('shelf.shelfItems', 'rack.rackItems'),

    # UI text - cupboard
    ('"cupboard name"', '"shelf name"'),
    ('"Cupboard', '"Shelf'),
    ('cupboard', 'shelf'),

    # UI text - shelf -> rack
    ('"shelf"', '"rack"'),
    ('"Shelf', '"Rack'),
    (' shelf ', ' rack '),
    (' shelves', ' racks'),
]

# Apply replacements
for old, new in replacements:
    content = content.replace(old, new)

# Write the result
with open('page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacements completed!")
