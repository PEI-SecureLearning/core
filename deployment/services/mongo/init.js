// Initialize MongoDB with an application user and seed templates

// Read environment variables - all required, no defaults
const dbName = _getEnv('MONGO_INITDB_DATABASE');
const appUser = _getEnv('MONGO_USER');
const appPassword = _getEnv('MONGO_PASSWORD');

// Validate required environment variables
if (!dbName) {
    throw new Error('MONGO_INITDB_DATABASE environment variable is required');
}
if (!appUser) {
    throw new Error('MONGO_USER environment variable is required');
}
if (!appPassword) {
    throw new Error('MONGO_PASSWORD environment variable is required');
}

db = db.getSiblingDB(dbName);

db.createUser({
    user: appUser,
    pwd: appPassword,
    roles: [
        { role: 'readWrite', db: dbName }
    ]
});

// Load seed metadata
const seedPath = '/docker-entrypoint-initdb.d/templates/seed.json';
const seedData = JSON.parse(cat(seedPath));

// Process templates: load HTML files and merge with metadata
const templatesPath = '/docker-entrypoint-initdb.d/templates/';
const templates = seedData.map(templateMeta => {
    const htmlFile = templatesPath + templateMeta.htmlFile;
    const htmlContent = cat(htmlFile);

    return {
        ...templateMeta,
        html: htmlContent,
        created_at: new Date(),
        updated_at: new Date()
    };
});

db.templates.insertMany(templates);
