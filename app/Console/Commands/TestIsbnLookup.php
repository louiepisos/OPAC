<?php

namespace App\Console\Commands;

use App\Http\Controllers\Api\IsbnLookupController;
use Illuminate\Console\Command;

class TestIsbnLookup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:isbn-lookup {isbn}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test ISBN lookup functionality';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $isbn = $this->argument('isbn');
        $this->info("Testing ISBN lookup for: {$isbn}");

        $controller = new IsbnLookupController();
        
        // Test Google Books directly
        $this->info("Testing Google Books API...");
        $googleResult = $this->callPrivateMethod($controller, 'fromGoogleBooks', [$isbn]);
        if ($googleResult) {
            $this->info("✓ Google Books: Found '{$googleResult['title']}'");
        } else {
            $this->warn("✗ Google Books: No data found");
        }
        
        // Test Open Library directly
        $this->info("Testing Open Library API...");
        $openLibraryResult = $this->callPrivateMethod($controller, 'fromOpenLibrary', [$isbn]);
        if ($openLibraryResult) {
            $this->info("✓ Open Library: Found '{$openLibraryResult['title']}'");
        } else {
            $this->warn("✗ Open Library: No data found");
        }
        
        $response = $controller->show($isbn);
        $data = $response->getData(true);
        
        if ($response->getStatusCode() === 200) {
            $this->info('SUCCESS: Book metadata found');
            $this->line('Title: ' . ($data['book']['title'] ?? 'N/A'));
            $this->line('Authors: ' . implode(', ', $data['book']['author_names'] ?? []));
            $this->line('Publisher: ' . ($data['book']['publisher_name'] ?? 'N/A'));
        } else {
            $this->error('FAILED: ' . ($data['message'] ?? 'Unknown error'));
        }

        return 0;
    }
    
    private function callPrivateMethod($object, $method, $args = [])
    {
        $reflection = new \ReflectionClass($object);
        $method = $reflection->getMethod($method);
        $method->setAccessible(true);
        return $method->invokeArgs($object, $args);
    }
}
