import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🌱 Seeding departments...');
    const deptResult = await client.query(`
      INSERT INTO departments (name, description) VALUES
        ('National Highways', 'National highway infrastructure and maintenance'),
        ('State Roads', 'State-level road infrastructure'),
        ('Municipal Roads', 'City and municipal road maintenance'),
        ('Government Hospitals', 'Public healthcare facility infrastructure'),
        ('Government Schools', 'Public school infrastructure and facilities'),
        ('Water & Drainage', 'Water supply and drainage systems'),
        ('Sanitation', 'Waste management and cleanliness'),
        ('Electricity', 'Public electricity infrastructure'),
        ('Public Transport', 'Public transportation facilities'),
        ('Street Lighting', 'Street and public area lighting'),
        ('Public Facilities', 'Parks, toilets, and other public facilities'),
        ('Other', 'Other civic issues')
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name
    `);

    const depts = {};
    deptResult.rows.forEach(d => { depts[d.name] = d.id; });

    // If no departments were inserted (already exist), fetch them
    if (Object.keys(depts).length === 0) {
      const existing = await client.query('SELECT id, name FROM departments');
      existing.rows.forEach(d => { depts[d.name] = d.id; });
    }

    console.log('🌱 Seeding categories...');
    await client.query(`
      INSERT INTO categories (department_id, name, description) VALUES
        ($1, 'Pothole', 'Road surface potholes'),
        ($1, 'Road Damage', 'General road surface damage'),
        ($1, 'Broken Divider', 'Damaged road dividers'),
        ($1, 'Missing Road Sign', 'Missing or damaged road signs'),
        ($2, 'Highway Pothole', 'Potholes on state highways'),
        ($2, 'Road Obstruction', 'Obstructions on state roads'),
        ($2, 'Damaged Signage', 'Damaged highway signs'),
        ($3, 'Highway Pothole', 'Potholes on national highways'),
        ($3, 'Broken Guardrail', 'Damaged highway guardrails'),
        ($3, 'Accident-Prone Area', 'Dangerous highway sections'),
        ($3, 'Damaged Signage', 'Missing or damaged highway signage'),
        ($4, 'Broken Equipment', 'Non-functional medical equipment'),
        ($4, 'Water Problem', 'Water supply issues in hospitals'),
        ($4, 'Cleanliness', 'Hygiene and cleanliness issues'),
        ($4, 'Infrastructure Damage', 'Building and infrastructure damage'),
        ($5, 'Classroom Damage', 'Damaged classrooms'),
        ($5, 'Toilet Problem', 'School toilet issues'),
        ($5, 'Drinking Water', 'Drinking water supply problems'),
        ($5, 'Furniture Damage', 'Damaged school furniture'),
        ($5, 'Building Damage', 'Structural damage to school buildings'),
        ($6, 'Water Leakage', 'Water pipe leakage'),
        ($6, 'Drainage Block', 'Blocked drainage systems'),
        ($6, 'Water Contamination', 'Contaminated water supply'),
        ($7, 'Garbage Accumulation', 'Uncollected garbage'),
        ($7, 'Open Dumping', 'Illegal waste dumping'),
        ($7, 'Public Toilet', 'Public toilet maintenance'),
        ($8, 'Power Outage', 'Electricity supply failure'),
        ($8, 'Exposed Wiring', 'Dangerous exposed electrical wiring'),
        ($8, 'Transformer Issue', 'Transformer malfunction'),
        ($9, 'Bus Stop Damage', 'Damaged bus stops'),
        ($9, 'Route Issue', 'Public transport route problems'),
        ($10, 'Street Light Out', 'Non-functional street lights'),
        ($10, 'Dim Lighting', 'Insufficient street lighting'),
        ($11, 'Park Damage', 'Damaged public parks'),
        ($11, 'Bench/Seating Damage', 'Broken public seating'),
        ($12, 'Other Issue', 'Miscellaneous civic issues')
      ON CONFLICT DO NOTHING
    `, [
      depts['Municipal Roads'], depts['State Roads'], depts['National Highways'],
      depts['Government Hospitals'], depts['Government Schools'],
      depts['Water & Drainage'], depts['Sanitation'], depts['Electricity'],
      depts['Public Transport'], depts['Street Lighting'],
      depts['Public Facilities'], depts['Other']
    ]);

    console.log('🌱 Seeding users...');
    const password = await bcrypt.hash('password123', 12);

    // Demo accounts
    const userResult = await client.query(`
      INSERT INTO users (name, email, phone, password_hash, role, department_id) VALUES
        ('Demo Citizen', 'citizen@example.com', '9876543210', $1, 'CITIZEN', NULL),
        ('Rahul Kumar', 'rahul@example.com', '9876543211', $1, 'CITIZEN', NULL),
        ('Priya Sharma', 'priya@example.com', '9876543212', $1, 'CITIZEN', NULL),
        ('Amit Patel', 'amit@example.com', '9876543213', $1, 'CITIZEN', NULL),
        ('Sneha Reddy', 'sneha@example.com', '9876543214', $1, 'CITIZEN', NULL),
        ('Vikram Singh', 'vikram@example.com', '9876543215', $1, 'CITIZEN', NULL),
        ('Lakshmi Devi', 'lakshmi@example.com', '9876543216', $1, 'CITIZEN', NULL),
        ('Mohammed Ali', 'mohammed@example.com', '9876543217', $1, 'CITIZEN', NULL),
        ('Deepika Nair', 'deepika@example.com', '9876543218', $1, 'CITIZEN', NULL),
        ('Suresh Babu', 'suresh@example.com', '9876543219', $1, 'CITIZEN', NULL),
        ('Roads Admin', 'admin@example.com', '9876543220', $1, 'ADMIN', $2),
        ('Health Admin', 'admin.health@example.com', '9876543221', $1, 'ADMIN', $3),
        ('Water Admin', 'admin.water@example.com', '9876543222', $1, 'ADMIN', $4),
        ('Rajesh Worker', 'worker@example.com', '9876543223', $1, 'WORKER', $2),
        ('Sunil Worker', 'worker2@example.com', '9876543224', $1, 'WORKER', $2),
        ('Ganesh Worker', 'worker3@example.com', '9876543225', $1, 'WORKER', $3),
        ('Ravi Worker', 'worker4@example.com', '9876543226', $1, 'WORKER', $4),
        ('Manoj Worker', 'worker5@example.com', '9876543227', $1, 'WORKER', $5),
        ('Super Admin', 'superadmin@example.com', '9876543228', $1, 'SUPER_ADMIN', NULL)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, email, role
    `, [password, depts['Municipal Roads'], depts['Government Hospitals'], depts['Water & Drainage'], depts['Government Schools']]);

    const users = {};
    userResult.rows.forEach(u => { users[u.email] = u.id; });

    if (Object.keys(users).length === 0) {
      const existing = await client.query("SELECT id, email FROM users");
      existing.rows.forEach(u => { users[u.email] = u.id; });
    }

    console.log('🌱 Seeding complaints...');
    const complaints = [
      { citizen: 'citizen@example.com', dept: 'Municipal Roads', title: 'Large pothole near Government School entrance', desc: 'There is a large pothole approximately 2 meters wide near the government school entrance. Vehicles and students are having difficulty passing through.', city: 'Hyderabad', state: 'Telangana', pincode: '500001', status: 'NEW', priority: 'HIGH' },
      { citizen: 'rahul@example.com', dept: 'Municipal Roads', title: 'Road completely damaged on MG Road', desc: 'The entire stretch of MG Road from Circle to Junction is severely damaged. Multiple potholes and broken surface.', city: 'Bangalore', state: 'Karnataka', pincode: '560001', status: 'UNDER_REVIEW', priority: 'CRITICAL' },
      { citizen: 'priya@example.com', dept: 'Street Lighting', title: 'Street lights not working in Sector 5', desc: 'All street lights in Sector 5, Block B have been non-functional for 2 weeks. Area is very dark at night.', city: 'Hyderabad', state: 'Telangana', pincode: '500032', status: 'ASSIGNED', priority: 'HIGH' },
      { citizen: 'amit@example.com', dept: 'Water & Drainage', title: 'Severe water leakage on Main Street', desc: 'A major water pipe has burst on Main Street causing water wastage and road damage.', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', status: 'IN_PROGRESS', priority: 'CRITICAL' },
      { citizen: 'sneha@example.com', dept: 'Sanitation', title: 'Garbage not collected for 5 days', desc: 'Garbage has not been collected from our colony for the past 5 days. Causing bad smell and health hazard.', city: 'Hyderabad', state: 'Telangana', pincode: '500072', status: 'RESOLVED', priority: 'MEDIUM' },
      { citizen: 'vikram@example.com', dept: 'Government Hospitals', title: 'No water supply in District Hospital', desc: 'District Hospital has no water supply for the past 3 days. Patients and staff are severely affected.', city: 'Warangal', state: 'Telangana', pincode: '506001', status: 'IN_PROGRESS', priority: 'CRITICAL' },
      { citizen: 'lakshmi@example.com', dept: 'Government Schools', title: 'Classroom roof leaking in heavy rain', desc: 'Classroom number 5 in the government primary school has severe roof leakage. Children cannot sit during rain.', city: 'Nizamabad', state: 'Telangana', pincode: '503001', status: 'ASSIGNED', priority: 'HIGH' },
      { citizen: 'mohammed@example.com', dept: 'National Highways', title: 'Broken guardrail on NH-65', desc: 'Guardrail is broken near KM 145 on NH-65. Very dangerous for vehicles especially at night.', city: 'Kurnool', state: 'Andhra Pradesh', pincode: '518001', status: 'NEW', priority: 'HIGH' },
      { citizen: 'deepika@example.com', dept: 'Electricity', title: 'Exposed electrical wiring near playground', desc: 'Live electrical wires are hanging low near the children playground in Central Park. Extreme danger.', city: 'Hyderabad', state: 'Telangana', pincode: '500034', status: 'IN_PROGRESS', priority: 'CRITICAL' },
      { citizen: 'suresh@example.com', dept: 'Public Facilities', title: 'Public toilet in very bad condition', desc: 'The public toilet near bus stand is in extremely unhygienic condition. No water, broken doors.', city: 'Vijayawada', state: 'Andhra Pradesh', pincode: '520001', status: 'NEW', priority: 'MEDIUM' },
      { citizen: 'citizen@example.com', dept: 'State Roads', title: 'Road cave-in near railway crossing', desc: 'The road has caved in near the railway crossing creating a dangerous hole. Vehicles are at risk.', city: 'Secunderabad', state: 'Telangana', pincode: '500003', status: 'UNDER_REVIEW', priority: 'CRITICAL' },
      { citizen: 'rahul@example.com', dept: 'Sanitation', title: 'Open dumping ground near residential area', desc: 'Illegal garbage dumping happening near residential colony. Attracting stray animals and causing disease.', city: 'Bangalore', state: 'Karnataka', pincode: '560043', status: 'CLOSED', priority: 'MEDIUM' },
      { citizen: 'priya@example.com', dept: 'Water & Drainage', title: 'Drainage overflow flooding streets', desc: 'The main drainage near Market Road is overflowing and flooding the entire street and nearby shops.', city: 'Hyderabad', state: 'Telangana', pincode: '500027', status: 'RESOLVED', priority: 'HIGH' },
      { citizen: 'amit@example.com', dept: 'Municipal Roads', title: 'Speed breaker too high causing accidents', desc: 'The newly constructed speed breaker on 5th Cross Road is excessively high and has caused multiple vehicle accidents.', city: 'Chennai', state: 'Tamil Nadu', pincode: '600020', status: 'NEW', priority: 'MEDIUM' },
      { citizen: 'sneha@example.com', dept: 'Government Hospitals', title: 'Broken X-ray machine not replaced', desc: 'The X-ray machine in the outpatient department has been broken for over a month. Patients are being turned away.', city: 'Karimnagar', state: 'Telangana', pincode: '505001', status: 'UNDER_REVIEW', priority: 'HIGH' },
      { citizen: 'vikram@example.com', dept: 'Street Lighting', title: 'Flickering street light causing discomfort', desc: 'The street light at the main intersection keeps flickering constantly. Causing discomfort to nearby residents.', city: 'Hyderabad', state: 'Telangana', pincode: '500038', status: 'CLOSED', priority: 'LOW' },
      { citizen: 'lakshmi@example.com', dept: 'Public Transport', title: 'Bus stop shelter damaged', desc: 'The bus stop shelter at Gandhi Chowk has collapsed partially after recent storm. Waiting passengers have no shade.', city: 'Nizamabad', state: 'Telangana', pincode: '503002', status: 'ASSIGNED', priority: 'MEDIUM' },
      { citizen: 'mohammed@example.com', dept: 'Government Schools', title: 'No drinking water facility', desc: 'The government high school has no functioning drinking water facility. Students bring water from home.', city: 'Kurnool', state: 'Andhra Pradesh', pincode: '518002', status: 'NEW', priority: 'HIGH' },
      { citizen: 'deepika@example.com', dept: 'Municipal Roads', title: 'Broken footpath tiles dangerous for pedestrians', desc: 'Multiple footpath tiles are broken and raised creating tripping hazard for pedestrians especially elderly.', city: 'Hyderabad', state: 'Telangana', pincode: '500063', status: 'REOPENED', priority: 'MEDIUM' },
      { citizen: 'suresh@example.com', dept: 'Water & Drainage', title: 'Contaminated water supply in Colony', desc: 'The tap water in our colony has turned yellowish and has bad odor. Multiple families reporting stomach illness.', city: 'Vijayawada', state: 'Andhra Pradesh', pincode: '520002', status: 'IN_PROGRESS', priority: 'CRITICAL' },
      { citizen: 'citizen@example.com', dept: 'Electricity', title: 'Transformer sparking near market', desc: 'The electricity transformer near the vegetable market is sparking frequently. Risk of fire and electrocution.', city: 'Hyderabad', state: 'Telangana', pincode: '500024', status: 'NEW', priority: 'CRITICAL' },
      { citizen: 'rahul@example.com', dept: 'Government Hospitals', title: 'Waiting area benches broken', desc: 'Most benches in the hospital outpatient waiting area are broken. Elderly patients have to stand for hours.', city: 'Bangalore', state: 'Karnataka', pincode: '560002', status: 'NEW', priority: 'LOW' },
      { citizen: 'priya@example.com', dept: 'Sanitation', title: 'Overflowing community dustbin', desc: 'The community dustbin at Corner Street has been overflowing for a week. Garbage scattered everywhere.', city: 'Hyderabad', state: 'Telangana', pincode: '500044', status: 'ASSIGNED', priority: 'MEDIUM' },
      { citizen: 'amit@example.com', dept: 'National Highways', title: 'Missing road markings on NH-44', desc: 'Road markings have completely faded on a 5km stretch of NH-44. Very confusing for drivers at night.', city: 'Nalgonda', state: 'Telangana', pincode: '508001', status: 'UNDER_REVIEW', priority: 'MEDIUM' },
      { citizen: 'sneha@example.com', dept: 'Public Facilities', title: 'Park swings broken and dangerous', desc: 'The swings in Nehru Park are broken with sharp edges exposed. Children playing there are at risk of injury.', city: 'Hyderabad', state: 'Telangana', pincode: '500050', status: 'NEW', priority: 'HIGH' },
      { citizen: 'vikram@example.com', dept: 'Government Schools', title: 'Playground ground uneven and waterlogged', desc: 'The school playground is severely uneven with multiple waterlogged areas. Students cannot use it after rain.', city: 'Hyderabad', state: 'Telangana', pincode: '500068', status: 'NEW', priority: 'LOW' },
      { citizen: 'lakshmi@example.com', dept: 'Municipal Roads', title: 'Manhole cover missing on busy road', desc: 'A manhole cover is missing on the busy commercial street. Extremely dangerous for two-wheelers and pedestrians.', city: 'Nizamabad', state: 'Telangana', pincode: '503003', status: 'IN_PROGRESS', priority: 'CRITICAL' },
      { citizen: 'mohammed@example.com', dept: 'Water & Drainage', title: 'Water pipeline broken and flooding', desc: 'Underground water pipeline has broken flooding the entire lane. Water supply disrupted for 50+ households.', city: 'Kurnool', state: 'Andhra Pradesh', pincode: '518003', status: 'RESOLVED', priority: 'HIGH' },
      { citizen: 'deepika@example.com', dept: 'Street Lighting', title: 'No lights on new bypass road', desc: 'The newly constructed bypass road has no street lighting installed. Multiple accidents have occurred at night.', city: 'Hyderabad', state: 'Telangana', pincode: '500055', status: 'NEW', priority: 'HIGH' },
      { citizen: 'suresh@example.com', dept: 'Electricity', title: 'Frequent power cuts in Ward 12', desc: 'Ward 12 is experiencing 4-5 hour power cuts daily for the past 2 weeks. Affecting work-from-home residents.', city: 'Vijayawada', state: 'Andhra Pradesh', pincode: '520003', status: 'UNDER_REVIEW', priority: 'MEDIUM' }
    ];

    let complaintSeq = 1;
    for (const c of complaints) {
      const citizenId = users[c.citizen];
      const deptId = depts[c.dept];
      if (!citizenId || !deptId) continue;

      // Get a category for this department
      const catResult = await client.query(
        'SELECT id FROM categories WHERE department_id = $1 LIMIT 1', [deptId]
      );
      const categoryId = catResult.rows[0]?.id || null;

      const complaintNumber = `CF-2026-${String(complaintSeq).padStart(6, '0')}`;

      // Calculate created_at to spread over past 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      const resolvedAt = ['RESOLVED', 'CLOSED'].includes(c.status)
        ? new Date(createdAt.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000)
        : null;
      const closedAt = c.status === 'CLOSED' && resolvedAt
        ? new Date(resolvedAt.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000)
        : null;

      // SLA due date
      const slaHours = { LOW: 168, MEDIUM: 120, HIGH: 72, CRITICAL: 24 };
      const dueDate = new Date(createdAt.getTime() + slaHours[c.priority] * 60 * 60 * 1000);

      await client.query(`
        INSERT INTO complaints (complaint_number, citizen_id, department_id, category_id, title, description,
          city, state, pincode, priority, status, due_date, created_at, updated_at, resolved_at, closed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13, $14, $15)
        ON CONFLICT (complaint_number) DO NOTHING
      `, [complaintNumber, citizenId, deptId, categoryId, c.title, c.desc,
          c.city, c.state, c.pincode, c.priority, c.status, dueDate, createdAt, resolvedAt, closedAt]);

      // Add initial status history
      const compResult = await client.query('SELECT id FROM complaints WHERE complaint_number = $1', [complaintNumber]);
      if (compResult.rows.length > 0) {
        await client.query(`
          INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, comment, created_at)
          VALUES ($1, NULL, 'NEW', $2, 'Complaint submitted', $3)
          ON CONFLICT DO NOTHING
        `, [compResult.rows[0].id, citizenId, createdAt]);
      }

      complaintSeq++;
    }

    // Reset the sequence to be after seeded data
    await client.query(`SELECT setval('complaint_number_seq', 100)`);

    await client.query('COMMIT');
    console.log('✅ Seed completed successfully!');
    console.log('\n📋 Demo Accounts (password: password123):');
    console.log('   Citizen:     citizen@example.com');
    console.log('   Admin:       admin@example.com');
    console.log('   Worker:      worker@example.com');
    console.log('   Super Admin: superadmin@example.com');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
