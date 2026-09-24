import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIRECT_URL = "postgresql://postgres.fznzoughqmdrbjvigqwy:Jagapathi%40518@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";


async function runSchema() {
  const client = new Client({
    connectionString: DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database (Direct)');
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing schema...');
    await client.query(schema);
    console.log('✅ Schema executed successfully');
  } catch (err) {
    console.error('❌ Error executing schema:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSchema();
