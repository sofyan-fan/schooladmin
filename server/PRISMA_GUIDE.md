## Prisma quick reference

### Most-used commands

```bash
# Apply schema changes (after editing prisma/schema.prisma)
npx prisma migrate dev --name <change>   # name is just a label; omit to be prompted

# Seed test data
npx prisma db seed

# Regenerate client (usually auto-run by migrate)
npx prisma generate

# Inspect
npx prisma migrate status
npx prisma studio
```

### Docker vs Host

- Docker (run from project root):

```bash
docker compose exec server npx prisma migrate dev --name <change>
docker compose exec server npx prisma db seed
```

- Host (no Docker shell):

```bash
DATABASE_URL="mysql://admin:password@localhost:3306/schooladmin" npx prisma migrate dev --name <change>
DATABASE_URL="mysql://admin:password@localhost:3306/schooladmin" npx prisma db seed
```

### Typical flows

- New or changed schema (keep dev data if possible):

```bash
npx prisma migrate dev --name <change>
```

- Fresh start (OK to drop data):

```bash
npx prisma migrate dev --name <change>   # accept reset (y)
npx prisma db seed
```

- Only reseed:

```bash
npx prisma db seed
```

### Notes

- `--name` is for readability; not required if you accept the prompt.
- Seeder lives at `prisma/seed.js` and can be run anytime; it doesn’t change the schema.
- In Docker use host `db`; on host use `localhost`.

### Quick fix: access denied (P1010)

```bash
docker compose exec db sh -lc 'mysql -uroot -psupersecret -e "GRANT ALL PRIVILEGES ON *.* TO '\''admin'\''@'\''%\'' WITH GRANT OPTION; FLUSH PRIVILEGES;"'
```
