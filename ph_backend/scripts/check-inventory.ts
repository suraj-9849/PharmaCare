import prisma from '../src/config/database';

async function main() {
  // Get drug categories and counts
  const drugs = await prisma.drug.findMany({
    include: {
      inventoryBatches: {
        select: { quantity: true, assignedQuantity: true }
      }
    }
  });
  
  // Group by category
  const categoryStats: Record<string, { count: number; totalStock: number; unassigned: number; drugs: { name: string; stock: number; unassigned: number }[] }> = {};
  
  drugs.forEach(drug => {
    const cat = drug.category || 'Uncategorized';
    if (!(cat in categoryStats)) {
      categoryStats[cat] = { count: 0, totalStock: 0, unassigned: 0, drugs: [] };
    }
    const stock = drug.inventoryBatches.reduce((sum, b) => sum + b.quantity, 0);
    const unassigned = drug.inventoryBatches.reduce((sum, b) => sum + (b.quantity - b.assignedQuantity), 0);
    categoryStats[cat].count++;
    categoryStats[cat].totalStock += stock;
    categoryStats[cat].unassigned += unassigned;
    categoryStats[cat].drugs.push({ name: drug.brandName, stock, unassigned });
  });
  
  console.log('\n========================================');
  console.log('       INVENTORY ANALYSIS REPORT');
  console.log('========================================\n');
  
  console.log('📊 INVENTORY BY CATEGORY:\n');
  const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1].totalStock - a[1].totalStock);
  
  sortedCategories.forEach(([cat, data]) => {
    console.log(`📦 ${cat}`);
    console.log(`   Drugs: ${data.count} | Total Stock: ${data.totalStock} units | Unassigned: ${data.unassigned} units`);
  });
  
  const totalDrugs = drugs.length;
  const totalCategories = Object.keys(categoryStats).length;
  const totalStock = Object.values(categoryStats).reduce((sum, c) => sum + c.totalStock, 0);
  const totalUnassigned = Object.values(categoryStats).reduce((sum, c) => sum + c.unassigned, 0);
  
  console.log('\n========================================');
  console.log('           SUMMARY');
  console.log('========================================');
  console.log(`Total Drugs: ${totalDrugs}`);
  console.log(`Total Categories: ${totalCategories}`);
  console.log(`Total Stock: ${totalStock} units`);
  console.log(`Total Unassigned: ${totalUnassigned} units`);
  
  console.log('\n========================================');
  console.log('     RECOMMENDED SHELF ORGANIZATION');
  console.log('========================================\n');
  
  // Recommend shelf organization
  if (totalCategories <= 4) {
    console.log('🏪 Suggested: Create 1 shelf per category:\n');
    sortedCategories.forEach(([cat, data], i) => {
      console.log(`Shelf ${i + 1}: "${cat}"`);
      console.log(`   Description: Storage for ${cat.toLowerCase()} medications`);
      console.log(`   Suggested Racks: ${Math.ceil(data.count / 5)} (5 drugs per rack)`);
      console.log(`   Capacity needed: ~${data.unassigned} units\n`);
    });
  } else {
    // Group smaller categories
    console.log('🏪 Suggested shelf structure:\n');
    
    const highVolume = sortedCategories.filter(([_, d]) => d.totalStock > 500);
    const medVolume = sortedCategories.filter(([_, d]) => d.totalStock <= 500 && d.totalStock > 100);
    const lowVolume = sortedCategories.filter(([_, d]) => d.totalStock <= 100);
    
    let shelfNum = 1;
    
    highVolume.forEach(([cat, data]) => {
      console.log(`Shelf ${shelfNum++}: "${cat}"`);
      console.log(`   Description: High-volume ${cat.toLowerCase()} storage`);
      console.log(`   Suggested Racks: ${Math.ceil(data.count / 3)}`);
      console.log(`   Capacity needed: ~${data.unassigned} units\n`);
    });
    
    if (medVolume.length > 0) {
      const medCategories = medVolume.map(([cat]) => cat).join(', ');
      const medTotal = medVolume.reduce((sum, [_, d]) => sum + d.unassigned, 0);
      console.log(`Shelf ${shelfNum++}: "General Medications"`);
      console.log(`   Description: ${medCategories}`);
      console.log(`   Suggested Racks: ${Math.ceil(medVolume.reduce((sum, [_, d]) => sum + d.count, 0) / 4)}`);
      console.log(`   Capacity needed: ~${medTotal} units\n`);
    }
    
    if (lowVolume.length > 0) {
      const lowCategories = lowVolume.map(([cat]) => cat).join(', ');
      const lowTotal = lowVolume.reduce((sum, [_, d]) => sum + d.unassigned, 0);
      console.log(`Shelf ${shelfNum++}: "Specialty & Others"`);
      console.log(`   Description: ${lowCategories}`);
      console.log(`   Suggested Racks: ${Math.ceil(lowVolume.reduce((sum, [_, d]) => sum + d.count, 0) / 4)}`);
      console.log(`   Capacity needed: ~${lowTotal} units\n`);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
