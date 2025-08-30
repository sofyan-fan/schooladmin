import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const dbPath = path.join('mock_server', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Hash all existing plain text passwords
const saltRounds = 10;

async function hashPasswords() {
  for (const user of db.users) {
    // Skip if password is already hashed (starts with $2a$)
    if (!user.password.startsWith('$2a$')) {
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      console.log(
        `Hashing password for user ${user.email}: ${user.password} -> ${hashedPassword}`
      );
      user.password = hashedPassword;
    }
  }

  // Write the updated database back
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log('All passwords have been hashed successfully!');
}

hashPasswords().catch(console.error);
