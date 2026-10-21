<?php
// Run inside the API container with stdin. All test data stays in SQLite memory.
foreach (['DB_CONNECTION' => 'sqlite', 'DB_DATABASE' => ':memory:', 'CACHE_STORE' => 'array', 'SESSION_DRIVER' => 'array', 'LOG_CHANNEL' => 'stderr'] as $key => $value) {
    putenv("$key=$value");
    $_ENV[$key] = $value;
    $_SERVER[$key] = $value;
}
require getcwd().'/vendor/autoload.php';
$app = require getcwd().'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();
set_exception_handler(function (Throwable $error): void { fwrite(STDERR, $error->getMessage().PHP_EOL); exit(1); });
config([
    'database.default' => 'sqlite',
    'database.connections.sqlite.database' => ':memory:',
    'cache.default' => 'array',
    'session.driver' => 'array',
    'logging.default' => 'stderr',
]);
Illuminate\Support\Facades\DB::purge('sqlite');
if (Illuminate\Support\Facades\DB::connection()->getDatabaseName() !== ':memory:') {
    throw new RuntimeException('Refusing to run outside the in-memory database.');
}
foreach (['0001_01_01_000000_create_users_table.php', '2026_10_21_030926_add_role_to_users_table.php', '2026_10_21_030848_create_employees_table.php', '2026_10_21_032803_create_personal_access_tokens_table.php'] as $file) {
    (require getcwd().'/database/migrations/'.$file)->up();
}
$testPassword = 'Integration-Test-Only-42!';
foreach (['admin', 'karyawan'] as $role) {
    App\Models\User::forceCreate(['name' => 'Contract '.$role, 'email' => $role.'@integration.test', 'password' => Illuminate\Support\Facades\Hash::make($testPassword), 'role' => $role]);
}
$checks = 0;
function api(string $method, string $path, ?string $token = null, array $body = [], int $expected = 200): array
{
    global $kernel, $checks;
    Illuminate\Support\Facades\Auth::forgetGuards();
    $request = Illuminate\Http\Request::create('/api'.$path, $method, [], [], [], [
        'HTTP_ACCEPT' => 'application/json',
        'CONTENT_TYPE' => 'application/json',
        ...($token ? ['HTTP_AUTHORIZATION' => 'Bearer '.$token] : []),
    ], json_encode($body));
    $response = $kernel->handle($request);
    $payload = json_decode($response->getContent(), true);
    if ($response->getStatusCode() !== $expected) {
        throw new RuntimeException("$method $path: expected $expected, got ".$response->getStatusCode().' '.json_encode($payload));
    }
    $checks++;
    echo "$method $path => $expected OK\n";
    $kernel->terminate($request, $response);
    return $payload;
}
api('GET', '/employees', expected: 401);
api('POST', '/login', body: ['email' => 'admin@integration.test', 'password' => 'wrong'], expected: 401);
$admin = api('POST', '/login', body: ['email' => 'admin@integration.test', 'password' => $testPassword])['data']['token'];
$employee = api('POST', '/login', body: ['email' => 'karyawan@integration.test', 'password' => $testPassword])['data']['token'];
api('GET', '/user', $admin);
$body = ['name' => 'Contract Employee', 'email' => 'person@integration.test', 'phone' => null, 'department' => 'IT', 'position' => 'Engineer'];
api('POST', '/employees', $employee, $body, 403);
api('POST', '/employees', $admin, [], 422);
$id = api('POST', '/employees', $admin, $body, 201)['data']['id'];
api('GET', '/employees', $employee);
api('GET', '/employees/'.$id, $employee);
api('PUT', '/employees/'.$id, $employee, $body, 403);
api('DELETE', '/employees/'.$id, $employee, expected: 403);
api('POST', '/employees', body: $body, expected: 401);
api('PUT', '/employees/'.$id, body: $body, expected: 401);
api('DELETE', '/employees/'.$id, expected: 401);
$body['name'] = 'Updated Employee';
api('PUT', '/employees/'.$id, $admin, $body);
$search = api('GET', '/employees?search=Updated', $admin);
if (count($search['data']) !== 1) throw new RuntimeException('Search did not return the updated employee.');
api('DELETE', '/employees/'.$id, $admin);
api('POST', '/logout', $admin);
api('GET', '/user', $admin, expected: 401);
echo "Passed $checks API contract checks using isolated test users and SQLite memory.\n";
