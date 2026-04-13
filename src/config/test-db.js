const { connectDB, prisma } = require('./db'); // Same directory, so just ./db

async function testDatabases() {
  await connectDB();
  
  try {
    console.log('\n🧪 Testing PRIMARY database...');
    const result1 = await prisma.user.count();
    console.log(`✅ PRIMARY DB working! User count: ${result1}`);
  } catch (error) {
    console.error('❌ PRIMARY DB failed:', error.message);
  }

  try {
    console.log('\n🧪 Testing FALLBACK database...');
    const result2 = await prisma.product.count();
    console.log(`✅ FALLBACK DB working! Product count: ${result2}`);
  } catch (error) {
    console.error('❌ FALLBACK DB failed:', error.message);
  }

  process.exit(0);
}

testDatabases();