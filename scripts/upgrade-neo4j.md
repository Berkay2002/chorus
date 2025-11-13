# Upgrade Neo4j from 5.15.0 to 5.23+ on Digital Ocean

## Current Setup
- **Version:** 5.15.0
- **Location:** Digital Ocean VM (104.248.31.194)
- **Container:** chorus-neo4j
- **Repository:** https://github.com/berkay2002/neo4j-chorus

## Upgrade Steps (SSH Required)

### 1. SSH into your Digital Ocean droplet
```bash
ssh root@104.248.31.194
```

### 2. Navigate to the project directory
```bash
cd ~/neo4j-chorus
```

### 3. Backup your current data (IMPORTANT!)
```bash
# Create backup directory
mkdir -p backups

# Backup current database
docker exec chorus-neo4j neo4j-admin database dump neo4j --to-path=/backups
docker cp chorus-neo4j:/backups ./backups/
```

### 4. Update docker-compose.yml
```bash
nano docker-compose.yml
```

Change the image version from:
```yaml
image: neo4j:5.15.0
```

To:
```yaml
image: neo4j:5.23.0  # Latest stable or 5.24.0 if available
```

### 5. Pull the new image and restart
```bash
# Pull new Neo4j image
docker-compose pull

# Stop current container
docker-compose down

# Start with new version
docker-compose up -d

# Check logs
docker-compose logs -f
```

### 6. Verify the upgrade
```bash
# Check Neo4j version
docker exec -it chorus-neo4j cypher-shell -u neo4j -p Starlight021212 "CALL dbms.components() YIELD name, versions RETURN name, versions[0] as version"

# Or check container
docker exec chorus-neo4j neo4j --version
```

### 7. Verify your data is intact
```bash
# Connect to cypher-shell
docker exec -it chorus-neo4j cypher-shell -u neo4j -p Starlight021212

# Check node count
MATCH (n) RETURN count(n) as nodes;

# Should show 14 nodes (4 users + 4 messages + 5 entities + 1 topic)
```

## Alternative: Use Latest Stable

For the absolute latest stable version:
```yaml
image: neo4j:5-community  # Always pulls latest 5.x
```

Or check available versions:
```bash
docker search neo4j
```

## Rollback Plan (If Something Goes Wrong)

If the upgrade fails:
```bash
# Stop new version
docker-compose down

# Edit docker-compose.yml back to 5.15.0
nano docker-compose.yml

# Start old version
docker-compose up -d

# Restore backup if needed
docker cp backups/neo4j.dump chorus-neo4j:/backups/
docker exec chorus-neo4j neo4j-admin database load neo4j --from-path=/backups
```

## Quick Command Summary
```bash
ssh root@104.248.31.194
cd ~/neo4j-chorus
docker exec chorus-neo4j neo4j-admin database dump neo4j --to-path=/backups
docker cp chorus-neo4j:/backups ./backups/
nano docker-compose.yml  # Change to neo4j:5.23.0
docker-compose pull
docker-compose down
docker-compose up -d
docker exec chorus-neo4j neo4j --version
```

## Notes
- Neo4j 5.x → 5.x upgrades are usually seamless
- Your data volumes persist across container updates
- The upgrade should take ~2-3 minutes
- Your constraints and indexes will be preserved
