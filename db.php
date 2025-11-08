<?php
$defaultConfig = [
    'host' => '127.0.0.1',
    'user' => 'root',
    'pass' => '',
    'name' => 'budz_reserve',
    'port' => 3306,
];

$envConfig = [
    'host' => getenv('DB_HOST') ?: getenv('MYSQLHOST') ?: $defaultConfig['host'],
    'user' => getenv('DB_USER') ?: getenv('MYSQLUSER') ?: $defaultConfig['user'],
    'pass' => getenv('DB_PASSWORD') ?: getenv('MYSQLPASSWORD') ?: $defaultConfig['pass'],
    'name' => getenv('DB_NAME') ?: getenv('MYSQLDATABASE') ?: $defaultConfig['name'],
    'port' => (int) (getenv('DB_PORT') ?: getenv('MYSQLPORT') ?: $defaultConfig['port']),
];

$databaseUrl = getenv('DATABASE_URL') ?: getenv('CLEARDB_DATABASE_URL');

if (!empty($databaseUrl)) {
    $parts = parse_url($databaseUrl);
    if ($parts !== false) {
        $envConfig['host'] = $parts['host'] ?? $envConfig['host'];
        $envConfig['user'] = $parts['user'] ?? $envConfig['user'];
        $envConfig['pass'] = $parts['pass'] ?? $envConfig['pass'];
        $envConfig['port'] = isset($parts['port']) ? (int) $parts['port'] : $envConfig['port'];

        if (!empty($parts['path'])) {
            $envConfig['name'] = ltrim($parts['path'], '/');
        }
    }
}

$conn = @new mysqli(
    $envConfig['host'],
    $envConfig['user'],
    $envConfig['pass'],
    $envConfig['name'],
    $envConfig['port']
);

if ($conn->connect_error) {
    error_log('Database connection failed: ' . $conn->connect_error);
    http_response_code(500);
    exit('Database connection failed. Please try again later.');
}

$conn->set_charset('utf8mb4');
?>
